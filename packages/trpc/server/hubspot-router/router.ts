import { router } from '../trpc';
import { getHubspotPropertiesRoute } from './get-properties';

export const hubspotRouter = router({
  getProperties: getHubspotPropertiesRoute,
});
