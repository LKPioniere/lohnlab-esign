import { type MessageDescriptor, i18n } from '@lingui/core';

import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';

export const appMetaTags = (title?: MessageDescriptor) => {
  const description =
    'LohnLab eSign – Die sichere Plattform für digitale Unterschriften. Erstelle, versende und verwalte Zusatzvereinbarungen und Dokumente schnell und rechtskonform.';

  return [
    {
      title: title ? `${i18n._(title)} - LohnLab eSign` : 'LohnLab eSign',
    },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content:
        'LohnLab eSign, digitale Unterschrift, Zusatzvereinbarungen, Dokumente unterschreiben, HR-Software, elektronische Signatur',
    },
    {
      name: 'author',
      content: 'LohnLab',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      property: 'og:title',
      content: 'LohnLab eSign – Digitale Unterschriften für HR',
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:description',
      content: description,
    },
    {
      name: 'twitter:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
  ];
};
