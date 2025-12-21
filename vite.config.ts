import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { componentTagger } from "lovable-tagger"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    visualizer({
      filename: 'stats.html',
      open: true,
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return
          }

          if (id.includes("@supabase/supabase-js")) {
            return "supabase"
          }

          if (id.includes("@dnd-kit")) {
            return "dnd"
          }

          if (id.includes("recharts") || id.includes("date-fns")) {
            return "charts"
          }

          if (id.includes("@tanstack/react-table")) {
            return "table"
          }

          if (
            id.includes("@radix-ui") ||
            id.includes("sonner") ||
            id.includes("lucide-react")
          ) {
            return "ui"
          }

          if (id.includes("react-dom") || id.includes("react/jsx")) {
            return "react"
          }

          return "vendor"
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    pool: "threads",
    setupFiles: ["vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    exclude: ["tests/e2e/**", "tests/e2e*.spec.ts"],
  },
}))
