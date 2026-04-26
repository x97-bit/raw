import fs from "fs";

const files = [
  "client/src/utils/printExports.js",
  "client/src/utils/pdfExports.js"
];

function increaseNumber(match, prefix, numStr, suffix) {
  const num = parseInt(numStr, 10);
  const newNum = Math.round(num * 1.15); // Increase by 15%
  return `${prefix}${newNum}${suffix}`;
}

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  
  // For printExports.js (CSS font-size: 48px)
  content = content.replace(/(font-size:\s*["']?)(\d+)(px["']?)/g, increaseNumber);
  
  // For printExports.js inside literals (e.g. "48px" : "44px")
  content = content.replace(/(["'])(\d+)(px["'])/g, increaseNumber);
  
  // For pdfExports.js (size: 44)
  content = content.replace(/(size:\s*orientation === "portrait" \? )(\d+)( : )/g, increaseNumber);
  content = content.replace(/( : )(\d+)(,)/g, increaseNumber);
  
  // For pdfExports.js (size: 28,)
  content = content.replace(/(size:\s*)(\d+)(,)/g, increaseNumber);

  fs.writeFileSync(file, content, "utf8");
  console.log(`Updated fonts in ${file}`);
});
