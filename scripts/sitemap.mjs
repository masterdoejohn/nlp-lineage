// Write build/sitemap.xml after the site is built: one entry for every page (each folder's index.html), including the
// guided tour. The 404 page and Pagefind's files are left out. robots.txt (public/) points search engines here.
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = 'https://nlp-lineage.vercel.app';
const build = new URL('../build/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const urls = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== 'pagefind' && !e.name.startsWith('_')) walk(join(dir, e.name));
  }
  if (existsSync(join(dir, 'index.html'))) {
    const path = relative(build, dir).split(sep).join('/');
    urls.push(`${SITE}/${path ? path + '/' : ''}`);
  }
})(build);
urls.sort();
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') + '\n</urlset>\n';
writeFileSync(join(build, 'sitemap.xml'), xml);
console.log(`sitemap: ${urls.length} pages`);
