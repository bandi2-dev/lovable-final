import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    // Override nitro preset so Docker gets a real Node.js server
    // @ts-ignore
    nitro: {
      preset: "node-server",
    },
  },
});