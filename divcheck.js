const fs = require('fs');
const p = 'c:/Users/Morgan/Desktop/plateforme/frontend/src/ecom/pages/OrdersList.jsx';
const lines = fs.readFileSync(p, 'utf8').split('\n');
console.log('Total lines:', lines.length);
let b = 0;
for (let i = 1045; i < lines.length; i++) {
  const l = lines[i];
  const o = (l.match(/<div/g) || []).length;
  const c = (l.match(/<\/div>/g) || []).length;
  b += o - c;
  if (b <= 0 && i < lines.length - 5) {
    console.log('LINE ' + (i + 1) + ' balance=' + b + ' | ' + l.trim().substring(0, 60));
  }
}
console.log('Final balance:', b);
