import { FieldType } from '@prisma/client';
import { DateTime } from 'luxon';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TFieldDate } from '@documenso/lib/types/field';
import type { TSignEnvelopeFieldValue } from '@documenso/trpc/server/envelope-router/sign-envelope-field.types';

import { SignFieldDateDialog } from '~/components/dialogs/sign-field-date-dialog';

type HandleDateFieldClickOptions = {
  field: TFieldDate;
  dateFormat: string;
};

export const handleDateFieldClick = async (
  options: HandleDateFieldClickOptions,
): Promise<Extract<TSignEnvelopeFieldValue, { type: typeof FieldType.DATE }> | null> => {
  const { field, dateFormat } = options;

  if (field.type !== FieldType.DATE) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: 'Invalid field type',
    });
  }

  if (field.inserted) {
    return {
      type: FieldType.DATE,
      value: false,
    };
  }

  const selectedDate = await SignFieldDateDialog.call({
    dateFormat,
  });

  if (!selectedDate) {
    return null;
  }

  const parsedDate = DateTime.fromISO(selectedDate);

  if (!parsedDate.isValid) {
    return null;
  }

  const formattedDate = parsedDate.toFormat(dateFormat);

  return {
    type: FieldType.DATE,
    value: formattedDate,
  };
};
