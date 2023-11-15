import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import EnvironmentPlugin from "vite-plugin-environment";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), EnvironmentPlugin("all")],
    server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
    },
    base: process.env.VITE_BASE ?? "/math-manipulator",
    build: {
        manifest: true,
        rollupOptions: {
            // disable code splitting to allow for the import of single js files in VS-Code Extension ( //TODO maybe improve/make dependent)
            output: {
                manualChunks: {},
            },
        },
    },
});
