import type { HTMLAttributes } from 'react';

import { cn } from '@documenso/ui/lib/utils';

export type LogoProps = HTMLAttributes<HTMLDivElement> & {
  hideESign?: boolean;
  logoClassName?: string;
};

export const BrandingLogo = ({ className, hideESign, logoClassName, ...props }: LogoProps) => {
  return (
    <div className={cn('flex items-end gap-2', className)} {...props}>
      <img src="/static/logo-dark.png" alt="LohnLab" className={cn('dark:hidden', logoClassName)} />
      <img
        src="/static/logo.png"
        alt="LohnLab"
        className={cn('hidden dark:block', logoClassName)}
      />
      {!hideESign && (
        <span className="-mb-[2px] text-lg font-light leading-none text-muted-foreground dark:text-documenso">
          eSign
        </span>
      )}
    </div>
  );
};
