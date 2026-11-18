const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/lib/dashboardTranslations.js");
const source = fs.readFileSync(file, "utf8");

function keys(locale) {
  const match = source.match(new RegExp(`${locale}:\\s*\\{([\\s\\S]*?)\\n  \\},`));
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/^\s{4}([A-Za-z][A-Za-z0-9]*):/gm)].map((item) => item[1]));
}

const az = keys("az");
const en = keys("en");
const missingInEn = [...az].filter((key) => !en.has(key));
const missingInAz = [...en].filter((key) => !az.has(key));

if (missingInEn.length || missingInAz.length) {
  if (missingInEn.length) console.error(`Missing in EN: ${missingInEn.join(", ")}`);
  if (missingInAz.length) console.error(`Missing in AZ: ${missingInAz.length ? missingInAz.join(", ") : ""}`);
  process.exit(1);
}

console.log(`Locale keys match (${az.size} keys).`);
