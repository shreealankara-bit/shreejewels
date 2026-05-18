/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ShreeJewels brand palette
        gold: {
          50: '#fdf8ee',
          100: '#faefd1',
          200: '#f5dda3',
          300: '#efc46a',
          400: '#e8a839',
          500: '#d4913e',  // primary gold
          600: '#b8712e',
          700: '#8f5527',
          800: '#6b3f22',
          900: '#52301c',
        },
        cream: {
          50: '#fefdf8',
          100: '#fdf9ef',
          200: '#faf3dc',
          300: '#f5eac4',
          400: '#eddda5',
        },
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#2a2a2a',
          900: '#1a1a1a',
          950: '#0f0f0f',
        },
        rose: {
          jewel: '#c9a97b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #d4913e 0%, #f5dda3 50%, #d4913e 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
      },
      boxShadow: {
        'gold': '0 4px 14px rgba(212, 145, 62, 0.3)',
        'gold-lg': '0 8px 30px rgba(212, 145, 62, 0.4)',
        'card': '0 2px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.16)',
        'inner-gold': 'inset 0 1px 0 rgba(212, 145, 62, 0.3)',
      },
      aspectRatio: {
        'product': '3/4',
      },
    },
  },
  plugins: [],
};
