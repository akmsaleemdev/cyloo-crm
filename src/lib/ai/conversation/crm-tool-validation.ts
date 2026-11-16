import { z } from "zod";

const text = z.string().max(500);
const notes = z.string().max(10000).nullable();
const tags = z.array(z.string().min(1).max(100)).max(50);
const schemas = {
  contact: z
    .object({
      name: text,
      first_name: text.nullable(),
      last_name: text.nullable(),
      email: z.string().email().max(320).nullable(),
      phone: z.string().max(50).nullable(),
      job_title: text.nullable(),
      notes,
      source: text.nullable(),
      tags,
      do_not_contact: z.boolean(),
    })
    .partial()
    .strict(),
  lead: z
    .object({
      first_name: text.nullable(),
      last_name: text.nullable(),
      company_name: text.nullable(),
      email: z.string().email().max(320).nullable(),
      phone: z.string().max(50).nullable(),
      job_title: text.nullable(),
      notes,
      source: text.nullable(),
      tags,
    })
    .partial()
    .strict(),
  deal: z
    .object({
      title: text,
      description: notes,
      amount: z.number().finite().nonnegative(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      probability: z.number().min(0).max(100),
      expected_close_date: z.string().date().nullable(),
      tags,
    })
    .partial()
    .strict(),
  task: z
    .object({
      title: text,
      description: notes,
      due_at: z.string().datetime({ offset: true }).nullable(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      tags,
    })
    .partial()
    .strict(),
};

/** Reject scope, ownership, relationship, audit and arbitrary column changes. */
export function validateCrmPatch(entity: keyof typeof schemas, fields: unknown) {
  const patch = schemas[entity].parse(fields);
  if (Object.keys(patch).length === 0) throw new Error("At least one editable field is required");
  return patch;
}
