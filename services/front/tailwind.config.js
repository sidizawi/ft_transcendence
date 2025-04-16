/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./srcs/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode warm orange palette
        'orange-darker': '#C65F3F',
        'orange': '#E17A54',
        'orange-light': '#F4A582',
        'orange-lighter': '#FCDBC7',
        'orange-lightest': '#FEF0E8',
        'cream': '#FFFAF6',
        // Dark mode nature palette
        'nature-lightest': '#DAD7CD',
        'nature-light': '#A3B18A',
        'nature': '#588157',
        'forest': '#3A5A40',
        'forest-darker': '#344E41',
        'forest-darkest': '#2B3F35',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3840px', // 4K resolution
      },
      fontSize: {
        // Responsive font sizes for 4K
        '4k-xs': '1rem',     // 16px at 4K
        '4k-sm': '1.25rem',  // 20px at 4K
        '4k-base': '1.5rem', // 24px at 4K
        '4k-lg': '1.75rem',  // 28px at 4K
        '4k-xl': '2rem',     // 32px at 4K
        '4k-2xl': '2.5rem',  // 40px at 4K
        '4k-3xl': '3rem',    // 48px at 4K
        '4k-4xl': '3.5rem',  // 56px at 4K
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        // 4K specific spacing
        '4k-1': '0.5rem',
        '4k-2': '1rem',
        '4k-4': '2rem',
        '4k-8': '4rem',
        '4k-16': '8rem',
      },
      maxWidth: {
        'xxs': '16rem',
        '4k': '3840px',
      },
      minHeight: {
        'touch': '44px',
        '4k-touch': '88px',
      },
      minWidth: {
        'touch': '44px',
        '4k-touch': '88px',
      },
      borderRadius: {
        '4k': '1rem',
        '4k-lg': '1.5rem',
      },
    },
  },
  plugins: [
    // require('@tailwindcss/forms'),
  ],
}