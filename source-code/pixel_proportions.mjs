import fs from "fs";

// Using base: 12pt = 45px (landscape), 41px (portrait)
// 14pt = 52px (landscape), 48px (portrait)
// 18pt = 68px (landscape), 62px (portrait)
// 11pt = 41px (landscape), 37px (portrait)

let printContent = fs.readFileSync("client/src/utils/printExports.js", "utf8");

// H1 -> 18pt
printContent = printContent.replace(/\.tay-title-block h1 \{[\s\S]*?\}/, `.tay-title-block h1 {
      margin: 0;
      font-size: \${isPortrait ? "68px" : "62px"};
      color: \${TAY_ALRAWI_BRAND_COLORS.text};
      letter-spacing: 0.2px;
      line-height: 1.5;
      padding-bottom: 6px;
    }`);

// Subtitle -> 14pt
printContent = printContent.replace(/\.tay-report-subtitle \{[\s\S]*?\}/, `.tay-report-subtitle {
      margin-bottom: 4px;
      font-size: 52px;
      color: \${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-weight: 700;
    }`);

// Summary Label -> 12pt
printContent = printContent.replace(/\.tay-summary-card span \{[\s\S]*?\}/, `.tay-summary-card span {
      display: block;
      margin-bottom: 6px;
      color: #5c6482;
      font-size: 45px;
      font-weight: 700;
    }`);

// Summary Value -> 14pt
printContent = printContent.replace(/\.tay-summary-card strong \{[\s\S]*?\}/, `.tay-summary-card strong {
      color: \${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-size: 52px;
      font-weight: 800;
    }`);

// Section Title -> 14pt
printContent = printContent.replace(/\.tay-section-title \{[\s\S]*?\}/, `.tay-section-title {
      margin: 0;
      color: \${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-size: 52px;
      font-weight: 800;
    }`);

// Section Subtitle -> 12pt
printContent = printContent.replace(/\.tay-section-subtitle \{[\s\S]*?\}/, `.tay-section-subtitle {
      margin-top: 3px;
      color: \${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-size: 45px;
      font-weight: 700;
    }`);

// th -> 12pt (weight 800)
printContent = printContent.replace(/\.tay-table th \{[\s\S]*?\}/, `.tay-table th {
      background: \${TAY_ALRAWI_BRAND_COLORS.tableNavy};
      color: #fff;
      font-weight: 800;
      white-space: nowrap;
      word-break: normal;
      padding: 8px 6px;
      font-size: \${isPortrait ? "45px" : "41px"};
    }`);

// td -> 12pt (weight 500)
printContent = printContent.replace(/\.tay-table td \{[\s\S]*?\}/, `.tay-table td {
      font-size: \${isPortrait ? "45px" : "41px"};
      font-weight: 500;
    }`);
// Fix CSS overlapping td rule if exists
printContent = printContent.replace(/\.tay-table td \{\s*font-size:\s*\$\{isPortrait \? "55px" : "51px"\};\s*\}/, "");

// meta -> 14pt
printContent = printContent.replace(/\.tay-meta-inline,\s*\.tay-meta-stack \{[\s\S]*?\}/, `.tay-meta-inline,
    .tay-meta-stack {
      display: flex;
      align-items: flex-start;
      gap: 12px 22px;
      flex-wrap: wrap;
      color: #1f2937;
      font-size: 52px;
      font-weight: 700;
    }`);

// footer -> 11pt
printContent = printContent.replace(/font-size: 20px;/g, "font-size: 41px;");

fs.writeFileSync("client/src/utils/printExports.js", printContent, "utf8");

// --- PDF Exports ---
let pdfContent = fs.readFileSync("client/src/utils/pdfExports.js", "utf8");

// Header title: 18pt
pdfContent = pdfContent.replace(/size: 72,\s*weight: "800"/, 'size: 68,\n    weight: "800"');
// Header subtitle: 14pt
pdfContent = pdfContent.replace(/size: 49,\s*weight: "700"/, 'size: 52,\n      weight: "700"');
// Summary Card label: 12pt
pdfContent = pdfContent.replace(/size: 39,\s*weight: "700"/, 'size: 45,\n        weight: "700"');
// Summary Card value: 14pt
pdfContent = pdfContent.replace(/size: 60,\s*weight: "700"/, 'size: 52,\n        weight: "800"');

// th: 12pt (bold)
pdfContent = pdfContent.replace(/size: orientation === "portrait" \? 57 : 51/g, 'size: orientation === "portrait" ? 45 : 41');
// td: 12pt (normal)
pdfContent = pdfContent.replace(/size: orientation === "portrait" \? 51 : 44/g, 'size: orientation === "portrait" ? 45 : 41');
pdfContent = pdfContent.replace(/const textWeight = "700";/g, 'const textWeight = "500";');

// row heights for 45px text -> 65px header, 60px row
pdfContent = pdfContent.replace(/const headerHeight = orientation === "portrait" \? 90 : 78;/g, 'const headerHeight = orientation === "portrait" ? 65 : 60;');
pdfContent = pdfContent.replace(/const rowHeight = orientation === "portrait" \? 78 : 68;/g, 'const rowHeight = orientation === "portrait" ? 60 : 55;');

fs.writeFileSync("client/src/utils/pdfExports.js", pdfContent, "utf8");
console.log("Applied proportional pixel mapping based on pt sizes.");
