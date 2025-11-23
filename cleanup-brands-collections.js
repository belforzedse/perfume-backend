const fs = require("fs");
const path = require("path");

// Read files
const brandsPath = path.join(__dirname, "brands.json");
const collectionsPath = path.join(__dirname, "collections.json");
const learnedNotesPath = path.join(__dirname, "learned-notes-categorized.json");

console.log("📖 Reading files...");

const brands = JSON.parse(fs.readFileSync(brandsPath, "utf-8"));
const collections = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
const learnedNotes = JSON.parse(fs.readFileSync(learnedNotesPath, "utf-8"));

// Build a set of all Persian note names (normalized)
const noteNames = new Set();
learnedNotes.notes.forEach((note) => {
  const persian = note.persian?.trim();
  if (persian) {
    noteNames.add(persian);
    // Also add normalized versions (remove extra spaces, etc.)
    noteNames.add(persian.replace(/\s+/g, " ").trim());
  }
});

console.log(`✅ Loaded ${noteNames.size} unique note names from learned notes`);
console.log(`📊 Starting counts:`);
console.log(`  Brands: ${brands.length}`);
console.log(`  Collections: ${collections.length}`);

// Helper to normalize names for comparison
function normalizeForComparison(name) {
  return name?.trim().replace(/\s+/g, " ").toLowerCase() || "";
}

// Check if a name is a known note
function isNote(name) {
  const normalized = normalizeForComparison(name);
  // Direct match
  if (noteNames.has(name.trim())) return true;

  // Check if any note contains this name or vice versa
  for (const note of noteNames) {
    const noteNormalized = normalizeForComparison(note);
    if (normalized === noteNormalized) return true;
    // Check if it's a substring match (but be careful with short names)
    if (
      name.length > 3 &&
      (normalized.includes(noteNormalized) ||
        noteNormalized.includes(normalized))
    ) {
      // Additional check: if it's clearly a note (contains common note words)
      const noteIndicators = [
        "وود",
        "ود", // wood
        "ریشه", // root
        "برگ", // leaf
        "گل", // flower
        "میوه", // fruit
        "ادویه", // spice
        "نوشیدنی", // drink
        "عادی", // common/regular (often used in notes like "اسطو خودوس عادی")
        "فرانسوی", // French (often used in notes)
        "صندل", // sandal
        "زنبق", // iris
        "اوکالیپتوس", // eucalyptus
        "لوبیا", // bean
        "کاکائو", // cocoa
        "لیمو", // lemon
        "زیتون", // olive
      ];

      const hasNoteIndicator = noteIndicators.some((indicator) =>
        normalized.includes(indicator.toLowerCase())
      );

      if (hasNoteIndicator) return true;
    }
  }

  return false;
}

// Filter brands
const validBrands = [];
const removedBrands = [];

brands.forEach((brand) => {
  const name = brand.name?.trim();
  if (!name) {
    removedBrands.push({ name: "(empty)", reason: "Empty name" });
    return;
  }

  if (isNote(name)) {
    removedBrands.push({ name, reason: "Matches known note" });
  } else {
    validBrands.push(brand);
  }
});

// Filter collections
const validCollections = [];
const removedCollections = [];

collections.forEach((collection) => {
  const name = collection.name?.trim();
  if (!name) {
    removedCollections.push({ name: "(empty)", reason: "Empty name" });
    return;
  }

  if (isNote(name)) {
    removedCollections.push({ name, reason: "Matches known note" });
  } else {
    validCollections.push(collection);
  }
});

// Report
console.log(`\n🗑️  Removed from brands (${removedBrands.length}):`);
removedBrands.forEach((item) => {
  console.log(`  ❌ ${item.name} - ${item.reason}`);
});

console.log(`\n🗑️  Removed from collections (${removedCollections.length}):`);
removedCollections.forEach((item) => {
  console.log(`  ❌ ${item.name} - ${item.reason}`);
});

console.log(`\n✅ Valid entries:`);
console.log(
  `  Brands: ${validBrands.length} (removed ${removedBrands.length})`
);
console.log(
  `  Collections: ${validCollections.length} (removed ${removedCollections.length})`
);

// Write cleaned files
console.log(`\n💾 Writing cleaned files...`);
fs.writeFileSync(brandsPath, JSON.stringify(validBrands, null, 2), "utf-8");
fs.writeFileSync(
  collectionsPath,
  JSON.stringify(validCollections, null, 2),
  "utf-8"
);

console.log(`\n🎉 Cleanup complete!`);
