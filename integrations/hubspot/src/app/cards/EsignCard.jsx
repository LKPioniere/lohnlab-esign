import React, { useState, useEffect, useCallback } from 'react';
import {
  hubspot,
  Alert,
  Box,
  Button,
  Divider,
  Flex,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalFooter,
  Select,
  LoadingSpinner,
  Text,
  Tag,
  MultiSelect,
} from '@hubspot/ui-extensions';

const MODAL_ID = 'esign-send-modal';
const ATTACH_MODAL_ID = 'esign-attach-modal';

const STEPS = {
  LOADING_CONTACTS: 'LOADING_CONTACTS',
  SELECT_CONTACT: 'SELECT_CONTACT',
  LOADING_FIELDS: 'LOADING_FIELDS',
  REVIEW_FIELDS: 'REVIEW_FIELDS',
  ASSIGN_PROPERTY: 'ASSIGN_PROPERTY',
  CREATING: 'CREATING',
  ADDING_CC: 'ADDING_CC',
  PREVIEW: 'PREVIEW',
  DISTRIBUTING: 'DISTRIBUTING',
  SENT: 'SENT',
  ERROR: 'ERROR',
};

const OBJECT_TYPE_ORDER = ['deals', 'contacts', 'companies'];

const OBJECT_TYPE_LABELS = {
  deals: 'Deal',
  contacts: 'Kontakt',
  companies: 'Unternehmen',
};

const LOADING_LABELS = {
  [STEPS.LOADING_CONTACTS]: 'Kontakte werden geladen...',
  [STEPS.LOADING_FIELDS]: 'Felder werden geprüft...',
  [STEPS.CREATING]: 'Dokument wird erstellt...',
  [STEPS.ADDING_CC]: 'CC-Empfänger werden hinzugefügt...',
  [STEPS.DISTRIBUTING]: 'Dokument wird versendet...',
};

const buildFilePropertyOptions = (fileProperties) => [
  { label: 'Keinem Feld zuordnen', value: '__none__' },
  ...fileProperties.map((p) => ({ label: p.label, value: p.name })),
];

// ─── Entry ──────────────────────────────────────────────────────────────────────

hubspot.extend(({ context, actions }) => (
  <EsignCard context={context} actions={actions} />
));

// ─── Main Card ──────────────────────────────────────────────────────────────────

