import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import https from 'https';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    https: true,
    host: true,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
        ws: true,
        xfwd: true,
        agent: new https.Agent({
          rejectUnauthorized: false
        })
      },
      '/socket.io': {
        target: 'https://127.0.0.1:5002',
        ws: true,
        changeOrigin: true,
        secure: false,
        xfwd: true,
        agent: new https.Agent({
          rejectUnauthorized: false
        })
      },
    },
  },
})
