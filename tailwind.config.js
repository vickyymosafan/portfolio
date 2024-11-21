/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#121212',
          surface: '#1a1a1a',
          card: '#1f1f1f',
          hover: '#242424',
          border: 'rgba(229, 231, 235, 0.08)'
        },
        soft: {
          primary: '#e5e7eb',
          secondary: '#d1d5db',
          tertiary: '#9ca3af'
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      },
      backgroundImage: {
        'gradient-soft': 'linear-gradient(to right, rgb(229 231 235 / 0.05), rgb(209 213 219 / 0.05))',
        'gradient-softer': 'linear-gradient(to right, rgb(229 231 235 / 0.03), rgb(209 213 219 / 0.03))',
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};