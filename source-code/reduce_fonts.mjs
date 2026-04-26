import fs from 'fs';
const file = 'client/src/utils/pdfExports.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/size:\s*(\d+)/g, (match, p1) => {
  return 'size: ' + (parseInt(p1) - 2);
});

content = content.replace(/size\s*=\s*(\d+),/g, (match, p1) => {
  return 'size = ' + (parseInt(p1) - 2) + ',';
});

content = content.replace(/size:\s*orientation === "portrait" \? (\d+) : (\d+)/g, (match, p1, p2) => {
  return 'size: orientation === "portrait" ? ' + (parseInt(p1) - 2) + ' : ' + (parseInt(p2) - 2);
});

content = content.replace(/summaryLabelSize:\s*orientation === "portrait" \? (\d+) : (\d+)/g, (match, p1, p2) => {
  return 'summaryLabelSize: orientation === "portrait" ? ' + (parseInt(p1) - 2) + ' : ' + (parseInt(p2) - 2);
});

content = content.replace(/summaryValueSize:\s*orientation === "portrait" \? (\d+) : (\d+)/g, (match, p1, p2) => {
  return 'summaryValueSize: orientation === "portrait" ? ' + (parseInt(p1) - 2) + ' : ' + (parseInt(p2) - 2);
});

content = content.replace(/setFont\(ctx, "500", 72\)/g, 'setFont(ctx, "500", 70)');
content = content.replace(/setFont\(ctx, "500", 18\)/g, 'setFont(ctx, "500", 16)');

fs.writeFileSync(file, content);
console.log('Fonts resized successfully');
