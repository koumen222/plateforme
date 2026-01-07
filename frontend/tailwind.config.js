/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Couleur principale brand (terre ocre moderne)
        brand: {
          DEFAULT: '#8B5E3C',
          50: '#f5f1ed',
          100: '#e8ddd4',
          200: '#d4bca8',
          300: '#b8957a',
          400: '#9d7356',
          500: '#8B5E3C',
          600: '#7a5234',
          700: '#65432b',
          800: '#523625',
          900: '#432d1f',
        },
        // Couleurs du thème existant
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          hover: 'var(--bg-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
      },
      backgroundColor: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        hover: 'var(--bg-hover)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
      },
      boxShadow: {
        'theme': 'var(--shadow)',
        'theme-lg': 'var(--shadow-lg)',
        'modern': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modern-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modern-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'sm': '0px 4px 8px -1px rgba(0, 0, 0, 0.12)',
        'md': '0px 12px 16px -4px rgba(0, 0, 0, 0.1)',
        'lg': '0px 20px 24px -4px rgba(0, 0, 0, 0.1)',
      },
      colors: {
        neutral: {
          50: '#F8F8F9',
          100: '#EAEBEC',
          200: '#D4D6D7',
          300: '#BFC2C7',
          600: '#555A62',
          700: '#393C41',
          800: '#1C1E21',
          900: '#0E0F10',
        },
        neutralDark: {
          50: '#F9F9F9',
          100: '#EDEEEE',
          500: '#8A8B8E',
          700: '#565759',
        },
        error: {
          500: '#E30026',
        },
      },
      borderRadius: {
        'modern': '0.75rem',
        'modern-lg': '1rem',
        'modern-xl': '1.5rem',
        'xsm': '6px',
        'xmd': '16px',
        'xlg': '24px',
        'xxl': '32px',
      },
      fontSize: {
        'display-md': ['3.812rem', { lineHeight: '77px', letterSpacing: '-2%', fontWeight: '700' }],
        'display-sm': ['2.438rem', { lineHeight: '56px', letterSpacing: '-2%', fontWeight: '400' }],
        'display-sm-bold': ['2.438rem', { lineHeight: '56px', letterSpacing: '-2%', fontWeight: '700' }],
        'display-xs': ['1.938rem', { lineHeight: '44px', letterSpacing: '-2%', fontWeight: '400' }],
        'display-xs-bold': ['1.938rem', { lineHeight: '44px', letterSpacing: '-2%', fontWeight: '700' }],
        'display-xsm': ['3.062rem', { lineHeight: '65px', letterSpacing: '-2%', fontWeight: '400' }],
        'display-xsm-bold': ['3.062rem', { lineHeight: '65px', letterSpacing: '-2%', fontWeight: '700' }],
        'display-xxs': ['1.562rem', { lineHeight: '37px', letterSpacing: '-2%', fontWeight: '400' }],
        'display-xxs-bold': ['1.562rem', { lineHeight: '37px', letterSpacing: '-2%', fontWeight: '700' }],
        'heading-sm-bold': ['1.562rem', { lineHeight: '33px', letterSpacing: '-2%', fontWeight: '700' }],
        'lg': ['1rem', { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '400' }],
        'lg-bold': ['1rem', { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '700' }],
        'lg-medium': ['1rem', { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '500' }],
        'md': ['0.812rem', { lineHeight: '21px', letterSpacing: '-2%', fontWeight: '400' }],
        'md-bold': ['0.812rem', { lineHeight: '21px', letterSpacing: '-2%', fontWeight: '700' }],
        'md-semibold': ['0.812rem', { lineHeight: '21px', letterSpacing: '-2%', fontWeight: '600' }],
        'xl': ['1.25rem', { lineHeight: '28px', letterSpacing: '-2%', fontWeight: '400' }],
        'xl-bold': ['1.25rem', { lineHeight: '28px', letterSpacing: '-2%', fontWeight: '700' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

