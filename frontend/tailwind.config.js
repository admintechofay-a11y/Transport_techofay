/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F2D56',
          light: '#1A4080',
          dark: '#091D38',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F97316',
          light: '#FED7AA',
          dark: '#C2410C',
          foreground: '#FFFFFF',
        },
        navy: {
          50: '#F0F4F9',
          100: '#E1E9F2',
          200: '#C3D3E5',
          300: '#A4BDD8',
          400: '#6892BE',
          500: '#2C67A4',
          600: '#1A4F8B',
          700: '#123A6B',
          800: '#0F2D56',
          900: '#0B1F3C',
          950: '#061224',
        },
        saffron: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#15803D',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#F8FAFC',
        },
        background: '#FFFFFF',
        foreground: '#0F172A',
        card: '#FFFFFF',
        muted: '#F1F5F9',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px 0 rgba(15, 23, 42, 0.03)',
        card: '0 4px 6px -1px rgba(15, 45, 86, 0.06), 0 2px 4px -1px rgba(15, 45, 86, 0.04)',
        hover: '0 10px 15px -3px rgba(15, 45, 86, 0.1), 0 4px 6px -2px rgba(15, 45, 86, 0.05)',
      },
    },
  },
  plugins: [],
}
