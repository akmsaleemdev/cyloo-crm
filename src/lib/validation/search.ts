import { z } from "zod";

/** Preserve typed search inputs/defaults using the supported Zod 4 API. */
export function zodValidator<TSchema extends z.ZodType>(schema: TSchema) {
  return {
    types: {
      input: undefined as unknown as z.input<TSchema>,
      output: undefined as unknown as z.output<TSchema>,
    },
    parse: (input: unknown): z.output<TSchema> => schema.parse(input),
  };
}

export function fallback<TSchema extends z.ZodType>(schema: TSchema, value: z.output<TSchema>) {
  return z.custom<z.input<TSchema>>().pipe(schema.catch(() => value));
}
