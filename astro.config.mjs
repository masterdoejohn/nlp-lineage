// The reference site. Its pages live in site/ (src/ holds the guided tour's sources), and it builds to build/
// (dist/ holds the tour's single-file page). public/tour/ is written by scripts/prepare-tour.mjs before each build.
import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: './site',
  outDir: './build',
  publicDir: './public',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
