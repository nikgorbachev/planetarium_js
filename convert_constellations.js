const fs = require("fs");

const csv = fs.readFileSync("constellations.csv", "utf8");
const lines = csv.split("\n").slice(1);

const result = {};

for (const line of lines) {
  if (!line.trim()) continue;

  const cols = line.split(",").map(s => s.trim());
  const abr = cols[0];

  const stars = cols
    .slice(2)
    .filter(v => v !== "")
    .map(Number);

  const segments = [];
  for (let i = 0; i < stars.length - 1; i++) {
    segments.push([stars[i], stars[i + 1]]);
  }

  result[abr] = segments;
}

fs.writeFileSync(
  "constellations.json",
  JSON.stringify(result, null, 2)
);

console.log("✔ constellations.json created");
