const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Marcos/Desktop/FarmaAi/farmaai-app/src/components/ui/screens';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('Diamond')) {
    if (!content.includes('AuracashIcon')) {
      content = content.replace(/(import .*?from 'lucide-react';)/, "import { AuracashIcon } from '../AuracashIcon';\n$1");
    }
    // Handle specific import case where Diamond is part of a list
    content = content.replace(/Diamond,\s*/g, '');
    content = content.replace(/,\s*Diamond/g, '');
    content = content.replace(/import { Diamond } from 'lucide-react';\n/, '');
    
    // Replace component usage
    content = content.replace(/<Diamond/g, '<AuracashIcon');
    
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + f);
  }
});
