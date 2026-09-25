import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const out = "out";
const dist = "dist";
const publicDir = "public";

if (!existsSync(join(out, "templates"))) {
  console.error("Next export did not produce out/templates");
  process.exit(1);
}

mkdirSync(dist, { recursive: true });
cpSync(join(out, "templates"), join(dist, "templates"), { recursive: true });

for (const name of ["_next", "sitemap.xml", "robots.txt"]) {
  const from = join(out, name);
  if (existsSync(from)) {
    cpSync(from, join(dist, name), { recursive: true });
  }
}

// Prefer static public/sitemap.xml (canonical QuickCV homepage) over Next-generated export.
const publicSitemap = join(publicDir, "sitemap.xml");
if (existsSync(publicSitemap)) {
  cpSync(publicSitemap, join(dist, "sitemap.xml"));
}

console.log("Merged Next SEO pages into dist/templates");
