const baseConfig = require('./tailwind.config.js')

module.exports = {
  ...baseConfig,
  content: [
    './index.html',
    './src/main.jsx',
    './src/App.jsx',
    './src/public/**/*.{ts,tsx,js,jsx}',
    './src/components/ui/**/*.{ts,tsx,js,jsx}',
    './src/components/legal/**/*.{ts,tsx,js,jsx}',
    './src/components/i18n/**/*.{ts,tsx,js,jsx}',
    './src/lib/PageNotFound.jsx',
  ],
}