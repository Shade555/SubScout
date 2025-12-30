import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow external connections
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'radishlike-overimpressionable-nikita.ngrok-free.dev',
      // Add any other ngrok domains you might use
      '.ngrok-free.dev',
      '.ngrok.io'
    ]
  }
})
