import fs from "fs";

// 1. Fix printExports.js (using pt)
let printContent = fs.readFileSync("client/src/utils/printExports.js", "utf8");

// We'll replace all font-size pixel values with static pt values as requested by user.
printContent = printContent.replace(/\.tay-title-block h1 \{[\s\S]*?\}/, `.tay-title-block h1 {
      margin: 0;
      font-size: 16pt;
      color: \${TAY_ALRAWI_BRAND_COLORS.text};
      letter-spacing: 0.2px;
      line-height: 1.5;
      padding-bottom: 6px;
    }`);

printContent = printContent.replace(/\.tay-report-subtitle \{[\s\S]*?\}/, `.tay-report-subtitle {
      margin-bottom: 4px;
      font-size: 14pt;
      color: \${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-weight: 700;
    }`);

printContent = printContent.replace(/\.tay-summary-card span \{[\s\S]*?\}/, `.tay-summary-card span {
      display: block;
      margin-bottom: 6px;
      color: #5c6482;
      font-size: 12pt;
      font-weight: 700;
    }`);

printContent = printContent.replace(/\.tay-summary-card strong \{[\s\S]*?\}/, `.tay-summary-card strong {
      color: \${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-size: 14pt;
      font-weight: 800;
    }`);

printContent = printContent.replace(/\.tay-section-title \{[\s\S]*?\}/, `.tay-section-title {
      margin: 0;
      color: \${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-size: 14pt;
      font-weight: 800;
    }`);

printContent = printContent.replace(/\.tay-section-subtitle \{[\s\S]*?\}/, `.tay-section-subtitle {
      margin-top: 3px;
      color: \${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-size: 12pt;
      font-weight: 700;
    }`);

printContent = printContent.replace(/\.tay-table td \{[\s\S]*?\}/, `.tay-table td {
      font-size: 12pt;
      font-weight: 500;
    }`);

printContent = printContent.replace(/\.tay-table th \{[\s\S]*?\}/, `.tay-table th {
      background: \${TAY_ALRAWI_BRAND_COLORS.tableNavy};
      color: #fff;
      font-weight: 700;
      white-space: nowrap;
      word-break: normal;
      padding: 8px 6px;
      font-size: 12pt;
    }`);

printContent = printContent.replace(/\.tay-meta-inline,\s*\.tay-meta-stack \{[\s\S]*?\}/, `.tay-meta-inline,
    .tay-meta-stack {
      display: flex;
      align-items: flex-start;
      gap: 12px 22px;
      flex-wrap: wrap;
      color: #1f2937;
      font-size: 12pt;
      font-weight: 700;
    }`);

printContent = printContent.replace(/font-size: 8px;/g, "font-size: 11pt;"); // footer slot
fs.writeFileSync("client/src/utils/printExports.js", printContent, "utf8");


// 2. Fix pdfExports.js (using px equivalents of pt)
let pdfContent = fs.readFileSync("client/src/utils/pdfExports.js", "utf8");

// Header title: 16pt = 53px
pdfContent = pdfContent.replace(/size: 33,\s*weight: "800"/, 'size: 53,\n    weight: "800"');
// Header subtitle: 14pt = 46px
pdfContent = pdfContent.replace(/size: 23,\s*weight: "700"/, 'size: 46,\n      weight: "700"');
// Summary Card label: 12pt = 40px
pdfContent = pdfContent.replace(/size: 18,\s*weight: "700"/, 'size: 40,\n        weight: "700"');
// Summary Card value: 14pt = 46px
pdfContent = pdfContent.replace(/size: 28,\s*weight: "800"/, 'size: 46,\n        weight: "800"');

// th: 12pt = 40px
pdfContent = pdfContent.replace(/size: orientation === "portrait" \? 28 : 25/g, 'size: 40');
// td: 12pt = 40px
pdfContent = pdfContent.replace(/size: orientation === "portrait" \? 25 : 23/g, 'size: 40');

// Fix row heights based on 40px text. 40px text needs at least 55px height.
pdfContent = pdfContent.replace(/const headerHeight = orientation === "portrait" \? 27 : 23;/g, 'const headerHeight = 60;');
pdfContent = pdfContent.replace(/const rowHeight = orientation === "portrait" \? 23 : 20;/g, 'const rowHeight = 55;');

fs.writeFileSync("client/src/utils/pdfExports.js", pdfContent, "utf8");
console.log("Done updating fonts based on exact pt specifications.");
