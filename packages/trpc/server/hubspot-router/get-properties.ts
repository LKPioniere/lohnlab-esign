import { TRPCError } from '@trpc/server';

import { authenticatedProcedure } from '../trpc';
import {
  ZGetHubspotPropertiesRequestSchema,
  ZGetHubspotPropertiesResponseSchema,
  type THubspotProperty,
} from './get-properties.types';

const CACHE_TTL_MS = 5 * 60 * 1000;

const propertiesCache = new Map<
  string,
  { data: THubspotProperty[]; timestamp: number }
>();

export const getHubspotPropertiesRoute = authenticatedProcedure
  .input(ZGetHubspotPropertiesRequestSchema)
  .output(ZGetHubspotPropertiesResponseSchema)
  .query(async ({ input }) => {
    const { objectType } = input;

    const accessToken = process.env.NEXT_PRIVATE_HUBSPOT_ACCESS_TOKEN;

    if (!accessToken) {
      return { properties: [], enabled: false };
    }

    const cacheKey = objectType;
    const cached = propertiesCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { properties: cached.data, enabled: true };
    }

    const response = await fetch(
      `https://api.hubapi.com/crm/v3/properties/${objectType}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `HubSpot API error (${response.status}): ${text || response.statusText}`,
      });
    }

    const data = await response.json();

    const properties: THubspotProperty[] = (data.results || [])
      .filter(
        (prop: Record<string, unknown>) =>
          !prop.hidden && !prop.archived,
      )
      .map((prop: Record<string, unknown>) => ({
        name: String(prop.name || ''),
        label: String(prop.label || prop.name || ''),
        type: String(prop.type || 'string'),
        groupName: String(prop.groupName || ''),
      }))
      .sort((a: THubspotProperty, b: THubspotProperty) =>
        a.label.localeCompare(b.label),
      );

    propertiesCache.set(cacheKey, { data: properties, timestamp: Date.now() });

    return { properties, enabled: true };
  });
