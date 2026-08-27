import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown>;
}

export function Seo({ title, description, jsonLd }: SeoProps) {
  return (
    <Helmet>
      <title>{title} | GreenKart</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
