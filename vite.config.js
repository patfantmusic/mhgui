import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
    // The "root" is where index.html would usually live. 
    // We'll keep it as the project root.
    root: './',
    base: mode === 'production' ? '/static/dist/' : '/',
    assetsInclude: ['**/*.csv'],

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
}));