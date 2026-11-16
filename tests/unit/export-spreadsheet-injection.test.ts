// @vitest-environment node
import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { generate } from "@/lib/exports/generators.server";

describe("database export spreadsheet safety", () => {
  it("neutralizes formula strings, including whitespace prefixes, and retains negative numbers", async () => {
    const values = ["=1+1", "+1+1", "-1+1", "@SUM(A1)", "  =1+1", "\t=1+1", -123.5, 'a,"b"'];
    const file = await generate(
      { title: "Test", columns: ["value"], rows: values.map((value) => ({ value })) },
      "csv",
    );
    const csv = new TextDecoder().decode(file.bytes);
    expect(csv).toBe(
      "value\n'=1+1\n'+1+1\n'-1+1\n'@SUM(A1)\n'  =1+1\n'\t=1+1\n-123.5\n\"a,\"\"b\"\"\"",
    );
  });
  it("stores database JSON as Excel text, never an executable cell formula", async () => {
    const file = await generate(
      { title: "Test", columns: ["value"], rows: [{ value: { formula: "1+1", result: 2 } }] },
      "excel",
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.bytes as never);
    const cell = workbook.getWorksheet(1)!.getCell("A2");
    expect(cell.type).toBe(ExcelJS.ValueType.String);
    expect(cell.value).toBe('{"formula":"1+1","result":2}');
  });
});
