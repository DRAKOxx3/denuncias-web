import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0D3B66',
        accent: '#1D4ED8',
        surface: '#F4F4F4',
        success: '#2FBF71',
        warning: '#F4A261'
      }
    }
  },
  plugins: []
};

export default config;
