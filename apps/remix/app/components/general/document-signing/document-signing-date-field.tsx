import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DateTime } from 'luxon';
import { Loader } from 'lucide-react';
import { useRevalidator } from 'react-router';

import {
  DEFAULT_DOCUMENT_DATE_FORMAT,
  convertToLocalSystemFormat,
} from '@documenso/lib/constants/date-formats';
import { DEFAULT_DOCUMENT_TIME_ZONE } from '@documenso/lib/constants/time-zones';
import { DO_NOT_INVALIDATE_QUERY_ON_MUTATION } from '@documenso/lib/constants/trpc';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TRecipientActionAuth } from '@documenso/lib/types/document-auth';
import { ZDateFieldMeta } from '@documenso/lib/types/field-meta';
import type { FieldWithSignature } from '@documenso/prisma/types/field-with-signature';
import { trpc } from '@documenso/trpc/react';
import type {
  TRemovedSignedFieldWithTokenMutationSchema,
  TSignFieldWithTokenMutationSchema,
} from '@documenso/trpc/server/field-router/schema';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { Input } from '@documenso/ui/primitives/input';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { DocumentSigningFieldContainer } from './document-signing-field-container';
import { useDocumentSigningRecipientContext } from './document-signing-recipient-provider';

export type DocumentSigningDateFieldProps = {
  field: FieldWithSignature;
  dateFormat?: string | null;
  timezone?: string | null;
  onSignField?: (value: TSignFieldWithTokenMutationSchema) => Promise<void> | void;
  onUnsignField?: (value: TRemovedSignedFieldWithTokenMutationSchema) => Promise<void> | void;
};

export const DocumentSigningDateField = ({
  field,
  dateFormat = DEFAULT_DOCUMENT_DATE_FORMAT,
  timezone = DEFAULT_DOCUMENT_TIME_ZONE,
  onSignField,
  onUnsignField,
}: DocumentSigningDateFieldProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();
  const { revalidate } = useRevalidator();

  const { recipient, isAssistantMode } = useDocumentSigningRecipientContext();

  const { mutateAsync: signFieldWithToken, isPending: isSignFieldWithTokenLoading } =
    trpc.field.signFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const {
    mutateAsync: removeSignedFieldWithToken,
    isPending: isRemoveSignedFieldWithTokenLoading,
  } = trpc.field.removeSignedFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const isLoading = isSignFieldWithTokenLoading || isRemoveSignedFieldWithTokenLoading;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState('');

  const safeFieldMeta = ZDateFieldMeta.safeParse(field.fieldMeta);
  const parsedFieldMeta = safeFieldMeta.success ? safeFieldMeta.data : null;

  const isCustomMode = parsedFieldMeta?.dateMode === 'custom';

  const localDateString = convertToLocalSystemFormat(field.customText, dateFormat, timezone);
  const isDifferentTime = field.inserted && localDateString !== field.customText;
  const tooltipText = _(
    msg`"${field.customText}" will appear on the document as it has a timezone of "${timezone || ''}".`,
  );

  const onSign = async (authOptions?: TRecipientActionAuth) => {
    if (isCustomMode && !field.inserted) {
      setShowDatePicker(true);
      return;
    }

    try {
      const payload: TSignFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
        value: dateFormat ?? DEFAULT_DOCUMENT_DATE_FORMAT,
        authOptions,
      };

      if (onSignField) {
        await onSignField(payload);
        return;
      }

      await signFieldWithToken(payload);

      await revalidate();
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.UNAUTHORIZED) {
        throw error;
      }

      console.error(err);

      toast({
        title: _(msg`Error`),
        description: isAssistantMode
          ? _(msg`An error occurred while signing as assistant.`)
          : _(msg`An error occurred while signing the document.`),
        variant: 'destructive',
      });
    }
  };

  const onCustomDateSubmit = async () => {
    if (!datePickerValue) {
      return;
    }

    const parsedDate = DateTime.fromISO(datePickerValue);

    if (!parsedDate.isValid) {
      return;
    }

    const formattedDate = parsedDate.toFormat(dateFormat ?? DEFAULT_DOCUMENT_DATE_FORMAT);

    setShowDatePicker(false);

    try {
      const payload: TSignFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
        value: formattedDate,
      };

      if (onSignField) {
        await onSignField(payload);
        return;
      }

      await signFieldWithToken(payload);

      await revalidate();
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.UNAUTHORIZED) {
        throw error;
      }

      console.error(err);

      toast({
        title: _(msg`Error`),
        description: _(msg`An error occurred while signing the document.`),
        variant: 'destructive',
      });
    }
  };

  const onRemove = async () => {
    try {
      const payload: TRemovedSignedFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
      };

      if (onUnsignField) {
        await onUnsignField(payload);
        return;
      }

      await removeSignedFieldWithToken(payload);

      await revalidate();
    } catch (err) {
      console.error(err);

      toast({
        title: _(msg`Error`),
        description: _(msg`An error occurred while removing the field.`),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <DocumentSigningFieldContainer
        field={field}
        onSign={onSign}
        onRemove={onRemove}
        type="Date"
        tooltipText={isDifferentTime ? tooltipText : undefined}
      >
        {isLoading && (
          <div className="bg-background absolute inset-0 flex items-center justify-center rounded-md">
            <Loader className="text-primary h-5 w-5 animate-spin md:h-8 md:w-8" />
          </div>
        )}

        {!field.inserted && (
          <p className="group-hover:text-primary text-foreground group-hover:text-recipient-green text-[clamp(0.425rem,25cqw,0.825rem)] duration-200">
            <Trans>Date</Trans>
          </p>
        )}

        {field.inserted && (
          <div className="flex h-full w-full items-center overflow-hidden">
            <p
              className={cn(
                'text-foreground w-full truncate text-left text-[clamp(0.35rem,20cqw,0.825rem)] duration-200',
                {
                  '!text-center': parsedFieldMeta?.textAlign === 'center',
                  '!text-right': parsedFieldMeta?.textAlign === 'right',
                },
              )}
            >
              {localDateString}
            </p>
          </div>
        )}
      </DocumentSigningFieldContainer>

      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>Enter Date</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>Please select a date.</Trans>
            </DialogDescription>
          </DialogHeader>

          <Input
            type="date"
            value={datePickerValue}
            onChange={(e) => setDatePickerValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void onCustomDateSubmit();
              }
            }}
          />

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowDatePicker(false)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button type="button" onClick={() => void onCustomDateSubmit()} disabled={!datePickerValue}>
              <Trans>Confirm</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
