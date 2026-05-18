const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  // Backgrounds
  { regex: /bg-white\/(?:5|10|20|\[0\.\d+\])/g, replacement: 'bg-[var(--bg-card-hover)]' },
  { regex: /bg-black\/(?:5|10|40|50|\[0\.\d+\])/g, replacement: 'bg-[var(--bg-card-hover)]' },
  // Borders
  { regex: /border-white\/(?:5|10|20|\[0\.\d+\])/g, replacement: 'border-[var(--border-default)]' },
  { regex: /border-white\/30/g, replacement: 'border-[var(--border-hover)]' },
  // Dividers
  { regex: /divide-white\/(?:5|10|20|\[0\.\d+\])/g, replacement: 'divide-[var(--border-default)]' },
  
  // Specific text overrides
  { regex: /text-white\/[0-9]+/g, replacement: 'text-[var(--text-muted)]' },
  { regex: /text-white(\s|>|'|"|`|})/g, replacement: 'text-[var(--text-primary)]$1' },
  
  // Custom hardcoded HEX that clashes
  { regex: /bg-\[#1A1D24\]/g, replacement: 'bg-[var(--bg-elevated)]' },
  { regex: /bg-\[#0F1117\]/g, replacement: 'bg-[var(--bg-primary)]' },
  { regex: /from-\[#1A1D24\]/g, replacement: '' },
  { regex: /to-\[#0F1117\]/g, replacement: '' },
  { regex: /bg-gradient-to-br|bg-gradient-to-r|bg-gradient-to-b/g, replacement: '' }
];

let changedFiles = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    replacements.forEach(({regex, replacement}) => {
      content = content.replace(regex, replacement);
    });

    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
      changedFiles++;
    }
  }
});

console.log(`Refactoring complete. ${changedFiles} files updated.`);
