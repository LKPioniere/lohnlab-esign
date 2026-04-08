import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <img src="/logo.png" alt="LohnLab" className="h-6" />
          <span className="text-muted-foreground font-light">eSign</span>
        </span>
      ),
    },
    githubUrl: 'https://github.com/documenso/documenso',
  };
}
