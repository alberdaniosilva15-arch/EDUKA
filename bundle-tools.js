const fs = require('fs');
const path = require('path');

const filesToBundle = [
  // Páginas do Frontend (UI das ferramentas)
  'src/app/ferramentas/page.js',
  'src/app/chat/page.js',
  'src/app/ferramentas/trabalho/page.js',
  'src/app/ferramentas/melhorar/page.js',
  'src/app/ferramentas/explicar/page.js',
  'src/app/ferramentas/estudo/page.js',
  'src/app/ferramentas/pdf/page.js',
  'src/app/ferramentas/slides/page.js',
  'src/app/ferramentas/curriculo/page.js',
  
  // Rotas da API (Lógica do Backend)
  'src/app/api/chat/route.js',
  'src/app/api/generate/route.js',
  'src/app/api/improve/route.js',
  'src/app/api/explain/route.js',
  'src/app/api/estudo/route.js',
  'src/app/api/pdf/route.js',
  'src/app/api/slides/route.js',
  'src/app/api/curriculo/route.js'
];

let output = '======================================================================\n';
output += 'EDUKA — CÓDIGO COMPLETO DAS FERRAMENTAS (FRONTEND E BACKEND)\n';
output += '======================================================================\n\n';

for (const relPath of filesToBundle) {
  const absPath = path.join(__dirname, relPath);
  if (fs.existsSync(absPath)) {
    const content = fs.readFileSync(absPath, 'utf8');
    output += `\n\n======================================================================\n`;
    output += `📜 FICHEIRO: ${relPath}\n`;
    output += `======================================================================\n\n`;
    output += content;
  }
}

fs.writeFileSync(path.join(__dirname, 'codigos_ferramentas_completo.txt'), output, 'utf8');
console.log('Ficheiro codigos_ferramentas_completo.txt criado com sucesso!');
