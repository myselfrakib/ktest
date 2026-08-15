const fs = require('fs');
const path = require('path');

function removeEmojis(text) {
  // Matches Extended_Pictographic and optionally the variation selector \uFE0F
  return text.replace(/\p{Extended_Pictographic}\uFE0F?/gu, '');
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const cleaned = removeEmojis(content);
  if (content !== cleaned) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log('Cleaned:', filePath);
  }
}

const componentsDir = path.join(__dirname, 'src', 'components');
const filesToProcess = [
  path.join(__dirname, 'src', 'App.tsx')
];

if (fs.existsSync(componentsDir)) {
  const componentsFiles = fs.readdirSync(componentsDir)
    .filter(file => file.endsWith('.tsx'))
    .map(file => path.join(componentsDir, file));
  filesToProcess.push(...componentsFiles);
}

filesToProcess.forEach(processFile);
