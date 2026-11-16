// Verify OR-expression and role/command preservation from pg_policies snapshots.
// This checks structure, not the correctness of the original access rules.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) throw new Error("Provide before and after JSON snapshot paths.");
const before = JSON.parse(readFileSync(beforePath, "utf8"));
const after = JSON.parse(readFileSync(afterPath, "utf8"));
const key = (p) => [p.schemaname, p.tablename, p.roles].join("|");
const commands = ["SELECT", "INSERT", "UPDATE", "DELETE"];
const applies = (p, command) => p.cmd === "ALL" || p.cmd === command;

// Locate top-level tokens, respecting parentheses and SQL quoted strings/names.
function scan(sql, visit) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (quote) {
      if (c === quote) {
        if (sql[i + 1] === quote) i++;
        else quote = null;
      }
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === "(") depth++;
    if (c === ")") depth--;
    visit(i, depth);
  }
}
function stripOuter(sql) {
  sql = sql.trim();
  while (sql.startsWith("(") && sql.endsWith(")")) {
    let outer = true;
    scan(sql, (i, depth) => {
      if (depth === 0 && i < sql.length - 1) outer = false;
    });
    if (!outer) break;
    sql = sql.slice(1, -1).trim();
  }
  return sql;
}
function atoms(sql) {
  sql = stripOuter(sql);
  const parts = [];
  let start = 0;
  scan(sql, (i, depth) => {
    if (depth === 0 && sql.slice(i, i + 4) === " OR ") {
      parts.push(sql.slice(start, i));
      start = i + 4;
    }
  });
  if (parts.length) return [...parts, sql.slice(start)].flatMap(atoms);
  // pg_get_expr emits the same quoted literals in both snapshots.
  return [sql.replace(/\s+/g, " ").trim()];
}
const groups = Map.groupBy(
  before.filter((p) => p.permissive === "PERMISSIVE"),
  key,
);
const merged = new Set();
let predicates = 0;
for (const [groupKey, policies] of groups) {
  if (!commands.some((c) => policies.filter((p) => applies(p, c)).length > 1)) continue;
  merged.add(groupKey);
  for (const command of commands) {
    const original = policies.filter((p) => applies(p, command));
    const current = after.filter(
      (p) => key(p) === groupKey && p.permissive === "PERMISSIVE" && applies(p, command),
    );
    assert.equal(current.length, original.length ? 1 : 0, `${groupKey}/${command}: policy count`);
    if (!original.length) continue;
    for (const kind of ["qual", "with_check"]) {
      if (
        (kind === "qual" && command === "INSERT") ||
        (kind === "with_check" && !["INSERT", "UPDATE"].includes(command))
      )
        continue;
      const expression = (p) =>
        kind === "qual" ? (p.qual ?? "true") : (p.with_check ?? p.qual ?? "true");
      const expected = [...new Set(original.flatMap((p) => atoms(expression(p))))].sort();
      const actual = [...new Set(atoms(expression(current[0])))].sort();
      assert.deepEqual(actual, expected, `${groupKey}/${command}/${kind}`);
      predicates++;
    }
  }
}
let untouched = 0;
for (const p of before) {
  if (p.permissive === "PERMISSIVE" && merged.has(key(p))) continue;
  const current = after.find(
    (a) =>
      a.schemaname === p.schemaname && a.tablename === p.tablename && a.policyname === p.policyname,
  );
  assert.deepEqual(current, p, `Unexpected change: ${key(p)}/${p.policyname}`);
  untouched++;
}
assert.equal(
  after.length,
  untouched +
    [...merged].reduce(
      (sum, k) => sum + commands.filter((c) => groups.get(k).some((p) => applies(p, c))).length,
      0,
    ),
);
console.log(JSON.stringify({ groups: merged.size, predicates, untouched, passed: true }));
