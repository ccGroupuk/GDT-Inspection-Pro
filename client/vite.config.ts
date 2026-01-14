import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@shared": path.resolve(__dirname, "../shared"),
        },
    },
    root: __dirname,
    build: {
        outDir: path.resolve(__dirname, "../dist/public"),
        emptyOutDir: true,
    },
    server: {
        middlewareMode: true,
        fs: {
            allow: ['..']
        },
        proxy: {
            "/api": {
                target: "http://localhost:5004",
                changeOrigin: true,
            },
        },
    },
});
