import { defineConfig } from 'vite';

export default defineConfig({
    // The "root" is where index.html would usually live. 
    // We'll keep it as the project root.
    root: './',

    build: {
        outDir: 'static/dist',
        emptyOutDir: true,
        manifest: true, // <--- IMPORTANT
        rollupOptions: {
            input: {
                main: './src/main.ts',
            },
        },
    },
    server: {
        origin: 'http://localhost:5173',
        cors: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
        },
        // Required for DuckDB-Wasm
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    }
});