import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const out = "out";
const dist = "dist";

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

console.log("Merged Next SEO pages into dist/templates");
