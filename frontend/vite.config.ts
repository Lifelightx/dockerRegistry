import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:6500',
          // target: 'http://192.168.13.73:6500',
          changeOrigin: true,
          secure: false,
        },
      },
      host: true, // Needed for Docker port mapping
      port: 5173,
    },
  };
});