const EsignCard = ({ context, actions }) => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [createUrl, setCreateUrl] = useState(null);
  const [cardError, setCardError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    loadDocuments();
  }, []);

  const loadDocuments = useCallback(() => {
    setDocumentsLoading(true);
    hubspot.serverless('list-deal-documents', {
      propertiesToSend: ['hs_object_id'],
      parameters: {},
    })
      .then((r) => {
        setDocuments((r && r.documents) || []);
        setDocumentsLoading(false);
      })
      .catch(() => setDocumentsLoading(false));
  }, []);

  const loadTemplates = useCallback(() => {
    setLoading(true);
    setCardError(null);

    Promise.all([
      hubspot.serverless('get-templates', {
        propertiesToSend: ['hs_object_id'],
        parameters: {},
      }).then((r) => {
        if (r && r.error) {
          throw new Error(r.error);
        }
        return (r && r.templates) || [];
      }),
      hubspot.serverless('create-presign-token', {
        propertiesToSend: ['hs_object_id'],
        parameters: {},
      })
        .then((r) => (r && r.embedUrl) || null)
        .catch(() => null),
    ])
      .then(([tList, embedUrl]) => {
        setTemplates(tList);
        setCreateUrl(embedUrl);
        setLoading(false);
      })
      .catch((err) => {
        setCardError(err.message || 'Vorlagen konnten nicht geladen werden.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSpinner label="Wird geladen..." />;
  }

  if (cardError) {
    return (
      <Flex direction="column" gap="sm">
        <Alert title="Fehler" variant="error">{cardError}</Alert>
        <Button variant="secondary" onClick={loadTemplates}>Nochmal versuchen</Button>
      </Flex>
    );
  }

  const templateUrl = createUrl || 'https://esign.lohnlab.de/t/lohnlab/templates?from=hubspot';
  const options = templates.map((t) => ({ label: t.title, value: String(t.id) }));

  return (
    <Flex direction="column" gap="md">
      <DocumentList
        documents={documents}
        loading={documentsLoading}
        actions={actions}
        onRefresh={loadDocuments}
      />

      <Divider />

      {templates.length === 0 ? (
        <>
          <Text format={{ fontWeight: 'bold' }}>Noch keine Vorlagen</Text>
          <Text>Erstelle deine erste Vorlage in LohnLab eSign, um Dokumente direkt aus HubSpot zu versenden.</Text>
          <Button variant="primary" href={{ url: templateUrl, external: true }}>
            Neue Vorlage
          </Button>
        </>
      ) : (
        <>
          <Text>Wähle eine Vorlage zum Befüllen und Versenden aus.</Text>
          <Select
            label="Vorlage"
            placeholder="Bitte Vorlage wählen..."
            options={options}
            value={selectedTemplateId}
            onChange={(v) => setSelectedTemplateId(v)}
          />
          <Flex direction="row" gap="sm">
            <Button
              variant="primary"
              disabled={!selectedTemplateId}
              overlay={
                selectedTemplateId ? (
                  <SendModal
                    templateId={selectedTemplateId}
                    templateTitle={(templates.find((t) => String(t.id) === String(selectedTemplateId)) || {}).title || ''}
                    actions={actions}
                    onSent={loadDocuments}
                  />
                ) : undefined
              }
            >
              Befüllen
            </Button>
            <Button variant="secondary" href={{ url: templateUrl, external: true }}>
              Neue Vorlage
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
};

// ─── Document List ──────────────────────────────────────────────────────────────

const DocumentList = ({ documents, loading, actions, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [attachingDocId, setAttachingDocId] = useState(null);
  const [fileProperties, setFileProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachResult, setAttachResult] = useState(null);
  const [attachError, setAttachError] = useState(null);

  if (loading) {
    return <LoadingSpinner label="Dokumente laden..." />;
  }

  const docCount = documents.length;

  const handleAttachStart = (doc) => {
    setAttachingDocId(doc.documentId);
    setSelectedProperty(doc.assignedProperty || null);
    setAttachResult(null);
    setAttachError(null);
    setAttachLoading(true);

    hubspot.serverless('get-file-properties', {
      propertiesToSend: ['hs_object_id'],
      parameters: {},
    })
      .then((r) => {
        setFileProperties((r && r.properties) || []);
        setAttachLoading(false);
      })
      .catch(() => {
        setFileProperties([]);
        setAttachLoading(false);
      });

    actions.openOverlay(ATTACH_MODAL_ID);
  };

  const handleAttach = () => {
    if (!attachingDocId) {
      return;
    }
    setAttachLoading(true);
    setAttachError(null);

    hubspot.serverless('attach-document', {
      propertiesToSend: ['hs_object_id'],
      parameters: {
        documentId: String(attachingDocId),
        dealPropertyName: selectedProperty || undefined,
      },
    })
      .then((r) => {
        if (r.error) {
          throw new Error(r.error);
        }
        setAttachResult(r);
        setAttachLoading(false);
      })
      .catch((err) => {
        setAttachError(err.message || 'PDF konnte nicht abgelegt werden.');
        setAttachLoading(false);
      });
  };

  return (
    <>
      <Flex direction="row" gap="sm" align="center" justify="between">
        <Text format={{ fontWeight: 'bold' }}>
          Dokumente ({docCount})
        </Text>
        {docCount > 0 && (
          <Button variant="secondary" size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Ausblenden' : 'Anzeigen'}
          </Button>
        )}
      </Flex>

      {docCount === 0 && (
        <Alert title="Keine Dokumente" variant="info">
          Noch keine Dokumente für diesen Deal.
        </Alert>
      )}

      {expanded && docCount > 0 && (
        <Box css={{ borderTop: '1px solid #cbd6e2', paddingTop: '8px' }}>
          <Flex direction="column" gap="xs">
            {documents.map((doc, idx) => (
              <React.Fragment key={doc.documentId}>
                <Flex direction="row" gap="sm" align="center" wrap="wrap">
                  <Box css={{ flex: '1 1 auto', minWidth: '0' }}>
                    <Link href={doc.previewUrl} external={true}>
                      {doc.title}
                    </Link>
                  </Box>
                  <Tag variant={doc.statusVariant}>{doc.statusLabel}</Tag>
                  {doc.status === 'COMPLETED' && (
                    <Button variant="secondary" size="small" onClick={() => handleAttachStart(doc)}>
                      PDF ablegen
                    </Button>
                  )}
                </Flex>
                {idx < documents.length - 1 && (
                  <Divider />
                )}
              </React.Fragment>
            ))}
          </Flex>
        </Box>
      )}

      <AttachModal
        attachLoading={attachLoading}
        attachResult={attachResult}
        attachError={attachError}
        fileProperties={fileProperties}
        selectedProperty={selectedProperty}
        onPropertyChange={(v) => setSelectedProperty(v === '__none__' ? null : v)}
        onAttach={handleAttach}
        onRetry={() => setAttachError(null)}
        onClose={() => {
          actions.closeOverlay(ATTACH_MODAL_ID);
          onRefresh();
        }}
        onCancel={() => actions.closeOverlay(ATTACH_MODAL_ID)}
      />
    </>
  );
};

// ─── Attach Modal ───────────────────────────────────────────────────────────────

const AttachModal = ({
  attachLoading,
  attachResult,
  attachError,
  fileProperties,
  selectedProperty,
  onPropertyChange,
  onAttach,
  onRetry,
  onClose,
  onCancel,
}) => {
  const renderBody = () => {
    if (attachLoading) {
      return (
        <ModalBody>
          <LoadingSpinner label="Wird verarbeitet..." />
        </ModalBody>
      );
    }

    if (attachResult) {
      return (
        <>
          <ModalBody>
            <Alert title="PDF abgelegt" variant="success">
              {attachResult.dealPropertyName
                ? 'Das signierte PDF wurde hochgeladen und dem Deal-Feld zugeordnet.'
                : 'Das signierte PDF wurde in den HubSpot-Dateien abgelegt.'}
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={onClose}>Schließen</Button>
          </ModalFooter>
        </>
      );
    }

    if (attachError) {
      return (
        <>
          <ModalBody>
            <Alert title="Fehler" variant="error">{attachError}</Alert>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={onRetry}>Nochmal versuchen</Button>
            <Button onClick={onCancel}>Abbrechen</Button>
          </ModalFooter>
        </>
      );
    }

    return (
      <>
        <ModalBody>
          <Flex direction="column" gap="md">
            <Text>
              Das signierte PDF wird heruntergeladen und in den HubSpot-Dateien abgelegt.
              Optional kannst du es einem Deal-Feld zuordnen.
            </Text>
            <Select
              label="Deal-Feld zuordnen"
              placeholder="Feld wählen..."
              options={buildFilePropertyOptions(fileProperties)}
              value={selectedProperty || '__none__'}
              onChange={onPropertyChange}
            />
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={onAttach}>PDF ablegen</Button>
          <Button onClick={onCancel}>Abbrechen</Button>
        </ModalFooter>
      </>
    );
  };

  return (
    <Modal id={ATTACH_MODAL_ID} title="PDF im Deal ablegen" width="md">
      {renderBody()}
    </Modal>
  );
};

// ─── Send Modal ─────────────────────────────────────────────────────────────────

const SendModal = ({ templateId, templateTitle, actions, onSent }) => {
  const [step, setStep] = useState(STEPS.LOADING_CONTACTS);
  const [contacts, setContacts] = useState([]);
  const [owner, setOwner] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [manualEmail, setManualEmail] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [reviewPage, setReviewPage] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [fileProperties, setFileProperties] = useState([]);
  const [assignedProperty, setAssignedProperty] = useState(null);
  const [filePropsLoading, setFilePropsLoading] = useState(false);

  const [ccRecipientIds, setCcRecipientIds] = useState([]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = useCallback(() => {
    setStep(STEPS.LOADING_CONTACTS);
    hubspot.serverless('get-deal-contacts', {
      propertiesToSend: ['hs_object_id'],
      parameters: {},
    })
      .then((r) => {
        const list = (r && r.contacts) || [];
        setContacts(list);
        const loadedOwner = r && r.owner ? r.owner : null;
        setOwner(loadedOwner);
        setTeamMembers((r && r.teamMembers) || []);

        if (loadedOwner) {
          setCcRecipientIds([loadedOwner.id]);
        }

        if (list.length === 1 && list[0].email) {
          setSelectedContactId(list[0].id);
          loadFields(list[0].id);
        } else {
          if (list.length === 1) {
            setSelectedContactId(list[0].id);
          }
          setStep(STEPS.SELECT_CONTACT);
        }
      })
      .catch((err) => {
        setError(err.message || 'Kontakte konnten nicht geladen werden.');
        setStep(STEPS.ERROR);
      });
  }, []);

  const loadFields = useCallback((cId) => {
    setStep(STEPS.LOADING_FIELDS);
    hubspot.serverless('check-fields', {
      propertiesToSend: ['hs_object_id'],
      parameters: { templateId, contactId: cId || selectedContactId },
    })
      .then((r) => {
        if (r.error) {
          throw new Error(r.error);
        }
        const allFields = r.fields || [];
        setFields(allFields);

        const initial = {};
        for (const f of allFields) {
          initial[`${f.objectType}:${f.propertyName}`] = f.currentValue || '';
        }
        setFieldValues(initial);
        setReviewPage(0);
        setStep(STEPS.REVIEW_FIELDS);
      })
      .catch((err) => {
        setError(err.message || 'Felder konnten nicht geprüft werden.');
        setStep(STEPS.ERROR);
      });
  }, [templateId, selectedContactId]);

  const handleContactNext = useCallback(() => {
    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact) {
      return;
    }
    const email = contact.email || manualEmail;
    if (!email || !email.includes('@')) {
      return;
    }
    loadFields(selectedContactId);
  }, [selectedContactId, contacts, manualEmail, loadFields]);

  const handleFieldChange = useCallback((key, value) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleGoToAssignProperty = useCallback(() => {
    setFilePropsLoading(true);
    setStep(STEPS.ASSIGN_PROPERTY);

    hubspot.serverless('get-file-properties', {
      propertiesToSend: ['hs_object_id'],
      parameters: {},
    })
      .then((r) => {
        setFileProperties((r && r.properties) || []);
        setFilePropsLoading(false);
      })
      .catch(() => {
        setFileProperties([]);
        setFilePropsLoading(false);
      });
  }, []);

  const [skipPreview, setSkipPreview] = useState(false);

  const handleCreate = useCallback((directSend) => {
    const shouldSkip = directSend === true;
    setSkipPreview(shouldSkip);
    setStep(STEPS.CREATING);
    setError(null);

    const contact = contacts.find((c) => c.id === selectedContactId);
    const email = (contact && contact.email) || manualEmail;
    const name = contact ? contact.name : '';

    const overrides = {};
    for (const f of fields) {
      const key = `${f.objectType}:${f.propertyName}`;
      const newVal = fieldValues[key] || '';
      if (newVal !== (f.currentValue || '')) {
        overrides[key] = newVal;
      }
    }

    hubspot.serverless('send-contract', {
      propertiesToSend: ['hs_object_id'],
      parameters: {
        templateId,
        contactId: selectedContactId || undefined,
        contactEmail: email,
        contactName: name,
        fieldOverrides: Object.keys(overrides).length > 0 ? JSON.stringify(overrides) : undefined,
        assignedProperty: assignedProperty || undefined,
      },
    })
      .then((r) => {
        if (r.error) {
          throw new Error(r.error);
        }
        setResult(r);

        const ccEmails = [];
        const addedEmails = new Set();

        for (const memberId of ccRecipientIds) {
          const member = teamMembers.find((m) => m.id === memberId);
          if (member && member.email && !addedEmails.has(member.email.toLowerCase())) {
            ccEmails.push({ email: member.email, name: member.name });
            addedEmails.add(member.email.toLowerCase());
          }
        }

        const nextStep = shouldSkip ? STEPS.DISTRIBUTING : STEPS.PREVIEW;

        if (ccEmails.length > 0) {
          setStep(STEPS.ADDING_CC);
          hubspot.serverless('add-cc-recipients', {
            propertiesToSend: ['hs_object_id'],
            parameters: {
              envelopeId: r.envelopeId,
              ccEmailsJson: JSON.stringify(ccEmails),
            },
          })
            .then(() => {
              if (shouldSkip) {
                distributeEnvelope(r.envelopeId);
              } else {
                setStep(STEPS.PREVIEW);
              }
            })
            .catch(() => {
              if (shouldSkip) {
                distributeEnvelope(r.envelopeId);
              } else {
                setStep(STEPS.PREVIEW);
              }
            });
        } else {
          if (shouldSkip) {
            distributeEnvelope(r.envelopeId);
          } else {
            setStep(STEPS.PREVIEW);
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Dokument konnte nicht erstellt werden.');
        setStep(STEPS.ERROR);
      });
  }, [templateId, selectedContactId, contacts, manualEmail, fields, fieldValues, assignedProperty, ccRecipientIds, teamMembers]);

  const distributeEnvelope = useCallback((envelopeId) => {
    setStep(STEPS.DISTRIBUTING);
    setError(null);

    hubspot.serverless('distribute-contract', {
      propertiesToSend: [],
      parameters: { envelopeId },
    })
      .then((r) => {
        if (r.error) {
          throw new Error(r.error);
        }
        setStep(STEPS.SENT);
        if (onSent) {
          onSent();
        }
      })
      .catch((err) => {
        setError(err.message || 'Dokument konnte nicht versendet werden.');
        setStep(STEPS.ERROR);
      });
  }, [onSent]);

  const handleDistribute = useCallback(() => {
    if (!result || !result.envelopeId) {
      setError('Keine Dokument-ID vorhanden.');
      setStep(STEPS.ERROR);
      return;
    }
    distributeEnvelope(result.envelopeId);
  }, [result, distributeEnvelope]);


  const renderContent = () => {
    if (LOADING_LABELS[step]) {
      return (
        <ModalBody>
          <LoadingSpinner label={LOADING_LABELS[step]} />
        </ModalBody>
      );
    }

    if (step === STEPS.SELECT_CONTACT) {
      return (
        <SelectContactStep
          contacts={contacts}
          selectedContactId={selectedContactId}
          manualEmail={manualEmail}
          teamMembers={teamMembers}
          ccRecipientIds={ccRecipientIds}
          onSelectContact={(v) => { setSelectedContactId(v); setManualEmail(''); }}
          onEmailChange={setManualEmail}
          onCcChange={setCcRecipientIds}
          onNext={handleContactNext}
          onCancel={() => actions.closeOverlay(MODAL_ID)}
        />
      );
    }

    if (step === STEPS.REVIEW_FIELDS) {
      return (
        <ReviewFieldsStep
          contacts={contacts}
          selectedContactId={selectedContactId}
          manualEmail={manualEmail}
          fields={fields}
          fieldValues={fieldValues}
          reviewPage={reviewPage}
          onFieldChange={handleFieldChange}
          onPageChange={setReviewPage}
          onNext={handleGoToAssignProperty}
          onBack={() => setStep(STEPS.SELECT_CONTACT)}
        />
      );
    }

    if (step === STEPS.ASSIGN_PROPERTY) {
      return (
        <AssignPropertyStep
          fileProperties={fileProperties}
          filePropsLoading={filePropsLoading}
          assignedProperty={assignedProperty}
          onPropertyChange={(v) => setAssignedProperty(v === '__none__' ? null : v)}
          onNext={() => handleCreate(false)}
          onDirectSend={() => handleCreate(true)}
          onBack={() => setStep(STEPS.REVIEW_FIELDS)}
        />
      );
    }

    if (step === STEPS.PREVIEW) {
      return (
        <PreviewStep
          result={result}
          onDistribute={handleDistribute}
          onCancel={() => actions.closeOverlay(MODAL_ID)}
        />
      );
    }

    if (step === STEPS.SENT) {
      return (
        <SentStep
          result={result}
          onClose={() => actions.closeOverlay(MODAL_ID)}
        />
      );
    }

    if (step === STEPS.ERROR) {
      return (
        <ErrorStep
          error={error}
          onRetry={loadContacts}
          onClose={() => actions.closeOverlay(MODAL_ID)}
        />
      );
    }

    return null;
  };

  return (
    <Modal id={MODAL_ID} title={`Dokument senden – ${templateTitle}`} width="md">
      {renderContent()}
    </Modal>
  );
};

// ─── Step: Select Contact + CC ──────────────────────────────────────────────────

const SelectContactStep = ({
  contacts,
  selectedContactId,
  manualEmail,
  teamMembers,
  ccRecipientIds,
  onSelectContact,
  onEmailChange,
  onCcChange,
  onNext,
  onCancel,
}) => {
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const needsEmail = selectedContact && !selectedContact.email;
  const hasValidEmail = selectedContact
    ? (selectedContact.email || (manualEmail && manualEmail.includes('@')))
    : false;

  const ccOptions = teamMembers.map((m) => ({
    label: `${m.name} (${m.email})`,
    value: m.id,
  }));

  return (
    <>
      <ModalBody>
        <Flex direction="column" gap="md">
          {contacts.length === 0 ? (
            <Alert title="Kein Kontakt verknüpft" variant="error">
              Diesem Deal ist kein Kontakt zugeordnet. Verknüpfe zuerst einen Kontakt mit dem Deal, bevor du ein Dokument versendest.
            </Alert>
          ) : (
            <>
              <Text format={{ fontWeight: 'bold' }}>Empfänger (Unterzeichner)</Text>

              {contacts.length > 1 ? (
                <Select
                  label="Kontakt"
                  placeholder="Bitte Kontakt wählen..."
                  options={contacts.map((c) => ({
                    label: c.name
                      ? `${c.name}${c.email ? ` (${c.email})` : ' – keine E-Mail'}`
                      : c.email || `Kontakt ${c.id}`,
                    value: c.id,
                  }))}
                  value={selectedContactId}
                  onChange={onSelectContact}
                />
              ) : (
                <Alert title="Kontakt" variant="info">
                  {contacts[0].name
                    ? `${contacts[0].name}${contacts[0].email ? ` (${contacts[0].email})` : ''}`
                    : contacts[0].email || `Kontakt ${contacts[0].id}`}
                </Alert>
              )}

              {needsEmail && (
                <>
                  <Alert title="E-Mail fehlt" variant="warning">
                    Für diesen Kontakt ist keine E-Mail-Adresse hinterlegt. Bitte trage eine ein:
                  </Alert>
                  <Input
                    label="E-Mail-Adresse"
                    placeholder="name@beispiel.de"
                    value={manualEmail}
                    onChange={onEmailChange}
                  />
                </>
              )}
            </>
          )}

          <Divider />

          {ccOptions.length > 0 ? (
            <MultiSelect
              label="CC-Empfänger"
              description="Der Deal-Owner ist automatisch vorausgewählt. Weitere Team-Mitglieder optional hinzufügen."
              placeholder="Team-Mitglieder auswählen..."
              options={ccOptions}
              value={ccRecipientIds}
              onChange={onCcChange}
            />
          ) : (
            <Text>Keine Team-Mitglieder verfügbar.</Text>
          )}
        </Flex>
      </ModalBody>
      <ModalFooter>
        {contacts.length > 0 && (
          <Button variant="primary" disabled={!selectedContactId || !hasValidEmail} onClick={onNext}>
            Weiter
          </Button>
        )}
        <Button onClick={onCancel}>Abbrechen</Button>
      </ModalFooter>
    </>
  );
};

// ─── Step: Review Fields ────────────────────────────────────────────────────────

const ReviewFieldsStep = ({
  contacts,
  selectedContactId,
  manualEmail,
  fields,
  fieldValues,
  reviewPage,
  onFieldChange,
  onPageChange,
  onNext,
  onBack,
}) => {
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const recipientEmail = (selectedContact && selectedContact.email) || manualEmail;
  const recipientName = selectedContact ? selectedContact.name : '';

  const totalRequiredMissingCount = fields.filter((f) => {
    if (!f.required) return false;
    const key = `${f.objectType}:${f.propertyName}`;
    return !fieldValues[key] || !fieldValues[key].trim();
  }).length;

  const groupedByType = OBJECT_TYPE_ORDER
    .map((type) => ({
      type,
      label: OBJECT_TYPE_LABELS[type] || type,
      fields: fields.filter((f) => f.objectType === type),
    }))
    .filter((g) => g.fields.length > 0);

  if (fields.length === 0) {
    return (
      <>
        <ModalBody>
          <Flex direction="column" gap="sm">
            <Alert title="Empfänger" variant="info">
              {recipientName ? `${recipientName} (${recipientEmail})` : recipientEmail}
            </Alert>
            <Alert title="Keine Feldzuordnungen" variant="info">
              Diese Vorlage hat keine HubSpot-Feldzuordnungen. Das Dokument wird ohne vorausgefüllte Felder erstellt.
            </Alert>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={onNext}>Weiter</Button>
          <Button onClick={onBack}>Zurück</Button>
        </ModalFooter>
      </>
    );
  }

  const safePageIndex = Math.min(reviewPage, groupedByType.length - 1);
  const currentGroup = groupedByType[safePageIndex];
  const isLastPage = safePageIndex === groupedByType.length - 1;
  const isFirstPage = safePageIndex === 0;

  const pageRequiredMissingCount = currentGroup.fields.filter((f) => {
    if (!f.required) return false;
    const key = `${f.objectType}:${f.propertyName}`;
    return !fieldValues[key] || !fieldValues[key].trim();
  }).length;

  return (
    <>
      <ModalBody>
        <Flex direction="column" gap="sm">
          {isFirstPage && (
            <Alert title="Empfänger" variant="info">
              {recipientName ? `${recipientName} (${recipientEmail})` : recipientEmail}
            </Alert>
          )}

          <Text format={{ fontWeight: 'bold' }}>
            {currentGroup.label} ({safePageIndex + 1}/{groupedByType.length})
          </Text>

          {groupedByType.length > 1 && (
            <Flex direction="row" gap="sm">
              {groupedByType.map((g, i) => {
                const isActive = i === safePageIndex;
                const groupMissing = !isActive && g.fields.some((f) => {
                  if (!f.required) return false;
                  const key = `${f.objectType}:${f.propertyName}`;
                  return !fieldValues[key] || !fieldValues[key].trim();
                });

                return (
                  <Button
                    key={g.type}
                    variant={isActive ? 'primary' : 'secondary'}
                    size="small"
                    disabled={isActive}
                    onClick={() => onPageChange(i)}
                  >
                    {g.label}{groupMissing ? ' ⚠' : ''}
                  </Button>
                );
              })}
            </Flex>
          )}

          {pageRequiredMissingCount > 0 && (
            <Alert title={`${pageRequiredMissingCount} Pflichtfeld${pageRequiredMissingCount > 1 ? 'er' : ''} ohne Daten`} variant="warning">
              Pflichtfelder müssen ausgefüllt werden, bevor das Dokument gesendet werden kann.
            </Alert>
          )}

          <Box css={{ maxHeight: '320px', overflowY: 'auto' }}>
            <Flex direction="column" gap="sm">
              {currentGroup.fields.map((field) => {
                const key = `${field.objectType}:${field.propertyName}`;
                const currentVal = fieldValues[key] || '';
                const isEmpty = !currentVal.trim();
                const isRequiredEmpty = field.required && isEmpty;

                return (
                  <Input
                    key={key}
                    label={field.required ? `${field.propertyLabel} *` : field.propertyLabel}
                    placeholder="Wert eingeben..."
                    value={currentVal}
                    onChange={(v) => onFieldChange(key, v)}
                    validationMessage={isRequiredEmpty ? 'Pflichtfeld – bitte ausfüllen' : undefined}
                    error={isRequiredEmpty}
                    required={field.required}
                  />
                );
              })}
            </Flex>
          </Box>
        </Flex>
      </ModalBody>
      <ModalFooter>
        {isLastPage ? (
          <Button variant="primary" onClick={onNext} disabled={totalRequiredMissingCount > 0}>
            {totalRequiredMissingCount > 0
              ? `${totalRequiredMissingCount} Pflichtfeld${totalRequiredMissingCount > 1 ? 'er' : ''} fehlen`
              : 'Weiter'}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => onPageChange(safePageIndex + 1)}>
            Weiter
          </Button>
        )}
        {isFirstPage ? (
          <Button onClick={onBack}>Zurück</Button>
        ) : (
          <Button onClick={() => onPageChange(safePageIndex - 1)}>Zurück</Button>
        )}
      </ModalFooter>
    </>
  );
};

// ─── Step: Assign Property ──────────────────────────────────────────────────────

const AssignPropertyStep = ({
  fileProperties,
  filePropsLoading,
  assignedProperty,
  onPropertyChange,
  onNext,
  onDirectSend,
  onBack,
}) => {
  if (filePropsLoading) {
    return (
      <ModalBody>
        <LoadingSpinner label="Dokumentfelder werden geladen..." />
      </ModalBody>
    );
  }

  return (
    <>
      <ModalBody>
        <Flex direction="column" gap="md">
          <Text format={{ fontWeight: 'bold' }}>Dokumentfeld zuordnen</Text>
          <Text>
            Zu welchem Deal-Feld gehört dieses Dokument? Das signierte PDF kann später automatisch dort abgelegt werden.
          </Text>
          <Select
            label="Deal-Feld"
            placeholder="Feld wählen..."
            options={buildFilePropertyOptions(fileProperties)}
            value={assignedProperty || '__none__'}
            onChange={onPropertyChange}
          />
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onDirectSend}>Direkt senden</Button>
        <Button variant="secondary" onClick={onNext}>Vorschau</Button>
        <Button onClick={onBack}>Zurück</Button>
      </ModalFooter>
    </>
  );
};

// ─── Step: Preview ──────────────────────────────────────────────────────────────

const PreviewStep = ({ result, onDistribute, onCancel }) => (
  <>
    <ModalBody>
      <Flex direction="column" gap="md">
        <Alert title="Dokument erstellt" variant="success">
          Das Dokument wurde mit den HubSpot-Daten befüllt. Prüfe es in LohnLab eSign, bevor du es versendest.
        </Alert>
        {result && result.recipient && (
          <Text>Empfänger: {result.recipient.name} ({result.recipient.email})</Text>
        )}
        {result && result.previewUrl && (
          <Button variant="secondary" href={{ url: result.previewUrl, external: true }}>
            Dokument in eSign ansehen
          </Button>
        )}
      </Flex>
    </ModalBody>
    <ModalFooter>
      <Button variant="primary" onClick={onDistribute}>Jetzt versenden</Button>
      <Button onClick={onCancel}>Abbrechen</Button>
    </ModalFooter>
  </>
);

// ─── Step: Sent ─────────────────────────────────────────────────────────────────

const SentStep = ({ result, onClose }) => (
  <>
    <ModalBody>
      <Flex direction="column" gap="md">
        <Alert title="Dokument versendet" variant="success">
          Das Dokument wurde erfolgreich zur Unterschrift versendet.
        </Alert>
        {result && result.recipient && (
          <Text>Empfänger: {result.recipient.name} ({result.recipient.email})</Text>
        )}
      </Flex>
    </ModalBody>
    <ModalFooter>
      <Button variant="primary" onClick={onClose}>Schließen</Button>
    </ModalFooter>
  </>
);

// ─── Step: Error ────────────────────────────────────────────────────────────────

const ErrorStep = ({ error, onRetry, onClose }) => (
  <>
    <ModalBody>
      <Alert title="Fehler" variant="error">
        {error || 'Ein unerwarteter Fehler ist aufgetreten.'}
      </Alert>
    </ModalBody>
    <ModalFooter>
      <Button variant="primary" onClick={onRetry}>Nochmal versuchen</Button>
      <Button onClick={onClose}>Schließen</Button>
    </ModalFooter>
  </>
);
