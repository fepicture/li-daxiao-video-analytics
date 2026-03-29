import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        up: '#ef4444',    // Red = up in Chinese markets
        down: '#22c55e',  // Green = down in Chinese markets
      },
    },
  },
  plugins: [],
};

export default config;
