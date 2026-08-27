import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { absoluteUrl } from '@/utils/siteUrl';

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function Seo({ title, description, image, type = 'website', jsonLd }: SeoProps) {
  const location = useLocation();
  const url = absoluteUrl(location.pathname);
  const fullTitle = `${title} | GreenKart`;
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="canonical" href={url} />
      {description && <meta name="description" content={description} />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:url" content={url} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}

      {jsonLdList.map((entry, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(entry)}</script>
      ))}
    </Helmet>
  );
}
