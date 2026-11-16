import { z } from "zod";

const metaPageSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    category: z.string().optional(),
    access_token: z.string().optional(),
    picture: z.object({ data: z.object({ url: z.string().optional() }).optional() }).optional(),
    instagram_business_account: z
      .object({
        id: z.string(),
        username: z.string().optional(),
        name: z.string().optional(),
        profile_picture_url: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

const metaPayloadSchema = z
  .object({
    access_token: z.string().optional(),
    expires_in: z.number().optional(),
    error: z.object({ message: z.string().optional() }).optional(),
    data: z.array(metaPageSchema).optional(),
  })
  .passthrough();

export type MetaPage = z.infer<typeof metaPageSchema>;
export type MetaPayload = z.infer<typeof metaPayloadSchema>;

/** Parse fields used by Meta OAuth handlers while tolerating extra API fields. */
export function parseMetaPayload(value: unknown): MetaPayload {
  const result = metaPayloadSchema.safeParse(value);
  return result.success ? result.data : {};
}
