const fs = require("fs");
const path = require("path");

// Strapi API configuration
const API_URL = process.env.API_URL || "http://localhost:1337/api";
const API_TOKEN =
  process.env.API_TOKEN ||
  "506061ccebba94b76a5367d675f321b661507da2a96d32157153d6d1eebf633a583705d25da01f8d2d064e3bcd629b2ee8d7a439927ed863c1bfc71a3f449c4d619329fda1d4969865724874e1ba7f7508862dfd7a0f348b7c9dcadddf6831043f690c9f956132b013094e48717a1b8668a184a2fb6b0b22b4bfd76dab73d3d2";

// Read CSV data and translated notes
const csvPath = path.join(__dirname, "..", "عطرها  - Sheet1.csv");
const csvContent = fs.readFileSync(csvPath, "utf-8");
const translatedPath = path.join(__dirname, "learned-notes-translated.json");
const translatedData = JSON.parse(fs.readFileSync(translatedPath, "utf-8"));

// Create translation lookup (Persian -> English)
const translationLookup = {};
translatedData.notes.forEach((note) => {
  if (note.isTranslated && note.english) {
    translationLookup[note.persian] = note.english;
  }
});

// Helper function to translate Persian notes to English
function translateNoteList(persianNotes) {
  return persianNotes
    .map((note) => {
      const trimmed = note.trim();
      return translationLookup[trimmed] || trimmed;
    })
    .filter((note) => note && note.trim().length > 0);
}

// Parse CSV
const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);
const headers = lines[0].split(",").map((h) => h.trim());

const nameEnIndex = headers.findIndex((h) => h.includes("نام انگلیسی") || h.includes("name_en"));
const topNotesIndex = headers.findIndex((h) => h.includes("نت اولیه") || h.includes("top"));
const middleNotesIndex = headers.findIndex((h) => h.includes("نت میانی") || h.includes("middle"));
const baseNotesIndex = headers.findIndex((h) => h.includes("نت پایانی") || h.includes("base"));

console.log("📖 Reading CSV and preparing notes for database sync...");

// Helper to parse notes from CSV field
function parseNotes(noteString) {
  if (!noteString || noteString.trim().length === 0) return [];
  let cleaned = noteString.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned
    .split(/[،,]/)
    .map((note) => note.trim())
    .filter((note) => note.length > 0);
}

// Parse all perfumes from CSV
const perfumesFromCSV = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  
  // Simple CSV parsing
  const fields = [];
  let currentField = "";
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === "،") && !inQuotes) {
      fields.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());

  if (fields.length < 5) continue;

  const nameEn = fields[nameEnIndex] || fields[1];
  const topNotesPersian = parseNotes(fields[topNotesIndex] || "");
  const middleNotesPersian = parseNotes(fields[middleNotesIndex] || "");
  const baseNotesPersian = parseNotes(fields[baseNotesIndex] || "");

  perfumesFromCSV.push({
    nameEn: nameEn,
    notes: {
      top: translateNoteList(topNotesPersian),
      middle: translateNoteList(middleNotesPersian),
      base: translateNoteList(baseNotesPersian),
    },
  });
}

console.log(`Found ${perfumesFromCSV.length} perfumes in CSV`);

// Helper: GET perfume by name_en
async function getPerfumeByName(nameEn) {
  const res = await fetch(
    `${API_URL}/perfumes?filters[name_en][$eq]=${encodeURIComponent(nameEn)}&pagination[pageSize]=1`,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0] || null;
}

// Helper: PUT update perfume notes
async function updatePerfumeNotes(documentId, notes) {
  const res = await fetch(`${API_URL}/perfumes/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ data: { notes } }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Error updating ${documentId}:`, errorText);
    return null;
  }
  return res.json();
}

// Main sync function
async function syncNotes() {
  console.log("\n🔄 Starting database sync...");
  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const csvPerfume of perfumesFromCSV) {
    try {
      const existing = await getPerfumeByName(csvPerfume.nameEn);
      if (!existing) {
        console.log(`⚠️  Not found in database: ${csvPerfume.nameEn}`);
        notFound++;
        continue;
      }

      const result = await updatePerfumeNotes(existing.documentId || existing.id, csvPerfume.notes);
      if (result) {
        console.log(`✅ Updated: ${csvPerfume.nameEn}`);
        updated++;
      } else {
        errors++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${csvPerfume.nameEn}:`, error.message);
      errors++;
    }
  }

  console.log(`\n🎉 Sync complete!`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log(`❌ Errors: ${errors}`);
}

// Run sync if called directly
if (require.main === module) {
  syncNotes().catch(console.error);
}

module.exports = { syncNotes };




