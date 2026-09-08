import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/accounts": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/products": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/cart": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/orders": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/coupons": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});