// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target:
          "https://script.google.com/macros/s/AKfycbwXjqbaaJ2zE_yEAm0PeqmmVWvKCBkmLdAQA9YJOp6ebPeqKW3rNylggArS1GIo8g8N/exec",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
