// vite.config.js
import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [glsl()],
  base: "/webgl_clock",
  build: {
    sourcemap: true
  }
});