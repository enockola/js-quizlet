import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: true, // Tells Vite to target a server environment
    target: 'node18', // Adjust to match your current Node version
    outDir: 'dist',
    rollupOptions: {
      input: './server.js', // Entry point for the server
    },
  },
  ssr: {
    // Ensures external dependencies don't get heavily bundled unless necessary
    noExternal: [],
  },
});
