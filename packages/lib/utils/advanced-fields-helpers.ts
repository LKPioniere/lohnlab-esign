import { type Field, FieldType } from '@prisma/client';

import { ZFieldMetaSchema } from '../types/field-meta';

// Currently it seems that the majority of fields have advanced fields for font reasons.
// This array should only contain fields that have an optional setting in the fieldMeta.
export const ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING: FieldType[] = [
  FieldType.NUMBER,
  FieldType.TEXT,
  FieldType.DROPDOWN,
  FieldType.RADIO,
  FieldType.CHECKBOX,
  FieldType.DATE,
  FieldType.SIGNATURE,
  FieldType.INITIALS,
  FieldType.NAME,
  FieldType.EMAIL,
];

/**
 * Whether a field is required to be inserted.
 */
export const isRequiredField = (field: Field) => {
  // All fields without the optional metadata are assumed to be required.
  if (!ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING.includes(field.type)) {
    return true;
  }

  // If there is no fieldMeta, assume the field is required (safe default).
  if (!field.fieldMeta) {
    return true;
  }

  const parsedData = ZFieldMetaSchema.safeParse(field.fieldMeta);

  if (!parsedData.success) {
    return true;
  }

  return parsedData.data?.required !== false;
};

/**
 * Whether the provided field is required and not inserted.
 */
export const isFieldUnsignedAndRequired = (field: Field) =>
  isRequiredField(field) && !field.inserted;

/**
 * Whether the provided fields contains a field that is required to be inserted.
 */
export const fieldsContainUnsignedRequiredField = (fields: Field[]) =>
  fields.some(isFieldUnsignedAndRequired);
