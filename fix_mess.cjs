const fs = require('fs');

const files = [
  { path: 'src/pages/PrivacyPolicy.jsx', group: 'privacyPolicyPage' },
  { path: 'src/pages/TermsOfService.jsx', group: 'termsOfServicePage' },
  { path: 'src/pages/CookiePolicy.jsx', group: 'cookiePolicyPage' }
];

const itPath = 'i18n/public/it.json';
const enPath = 'i18n/public/en.json';

const itJson = JSON.parse(fs.readFileSync(itPath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

files.forEach(({ path: filePath, group }) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regretfully, I have to re-extract for this specific file because the first run's regex was too greedy or stayed in a weird state.
    // Actually, let's just fix the "tr(" calls that were missed or partially replaced.
    
    // Reset group translations for this file to be sure
    itJson[group] = {};
    enJson[group] = {};
    
    // Restore the file to a clean-ish state regarding tr calls if possible, 
    // but it's easier to just fix the existing tr calls that are still there.
    
    let kIndex = 1;
    // This regex targets tr('...', '...') or tr("...", "...") even across lines
    const trRegex = /tr\(\s*(['"`](.*?)['"`])\s*,\s*(['"`](.*?)['"`])\s*\)/gs;
    
    content = content.replace(trRegex, (match, p1, p2, p3, p4) => {
        const key = `k${kIndex++}`;
        // Clean up the strings from escape characters used in JS literals
        itJson[group][key] = p2.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
        enJson[group][key] = p4.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
        return `copy.${key}`;
    });

    // Also handle any "copy.kX" that were already there if we are re-running
    // but here we are starting fresh for each file's group.
    
    // Remove local tr definitions
    content = content.replace(/const tr = \(.*?\);?\n?/g, '');
    
    // Fix imports
    if (!content.includes("import { getPublicCopy }")) {
        content = "import { getPublicCopy } from '@/public/lib/publicTranslations';\n" + content;
    }
    // Clean up duplicate imports if any
    const lines = content.split('\n');
    const uniqueLines = [];
    const seenImports = new Set();
    for (const line of lines) {
        if (line.startsWith("import { getPublicCopy }")) {
            if (seenImports.has(line)) continue;
            seenImports.add(line);
        }
        uniqueLines.push(line);
    }
    content = uniqueLines.join('\n');

    // Ensure getPublicCopy is initialized
    content = content.replace(/const copy = getPublicCopy\(.*?\);?\n?/g, '');
    content = content.replace(/(const \{ currentLanguage \} = useLanguage\(\);?)/, `$1\n  const copy = getPublicCopy(currentLanguage, '${group}');`);
    
    fs.writeFileSync(filePath, content);
});

fs.writeFileSync(itPath, JSON.stringify(itJson, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
console.log('Fixed migration and JSON.');
