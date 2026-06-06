/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './data/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  safelist: [
    'from-slate-600', 'to-slate-800',
    'from-blue-500', 'to-cyan-500',
    'from-emerald-500', 'to-teal-500',
    'from-orange-500', 'to-amber-500',
    'from-purple-500', 'to-pink-500',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
