/**
 * Centralized file type definitions for document uploads.
 *
 * PDF files pass through directly; all other types are converted to PDF
 * server-side via LibreOffice before entering the signing pipeline.
 */

export const DOCUMENT_UPLOAD_ACCEPT: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf'],
};

export const CONVERTIBLE_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/rtf',
]);

export const ALL_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  ...CONVERTIBLE_MIME_TYPES,
]);

export const CONVERTIBLE_EXTENSIONS = new Set(['.doc', '.docx', '.odt', '.rtf']);

export const isConvertibleDocument = (mimeType: string): boolean => {
  return CONVERTIBLE_MIME_TYPES.has(mimeType);
};

export const isAllowedDocumentType = (mimeType: string): boolean => {
  return ALL_ALLOWED_MIME_TYPES.has(mimeType);
};
