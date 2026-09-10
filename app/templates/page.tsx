import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "../lib/categories";
import { SITE_NAME, absUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "תבניות קורות חיים לפי תחום | QuickCV",
  description:
    "בחרו תבנית קורות חיים למכירות, הייטק, סטודנטים, שירות לקוחות ועוד — עם משפטים מוכנים ופתיחה ישירה לסטודיו.",
  alternates: { canonical: absUrl("/templates/") },
  openGraph: {
    title: "תבניות קורות חיים לפי תחום",
    description: "מכירות, הייטק, סטודנטים ושירות לקוחות — תבניות בעברית מוכנות ל-ATS.",
    url: absUrl("/templates/"),
    locale: "he_IL",
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function TemplatesIndexPage() {
  const categories = listCategories();
  return (
    <div className="seo-shell">
      <div className="seo-inner">
        <header className="seo-nav">
          <Link href="/" className="seo-brand">
            <span className="seo-mark" aria-hidden="true">QC</span>
            <span>
              <span className="seo-brand-name">QuickCV</span>
              <span className="seo-brand-sub">תבניות לפי תחום</span>
            </span>
          </Link>
          <Link className="seo-nav-cta" href="/#studio">
            לסטודיו
          </Link>
        </header>
        <section className="seo-hero" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <p className="seo-kicker">ספריית תבניות</p>
            <h1 className="seo-h1">קורות חיים לפי תפקיד</h1>
            <p className="seo-lead">
              כל עמוד טוען תקציר, ניסיון וכישורים לתחום — ואז פותח את הסטודיו עם אותם נתונים לעריכה.
            </p>
          </div>
        </section>
        <section className="seo-section">
          <div className="seo-grid">
            {categories.map((cat) => (
              <Link className="seo-card" key={cat.slug} href={`/templates/${cat.slug}/`}>
                <strong>{cat.nameHe}</strong>
                <span>{cat.lead}</span>
              </Link>
            ))}
          </div>
        </section>
        <footer className="seo-footer">
          <p>QuickCV · מחולל קורות חיים פרימיום</p>
          <Link href="/">חזרה לבית</Link>
        </footer>
      </div>
    </div>
  );
}
