type JsonLdValue = Record<string, unknown>;

type SEOJsonLdProps = {
  data: JsonLdValue | JsonLdValue[];
};

/** Escape characters that could break out of a script tag. */
function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function isValidJsonLdObject(value: unknown): value is JsonLdValue {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "@context" in value
  );
}

export function SEOJsonLd({ data }: SEOJsonLdProps) {
  const payload = (Array.isArray(data) ? data : [data]).filter(isValidJsonLdObject);

  if (payload.length === 0) {
    return null;
  }

  return (
    <>
      {payload.map((item, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(item) }}
        />
      ))}
    </>
  );
}
