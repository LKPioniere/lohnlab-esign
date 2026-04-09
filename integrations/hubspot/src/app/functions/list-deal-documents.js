const STATUS_LABELS = {
  DRAFT: 'Entwurf',
  PENDING: 'Ausstehend',
  COMPLETED: 'Abgeschlossen',
};

const STATUS_VARIANTS = {
  DRAFT: 'info',
  PENDING: 'warning',
  COMPLETED: 'success',
};

exports.main = async (context = {}) => {
  try {
    const dealProperties = context.propertiesToSend || {};
    const dealId = dealProperties.hs_object_id;

    if (!dealId) {
      return { documents: [] };
    }

    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey || !baseUrl) {
      return { error: 'eSign ist nicht konfiguriert.', documents: [] };
    }

    const query = `hubspot-deal-${dealId}`;
    const response = await fetch(
      `${baseUrl}/api/v2/document?query=${encodeURIComponent(query)}&perPage=50`,
      {
        method: 'GET',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Dokumente konnten nicht geladen werden (${response.status}): ${text}`);
    }

    const result = await response.json();
    const rawDocs = result.data || result.documents || [];

    const documents = rawDocs
      .filter((doc) => {
        const extId = doc.externalId || '';
        return extId === `hubspot-deal-${dealId}` || extId.startsWith(`hubspot-deal-${dealId}:`);
      })
      .map((doc) => {
        const status = (doc.status || 'DRAFT').toUpperCase();
        const extId = doc.externalId || '';
        const parts = extId.split(':');
        const assignedProperty = parts.length > 1 ? parts.slice(1).join(':') : null;

        const recipients = (doc.recipients || []).map((r) => ({
          name: r.name || '',
          email: r.email || '',
          role: r.role || '',
          signingStatus: r.signingStatus || '',
        }));

        return {
          documentId: doc.id,
          envelopeId: doc.envelopeId || doc.id,
          title: doc.title || 'Unbenannt',
          status,
          statusLabel: STATUS_LABELS[status] || status,
          statusVariant: STATUS_VARIANTS[status] || 'info',
          createdAt: doc.createdAt || null,
          completedAt: doc.completedAt || null,
          recipients,
          externalId: extId,
          assignedProperty,
          previewUrl: `${baseUrl}/t/lohnlab/documents/${doc.id}`,
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return { documents };
  } catch (error) {
    console.error('list-deal-documents Fehler:', error.message);
    return { error: error.message, documents: [] };
  }
};
