/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#538bb0',
      },
      fontFamily: {
        // Latin = Inter, JP = Noto Sans JP（studio.design 参考）
        // Yu Gothic / Hiragino を OS フォントの fallback として残す
        sans: [
          'Inter',
          '"Noto Sans JP"',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Yu Gothic"',
          '"Yu Gothic Medium"',
          '"Meiryo"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
