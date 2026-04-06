import type { ImgHTMLAttributes } from 'react';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

export const BrandingLogoIcon = ({ className, ...props }: LogoProps) => {
  return (
    <>
      <img
        src="/static/logo-dark.png"
        alt="LohnLab eSign"
        className={`dark:hidden ${className ?? ''}`}
        {...props}
      />
      <img
        src="/static/logo.png"
        alt="LohnLab eSign"
        className={`hidden dark:block ${className ?? ''}`}
        {...props}
      />
    </>
  );
};
