import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const isUserSite = repositoryName.endsWith(".github.io");
const githubPagesBase =
  isGithubPagesBuild && repositoryName && !isUserSite ? `/${repositoryName}/` : "/";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: githubPagesBase,
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  }
})
