const fs = require('fs');
const path = require('path');

const itPath = 'i18n/public/it.json';
const enPath = 'i18n/public/en.json';

const itJson = JSON.parse(fs.readFileSync(itPath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const files = [
  { path: 'src/pages/PrivacyPolicy.jsx', group: 'privacyPolicyPage' },
  { path: 'src/pages/TermsOfService.jsx', group: 'termsOfServicePage' },
  { path: 'src/pages/CookiePolicy.jsx', group: 'cookiePolicyPage' }
];

files.forEach(({ path: filePath, group }) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Initialize groups if they don't exist
  itJson[group] = itJson[group] || {};
  enJson[group] = enJson[group] || {};

  let kIndex = 1;
  const trRegex = /tr\(\s*(['"`](.*?)['"`])\s*,\s*(['"`](.*?)['"`])\s*\)/gs;
  
  // We need to be careful with nested quotes or escape sequences, but for now let's try a simple approach
  // and see if it works. A more robust way would be using a parser, but let's try regex first.
  
  let match;
  const replacements = [];
  
  // Use a unique marker to avoid replacing already replaced ones if strings are identical
  const matches = [];
  while ((match = trRegex.exec(content)) !== null) {
      matches.push({
          full: match[0],
          it: match[2],
          en: match[4],
          index: match.index
      });
  }

  // Iterate backwards to not mess up indices
  for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const key = `k${kIndex++}`;
      itJson[group][key] = m.it.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      enJson[group][key] = m.en.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      
      // We will replace them all at once after collecting keys to ensure sequential k1, k2...
  }

  // Re-run to handle sequential keys correctly from top to bottom
  kIndex = 1;
  content = content.replace(trRegex, (match, p1, p2, p3, p4) => {
      const key = `k${kIndex++}`;
      itJson[group][key] = p2.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      enJson[group][key] = p4.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      return `copy.${key}`;
  });

  // Remove local tr definition
  content = content.replace(/const tr = \(it, en\) => \(currentLanguage === 'it' \? it : en\);?\n?/, '');
  
  // Add import and getPublicCopy
  content = "import { getPublicCopy } from '@/public/lib/publicTranslations';\n" + content;
  
  // Insert getPublicCopy call - assuming currentLanguage is available (it's usually a prop or from useLanguage)
  // Let's check how currentLanguage is defined in these files.
  // In the files provided in the previous step, it's a prop: ({ currentLanguage }) => {
  content = content.replace(/const (\w+) = \(\{ currentLanguage \}\) => \{/, (match, name) => {
      return `${match}\n  const copy = getPublicCopy(currentLanguage, '${group}');`;
  });

  fs.writeFileSync(filePath, content);
});

fs.writeFileSync(itPath, JSON.stringify(itJson, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));

console.log('Migration complete.');
