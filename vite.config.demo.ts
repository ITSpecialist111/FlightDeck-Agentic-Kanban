/**
 * Vite config for the standalone FlightDeck demo.
 *
 * Differences from production vite.config.ts:
 * - No @microsoft/power-apps-vite plugin
 * - resolveId plugin swaps dataverse-client → mock, Power Apps SDK → stub
 * - Sets VITE_DEMO_MODE=true
 * - Outputs to dist-demo/
 */
import { defineConfig, type Plugin } from "vite"
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

function mockDataversePlugin(): Plugin {
  const mockClientPath = path.resolve(__dirname, "src/demo/mock-dataverse-client.ts").replace(/\\/g, "/")
  const stubPath = path.resolve(__dirname, "src/demo/stubs/power-apps-stub.ts").replace(/\\/g, "/")

  return {
    name: "flightdeck-demo-mock",
    enforce: "pre",
    resolveId(source: string, importer?: string) {
      // Normalize for cross-platform path matching
      const importerNorm = importer?.replace(/\\/g, "/") ?? ""

      // Redirect dataverse-client imports from generated services
      if (
        source.includes("dataverse-client") &&
        importerNorm.includes("/generated/")
      ) {
        return mockClientPath
      }
      // Redirect also the dataSourcesInfo import (used by real client)
      if (source.includes("dataSourcesInfo")) {
        return stubPath
      }
      // Stub out all @microsoft/power-apps imports
      if (source.startsWith("@microsoft/power-apps")) {
        return stubPath
      }
      return null
    },
    // Strip the Power Apps CSP meta tag from demo builds
    transformIndexHtml(html: string) {
      return html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*\/>/s, "")
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mockDataversePlugin()],
  define: {
    "import.meta.env.VITE_DEMO_MODE": JSON.stringify("true"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-demo",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Force mock-dataverse-client and demo-seed-data into the main chunk
          // so seed data is available before any lazy-loaded code runs
          if (id.includes("demo/mock-dataverse-client") || id.includes("demo/mock-store")) {
            return undefined // undefined = main chunk
          }
          // Vendor chunks
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router")) {
            return "vendor-react"
          }
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "vendor-query"
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix"
          }
          if (id.includes("node_modules/@dnd-kit/")) {
            return "vendor-dnd"
          }
          return undefined
        },
      },
    },
  },
})
