import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Bird, CheckCircle2 } from 'lucide-react';
import { match } from 'ts-pattern';

import { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';

export type DocumentsTableEmptyStateProps = { status: ExtendedDocumentStatus };

export const DocumentsTableEmptyState = ({ status }: DocumentsTableEmptyStateProps) => {
  const { _ } = useLingui();

  const {
    title,
    message,
    icon: Icon,
  } = match(status)
    .with(ExtendedDocumentStatus.COMPLETED, () => ({
      title: msg`No completed documents`,
      message: msg`Documents you created or that were sent to you will appear here once they are fully signed.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.DRAFT, () => ({
      title: msg`No drafts`,
      message: msg`Upload a document to create your first draft.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.ALL, () => ({
      title: msg`No documents yet`,
      message: msg`You have not created or received any documents yet. Upload a document to get started.`,
      icon: Bird,
    }))
    .with(ExtendedDocumentStatus.PENDING, () => ({
      title: msg`Nothing pending`,
      message: msg`No documents are waiting for signatures right now. Newly sent documents will show up here.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.REJECTED, () => ({
      title: msg`No rejected documents`,
      message: msg`Documents that a recipient declined will appear here.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.INBOX, () => ({
      title: msg`Inbox is empty`,
      message: msg`Documents that require your attention will appear here.`,
      icon: CheckCircle2,
    }))
    .exhaustive();

  return (
    <div
      className="text-muted-foreground/60 flex h-60 flex-col items-center justify-center gap-y-4"
      data-testid="empty-document-state"
    >
      <Icon className="h-12 w-12" strokeWidth={1.5} />

      <div className="text-center">
        <h3 className="text-lg font-semibold">{_(title)}</h3>

        <p className="mt-2 max-w-[60ch]">{_(message)}</p>
      </div>
    </div>
  );
};
