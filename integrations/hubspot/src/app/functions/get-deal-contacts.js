const hubspotApi = require('@hubspot/api-client');

exports.main = async (context = {}) => {
  try {
    const dealProperties = context.propertiesToSend || {};
    const dealId = dealProperties.hs_object_id;

    if (!dealId) {
      return { contacts: [], owner: null, teamMembers: [] };
    }

    const hubspotClient = new hubspotApi.Client({
      accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN'],
    });

    const associations =
      await hubspotClient.crm.associations.v4.basicApi.getPage(
        'deals',
        dealId,
        'contacts',
        undefined,
        500,
      );

    const contactIds = (associations.results || []).map((a) =>
      String(a.toObjectId),
    );

    const contacts = [];

    for (const cid of contactIds) {
      try {
        const contactResponse =
          await hubspotClient.crm.contacts.basicApi.getById(
            cid,
            ['firstname', 'lastname', 'email'],
          );

        const props = contactResponse.properties || {};

        contacts.push({
          id: cid,
          firstname: props.firstname || '',
          lastname: props.lastname || '',
          email: props.email || '',
          name: [props.firstname, props.lastname].filter(Boolean).join(' ') || '',
        });
      } catch (err) {
        console.error(`Kontakt ${cid} laden Fehler:`, err.message);
      }
    }

    let owner = null;
    try {
      const dealResp = await hubspotClient.crm.deals.basicApi.getById(dealId, ['hubspot_owner_id']);
      const ownerId = dealResp.properties && dealResp.properties.hubspot_owner_id;

      if (ownerId) {
        const ownerResp = await hubspotClient.crm.owners.ownersApi.getById(Number(ownerId));
        owner = {
          id: String(ownerId),
          email: ownerResp.email || '',
          name: [ownerResp.firstName, ownerResp.lastName].filter(Boolean).join(' ') || ownerResp.email || '',
        };
      }
    } catch (err) {
      console.error('Deal-Owner laden Fehler:', err.message);
    }

    let teamMembers = [];
    try {
      const ownersResp = await hubspotClient.crm.owners.ownersApi.getPage();
      const allOwners = ownersResp.results || [];

      teamMembers = allOwners
        .filter((o) => o.email)
        .map((o) => ({
          id: String(o.id),
          email: o.email,
          name: [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'de'));
    } catch (err) {
      console.error('Team-Mitglieder laden Fehler:', err.message);
    }

    return { contacts, owner, teamMembers };
  } catch (error) {
    console.error('get-deal-contacts Fehler:', error.message);
    return { contacts: [], owner: null, teamMembers: [], error: error.message };
  }
};
