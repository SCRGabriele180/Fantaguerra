import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const isUserSite = repositoryName.endsWith(".github.io");
const githubPagesBase =
  isGithubPagesBuild && repositoryName && !isUserSite ? `/${repositoryName}/` : "/";

export default defineConfig({
  vite: {
    base: githubPagesBase,
  },
  tanstackStart: {
    ssr: false, // <-- AGGIUNGI QUESTA RIGA: Disabilita il server per creare una SPA statica
    server: { entry: "server" },
  },
});
