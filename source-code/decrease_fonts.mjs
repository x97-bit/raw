import fs from "fs";

const files = [
  "client/src/utils/printExports.js",
  "client/src/utils/pdfExports.js"
];

function decreaseNumber(match, prefix, numStr, suffix) {
  const num = parseInt(numStr, 10);
  const newNum = Math.round(num * 0.55); // Decrease to 55% of current size
  return `${prefix}${newNum}${suffix}`;
}

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  
  // Decrease printExports.js px values
  content = content.replace(/(font-size:\s*["']?)(\d+)(px["']?)/g, decreaseNumber);
  content = content.replace(/(["'])(\d+)(px["'])/g, decreaseNumber);
  
  // Decrease pdfExports.js sizes
  content = content.replace(/(size:\s*orientation === "portrait" \? )(\d+)( : )/g, decreaseNumber);
  content = content.replace(/( : )(\d+)(,)/g, decreaseNumber);
  content = content.replace(/(size:\s*)(\d+)(,)/g, decreaseNumber);
  
  // Specifically fix td weight
  content = content.replace(/font-weight: 600;/g, "font-weight: 500;");
  
  fs.writeFileSync(file, content, "utf8");
  console.log(`Decreased fonts in ${file} (to 55%)`);
});
