import fs from "fs";
import path from "path";

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk("./server", (err, files) => {
  if (err) throw err;

  files
    .filter(f => f.endsWith(".ts") || f.endsWith(".js"))
    .forEach(file => {
      let content = fs.readFileSync(file, "utf8");
      let modified = false;
      const regex = /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g;

      content = content.replace(regex, (match, quote, inner) => {
        // Find Mojibake characters
        if (/[\u0080-\u00FF]/.test(inner)) {
          try {
            // Unescape the string to simulate exactly what the JS literal represents
            const unescaped = inner.replace(/\\(.)/g, "$1");
            const decoded = Buffer.from(unescaped, "binary").toString("utf8");
            if (/[\u0600-\u06FF]/.test(decoded)) {
              modified = true;
              return (
                quote +
                decoded.replace(new RegExp(quote, "g"), "\\" + quote) +
                quote
              );
            }
          } catch (e) {}
        }
        return match;
      });

      if (modified) {
        fs.writeFileSync(file, content, "utf8");
        console.log("Fixed:", path.relative(process.cwd(), file));
      }
    });

  // Also remove safeWriteAuditLog calls from fieldConfig.ts
  const fieldConfigPath = path.resolve(
    "./server/routes/field-customization/fieldConfig.ts"
  );
  if (fs.existsSync(fieldConfigPath)) {
    let content = fs.readFileSync(fieldConfigPath, "utf8");
    content = content.replace(/await safeWriteAuditLog\([^;]+;\s*/g, "");
    content = content.replace(
      /import \{ safeWriteAuditLog \} from ['"]\.\.\/\.\.\/utils\/safeAuditLog['"];\s*/,
      ""
    );
    fs.writeFileSync(fieldConfigPath, content, "utf8");
    console.log("Cleaned fieldConfig.ts logs");
  }

  // And from customFields.ts and customFieldValues.ts to avoid cluttering audit logs
  const customFieldsPath = path.resolve(
    "./server/routes/field-customization/customFields.ts"
  );
  if (fs.existsSync(customFieldsPath)) {
    let content = fs.readFileSync(customFieldsPath, "utf8");
    content = content.replace(/await safeWriteAuditLog\([^;]+;\s*/g, "");
    content = content.replace(
      /import \{ safeWriteAuditLog \} from ['"]\.\.\/\.\.\/utils\/safeAuditLog['"];\s*/,
      ""
    );
    fs.writeFileSync(customFieldsPath, content, "utf8");
  }

  const customFieldValuesPath = path.resolve(
    "./server/routes/field-customization/customFieldValues.ts"
  );
  if (fs.existsSync(customFieldValuesPath)) {
    let content = fs.readFileSync(customFieldValuesPath, "utf8");
    content = content.replace(/await safeWriteAuditLog\([^;]+;\s*/g, "");
    content = content.replace(
      /import \{ safeWriteAuditLog \} from ['"]\.\.\/\.\.\/utils\/safeAuditLog['"];\s*/,
      ""
    );
    fs.writeFileSync(customFieldValuesPath, content, "utf8");
  }
});
