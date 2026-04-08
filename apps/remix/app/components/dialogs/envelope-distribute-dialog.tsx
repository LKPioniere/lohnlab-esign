import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { DocumentDistributionMethod, DocumentStatus, EnvelopeType } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { match } from 'ts-pattern';
import * as z from 'zod';

import { useCurrentEnvelopeEditor } from '@documenso/lib/client-only/providers/envelope-editor-provider';
import { extractDocumentAuthMethods } from '@documenso/lib/utils/document-auth';
import { getRecipientsWithMissingFields } from '@documenso/lib/utils/recipients';
import { zEmail } from '@documenso/lib/utils/zod';
import { trpc as trpcReact } from '@documenso/trpc/react';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import { Form } from '@documenso/ui/primitives/form/form';
import { SpinnerBox } from '@documenso/ui/primitives/spinner';
import { useToast } from '@documenso/ui/primitives/use-toast';

export type EnvelopeDistributeDialogProps = {
  onDistribute?: () => Promise<void>;
  documentRootPath: string;
  trigger?: React.ReactNode;
};

export const ZEnvelopeDistributeFormSchema = z.object({
  meta: z.object({
    emailId: z.string().nullable(),
    emailReplyTo: z.preprocess((val) => (val === '' ? undefined : val), zEmail().optional()),
    subject: z.string(),
    message: z.string(),
    distributionMethod: z
      .nativeEnum(DocumentDistributionMethod)
      .optional()
      .default(DocumentDistributionMethod.EMAIL),
  }),
});

export type TEnvelopeDistributeFormSchema = z.infer<typeof ZEnvelopeDistributeFormSchema>;

