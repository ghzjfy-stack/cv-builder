"use client";

import { useId } from "react";

type Faq = { q: string; a: string };

export function TemplateFaq({ items }: { items: Faq[] }) {
  const baseId = useId();
  return (
    <div className="seo-faq">
      {items.map((item, i) => (
        <details key={item.q} name={`${baseId}-faq`}>
          <summary id={`${baseId}-q-${i}`}>{item.q}</summary>
          <p id={`${baseId}-a-${i}`}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
