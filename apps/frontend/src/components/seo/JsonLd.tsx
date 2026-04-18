type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Server-safe JSON-LD script for structured data */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Safe: JSON.stringify of plain objects built in-repo
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
