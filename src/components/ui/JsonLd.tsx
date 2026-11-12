import { serializeJsonLd, type JsonLdObject } from "@/lib/seo";

/**
 * Structured data. The only allowed use of dangerouslySetInnerHTML (AGENTS §4.6): the content is
 * JSON built on the server from trusted objects, with "<" escaped.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
