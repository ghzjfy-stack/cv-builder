import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allCategorySlugs, builderPresetUrl, getCategory, listCategories } from "../../lib/categories";
import { SITE_NAME, SITE_URL, absUrl } from "../../lib/site";
import { TemplateFaq } from "../TemplateFaq";

type PageProps = {
  params: { category: string };
};

export function generateStaticParams() {
  return allCategorySlugs().map((category) => ({ category }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: PageProps): Metadata {
  const cat = getCategory(params.category);
  if (!cat) return { title: "תבנית לא נמצאה" };
  const url = absUrl(`/templates/${cat.slug}/`);
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      title: cat.ogTitle,
      description: cat.description,
      url,
      locale: "he_IL",
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: cat.ogTitle,
      description: cat.description,
    },
  };
}

function faqJsonLd(name: string, url: string, faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name,
        url,
        inLanguage: "he-IL",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ראשי", item: SITE_URL + "/" },
          { "@type": "ListItem", position: 2, name: "תבניות", item: absUrl("/templates/") },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
    ],
  };
}

export default function TemplateCategoryPage({ params }: PageProps) {
  const cat = getCategory(params.category);
  if (!cat) notFound();

  const url = absUrl(`/templates/${cat.slug}/`);
  const cta = builderPresetUrl(cat);
  const related = listCategories().filter((item) => item.slug !== cat.slug).slice(0, 6);
  const skillChips = cat.skills.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="seo-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(cat.h1, url, cat.faqs)) }} />
      <div className="seo-inner">
        <header className="seo-nav">
          <Link href="/" className="seo-brand">
            <span className="seo-mark" aria-hidden="true">QC</span>
            <span>
              <span className="seo-brand-name">QuickCV</span>
              <span className="seo-brand-sub">תבניות לפי תחום</span>
            </span>
          </Link>
          <Link className="seo-nav-cta" href={cta}>
            לסטודיו
          </Link>
        </header>

        <section className="seo-hero">
          <div>
            <p className="seo-kicker">{cat.kicker}</p>
            <h1 className="seo-h1">{cat.h1}</h1>
            <p className="seo-lead">{cat.lead}</p>
            <div className="seo-hero-actions">
              <Link className="seo-cta" href={cta}>
                {cat.ctaHe}
              </Link>
              <Link className="seo-cta-ghost" href="/templates/">
                כל התחומים
              </Link>
            </div>
          </div>
          <aside className="seo-preview" aria-label="תצוגת תוכן מוכן מראש">
            <h2>{cat.jobTitle}</h2>
            <p className="role">{cat.nameHe} · דוגמה לעריכה</p>
            <h3>תקציר</h3>
            <p>{cat.summary}</p>
            <h3>כישורים</h3>
            <div className="seo-chips">
              {skillChips.map((skill) => (
                <span className="seo-chip" key={skill}>{skill}</span>
              ))}
            </div>
            <h3>ניסיון</h3>
            <p>{cat.experience}</p>
          </aside>
        </section>

        <section className="seo-section" aria-labelledby="guide-title">
          <p className="seo-kicker">מדריך קצר</p>
          <h2 id="guide-title">{cat.guideTitle}</h2>
          <div className="seo-guide">
            {cat.guide.map((step, i) => (
              <article key={step}>
                <p className="seo-kicker">0{i + 1}</p>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="seo-section" aria-labelledby="phrases-title">
          <p className="seo-kicker">לאינדוקס ולעריכה</p>
          <h2 id="phrases-title">{cat.phrasesTitle}</h2>
          <ul className="seo-phrases">
            {cat.phrases.map((phrase) => (
              <li key={phrase}>{phrase}</li>
            ))}
          </ul>
        </section>

        <section className="seo-section" aria-labelledby="faq-title">
          <p className="seo-kicker">שאלות נפוצות</p>
          <h2 id="faq-title">שאלות על קורות חיים {cat.prepositionHe}</h2>
          <TemplateFaq items={cat.faqs} />
        </section>

        <section className="seo-section" aria-labelledby="more-title">
          <h2 id="more-title">תבניות נוספות</h2>
          <nav className="seo-related" aria-label="תחומים נוספים">
            {related.map((item) => (
              <Link key={item.slug} href={`/templates/${item.slug}/`}>
                {item.nameHe}
              </Link>
            ))}
          </nav>
        </section>

        <footer className="seo-footer">
          <p>QuickCV · מחולל קורות חיים פרימיום</p>
          <p>
            <Link href="/">חזרה לבית</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
