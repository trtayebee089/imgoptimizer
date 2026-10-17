// Design tokens — light theme with the HiveLabs BD green accent.
// brand-500 (#61CE70) is for fills and large accents; it is too light for text on
// white, so text and active states use brand-700 (#218838) or darker.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './AppRoot.tsx', './{pages,components,lib,hooks}/**/*.{ts,tsx}'],
  // Light theme only. 'class' mode keeps any dark: utilities inert.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ECF8ED',
          100: '#D8F2DB',
          200: '#B5E6BC',
          300: '#8FDA99',
          400: '#76D383',
          500: '#61CE70',
          600: '#46B556',
          700: '#218838',
          800: '#1B6E2E',
          900: '#174F24',
        },
        canvas: '#F7F8F2',
        surface: '#FFFFFF',
        ink: '#202720',
        'on-brand': '#102414',
        muted: '#667066',
        subtle: '#8C958C',
        line: '#E5E9E1',
        'line-strong': '#D2D8CD',
        success: { 50: '#ECF8ED', 500: '#2E9E44', 600: '#218838', 700: '#1B6E2E' },
        warning: { 50: '#FEF6E7', 500: '#C27803', 600: '#A15C07', 700: '#854D0E' },
        danger: { 50: '#FDF0EF', 500: '#C8372D', 600: '#A8281F', 700: '#8A1F18' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(32, 39, 32, 0.04), 0 1px 3px rgba(32, 39, 32, 0.05)',
        raised: '0 6px 16px -4px rgba(32, 39, 32, 0.08), 0 2px 4px -2px rgba(32, 39, 32, 0.05)',
        overlay: '0 24px 56px -16px rgba(32, 39, 32, 0.28)',
        focus: '0 0 0 3px rgba(97, 206, 112, 0.35)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      maxWidth: { page: '1200px' },
      keyframes: {
        'op-indeterminate': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(300%)' } },
        'op-fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        'op-fade-up': 'op-fade-up 240ms ease-out both',
        'op-indeterminate': 'op-indeterminate 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
