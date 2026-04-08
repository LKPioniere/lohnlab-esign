import { promisify } from 'util';

import * as libre from 'libreoffice-convert';

import { AppError } from '../../errors/app-error';

const convertAsync = promisify(libre.convert);

/**
 * Converts a document buffer (DOC, DOCX, ODT, RTF) to PDF using LibreOffice.
 *
 * Requires LibreOffice to be installed on the system.
 */
export const convertDocumentToPdf = async (
  documentBuffer: Buffer,
  _extension: string,
): Promise<Buffer> => {
  try {
    const pdfBuffer = await convertAsync(documentBuffer, '.pdf', undefined);

    return Buffer.from(pdfBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown conversion error';

    console.error(`Document to PDF conversion error: ${message}`);

    throw new AppError('INVALID_DOCUMENT_FILE', {
      message:
        'The document could not be converted to PDF. Please ensure the file is a valid document.',
      statusCode: 400,
    });
  }
};
