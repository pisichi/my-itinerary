// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  output: "static",
  // Change the site and base to match your new GitHub Pages repo
  // e.g., if your repo is 'kansai-trip-2026', base should be '/kansai-trip-2026'
  site: "https://pisichi.github.io",
  base: "/my-itinerary",
  integrations: [svelte(), tailwind()],
});
