const fs = require('fs');

const files = [
  { path: 'src/pages/PrivacyPolicy.jsx', group: 'privacyPolicyPage' },
  { path: 'src/pages/TermsOfService.jsx', group: 'termsOfServicePage' },
  { path: 'src/pages/CookiePolicy.jsx', group: 'cookiePolicyPage' }
];

files.forEach(({ path: filePath, group }) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure getPublicCopy import is only once
  if ((content.match(/import { getPublicCopy }/g) || []).length > 1) {
    content = content.replace(/import { getPublicCopy } from '@\/public\/lib\/publicTranslations';\n/, '');
  }

  // 2. Remove any remaining local tr definition and find where to insert copy
  content = content.replace(/const tr = \(itText, enText\) => currentLanguage === 'it' \? itText : enText;?\n?/, '');
  content = content.replace(/const tr = \(it, en\) => \(currentLanguage === 'it' \? it : en\);?\n?/, '');

  // 3. Fix the placement of const copy = getPublicCopy(...)
  // Remove existing copy definitions if any to avoid duplicates
  content = content.replace(/const copy = getPublicCopy\(currentLanguage, '.*?'\);?\n?/, '');

  // Insert it after currentLanguage is defined
  content = content.replace(/(const \{ currentLanguage \} = useLanguage\(\);?)/, `$1\n  const copy = getPublicCopy(currentLanguage, '${group}');`);
  
  // Also handle files where currentLanguage might be a prop (though seen it as useLanguage in the head output)
  if (!content.includes('const copy = getPublicCopy')) {
      content = content.replace(/(export default function \w+\(\{ currentLanguage \}\) \{)/, `$1\n  const copy = getPublicCopy(currentLanguage, '${group}');`);
  }

  fs.writeFileSync(filePath, content);
});
console.log('Fixes applied.');
