import { z } from 'zod';

export const ZHubspotObjectType = z.enum(['deals', 'contacts', 'companies']);

export type THubspotObjectType = z.infer<typeof ZHubspotObjectType>;

export const ZGetHubspotPropertiesRequestSchema = z.object({
  objectType: ZHubspotObjectType,
});

export const ZHubspotPropertySchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.string(),
  groupName: z.string(),
});

export type THubspotProperty = z.infer<typeof ZHubspotPropertySchema>;

export const ZGetHubspotPropertiesResponseSchema = z.object({
  properties: ZHubspotPropertySchema.array(),
  enabled: z.boolean(),
});
