const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Marcos/Desktop/FarmaAi/farmaai-app/src/components/ui/screens';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('AuracashIcon') && !content.includes('import { AuracashIcon }')) {
    content = "import { AuracashIcon } from '../AuracashIcon';\n" + content;
    fs.writeFileSync(filePath, content);
    console.log('Fixed import in ' + f);
  }
});
