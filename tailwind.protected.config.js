const baseConfig = require('./tailwind.config.js')

module.exports = {
  ...baseConfig,
  content: [
    './src/ProtectedAppEntry.jsx',
    './src/Layout.jsx',
    './src/pages.config.js',
    './src/pages/**/*.{ts,tsx,js,jsx}',
    './src/operativa/**/*.{ts,tsx,js,jsx}',
    './src/web-admin/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
  ],
}