export const EnvelopeDistributeDialog = ({
  trigger,
  documentRootPath,
  onDistribute,
}: EnvelopeDistributeDialogProps) => {
  const { envelope, syncEnvelope, isAutosaving, autosaveError } = useCurrentEnvelopeEditor();

  const { toast } = useToast();
  const { t } = useLingui();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { mutateAsync: distributeEnvelope } = trpcReact.envelope.distribute.useMutation();

  const form = useForm<TEnvelopeDistributeFormSchema>({
    defaultValues: {
      meta: {
        emailId: envelope.documentMeta?.emailId ?? null,
        emailReplyTo: envelope.documentMeta?.emailReplyTo || undefined,
        subject: envelope.documentMeta?.subject ?? '',
        message: envelope.documentMeta?.message ?? '',
        distributionMethod:
          envelope.documentMeta?.distributionMethod || DocumentDistributionMethod.EMAIL,
      },
    },
    resolver: zodResolver(ZEnvelopeDistributeFormSchema),
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = form;

  const distributionMethod = watch('meta.distributionMethod');

  const recipientsWithIndex = useMemo(
    () =>
      envelope.recipients.map((recipient, index) => ({
        ...recipient,
        index,
      })),
    [envelope.recipients],
  );

  const recipientsMissingSignatureFields = useMemo(
    () => getRecipientsWithMissingFields(recipientsWithIndex, envelope.fields),
    [recipientsWithIndex, envelope.fields],
  );

  /**
   * List of recipients who must have an email due to having auth enabled.
   */
  const recipientsMissingRequiredEmail = useMemo(() => {
    return recipientsWithIndex.filter((recipient) => {
      const auth = extractDocumentAuthMethods({
        documentAuth: envelope.authOptions,
        recipientAuth: recipient.authOptions,
      });

      return (
        (auth.recipientAccessAuthRequired || auth.recipientActionAuthRequired) && !recipient.email
      );
    });
  }, [recipientsWithIndex, envelope.authOptions]);

  const invalidEnvelopeCode = useMemo(() => {
    if (recipientsMissingSignatureFields.length > 0) {
      return 'MISSING_SIGNATURES';
    }

    if (envelope.recipients.length === 0) {
      return 'MISSING_RECIPIENTS';
    }

    if (recipientsMissingRequiredEmail.length > 0) {
      return 'MISSING_REQUIRED_EMAIL';
    }

    return null;
  }, [envelope.recipients, recipientsMissingRequiredEmail, recipientsMissingSignatureFields]);

  const onFormSubmit = async ({ meta }: TEnvelopeDistributeFormSchema) => {
    try {
      await distributeEnvelope({ envelopeId: envelope.id, meta });

      await onDistribute?.();

      await navigate(documentRootPath);

      toast({
        title: t`Envelope distributed`,
        description: t`Your envelope has been distributed successfully.`,
        duration: 5000,
      });

      setIsOpen(false);
    } catch (err) {
      toast({
        title: t`Something went wrong`,
        description: t`This envelope could not be distributed at this time. Please try again.`,
        variant: 'destructive',
        duration: 7500,
      });
    }
  };

  const handleSync = async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      await syncEnvelope();
    } catch (err) {
      console.error(err);
    }

    setIsSyncing(false);
  };

  useEffect(() => {
    // Resync the whole envelope if the envelope is mid saving.
    if (isOpen && (isAutosaving || autosaveError)) {
      void handleSync();
    }
  }, [isOpen]);

  if (envelope.status !== DocumentStatus.DRAFT || envelope.type !== EnvelopeType.DOCUMENT) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>
            <Trans>Send Document</Trans>
          </DialogTitle>

          <DialogDescription>
            <Trans>Recipients will be able to sign the document once sent</Trans>
          </DialogDescription>
        </DialogHeader>

        {!invalidEnvelopeCode || isSyncing ? (
          <Form {...form}>
            <form onSubmit={handleSubmit(onFormSubmit)}>
              <fieldset disabled={isSubmitting}>
                <AnimatePresence initial={false} mode="wait">
                  {isSyncing ? (
                    <motion.div
                      key={'Flushing'}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                      <SpinnerBox spinnerProps={{ size: 'sm' }} className="h-24" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={'Confirm'}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                      <p className="text-sm text-muted-foreground">
                        {distributionMethod === DocumentDistributionMethod.EMAIL ? (
                          <Trans>
                            The document will be sent to all recipients via email. You can configure
                            email settings in the document settings.
                          </Trans>
                        ) : (
                          <Trans>
                            Signing links will be generated for all recipients. You can send these
                            links manually.
                          </Trans>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSubmitting}>
                      <Trans>Cancel</Trans>
                    </Button>
                  </DialogClose>

                  <Button loading={isSubmitting} disabled={isSyncing} type="submit">
                    {distributionMethod === DocumentDistributionMethod.EMAIL ? (
                      <Trans>Send</Trans>
                    ) : (
                      <Trans>Generate Links</Trans>
                    )}
                  </Button>
                </DialogFooter>
              </fieldset>
            </form>
          </Form>
        ) : (
          <>
            <Alert variant="warning">
              {match(invalidEnvelopeCode)
                .with('MISSING_RECIPIENTS', () => (
                  <AlertDescription>
                    <Trans>You need at least one recipient to send a document</Trans>
                  </AlertDescription>
                ))
                .with('MISSING_SIGNATURES', () => (
                  <AlertDescription>
                    <Trans>The following signers are missing signature fields:</Trans>

                    <ul className="ml-2 mt-1 list-inside list-disc">
                      {recipientsMissingSignatureFields.map((recipient) => (
                        <li key={recipient.id}>
                          {recipient.email || recipient.name || t`Recipient ${recipient.index + 1}`}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                ))
                .with('MISSING_REQUIRED_EMAIL', () => (
                  <AlertDescription>
                    <Trans>The following recipients require an email address:</Trans>

                    <ul className="ml-2 mt-1 list-inside list-disc">
                      {recipientsMissingRequiredEmail.map((recipient) => (
                        <li key={recipient.id}>
                          {recipient.email || recipient.name || t`Recipient ${recipient.index + 1}`}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                ))
                .exhaustive()}
            </Alert>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  <Trans>Close</Trans>
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
