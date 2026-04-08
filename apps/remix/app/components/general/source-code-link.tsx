import { Trans } from '@lingui/react/macro';
import { CodeXmlIcon } from 'lucide-react';

import { SOURCE_CODE_URL } from '@documenso/lib/constants/app';
import { cn } from '@documenso/ui/lib/utils';

type SourceCodeLinkProps = {
  className?: string;
};

export const SourceCodeLink = ({ className }: SourceCodeLinkProps) => {
  return (
    <a
      href={SOURCE_CODE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground',
        className,
      )}
    >
      <CodeXmlIcon className="h-3.5 w-3.5" />
      <span>
        <Trans>Source Code (AGPL-3.0)</Trans>
      </span>
    </a>
  );
};
