import { getResourceHintOrigins } from "../lib/resource-hints";

export function ResourceHints() {
  const origins = getResourceHintOrigins();

  return (
    <>
      {origins.map((origin) => (
        <link key={`preconnect-${origin}`} rel="preconnect" href={origin} crossOrigin="" />
      ))}
      {origins.map((origin) => (
        <link key={`dns-prefetch-${origin}`} rel="dns-prefetch" href={origin} />
      ))}
    </>
  );
}
