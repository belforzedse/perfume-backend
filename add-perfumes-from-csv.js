const fs = require("fs");
const path = require("path");

// Read existing JSON files
const perfumesPath = path.join(__dirname, "perfumes.json");
const brandsPath = path.join(__dirname, "brands.json");
const collectionsPath = path.join(__dirname, "collections.json");
const csvPath = path.join(__dirname, "..", "عطرها  - Sheet1.csv");

const existingPerfumes = JSON.parse(fs.readFileSync(perfumesPath, "utf-8"));
const existingBrands = JSON.parse(fs.readFileSync(brandsPath, "utf-8"));
const existingCollections = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));

console.log(`📖 Reading existing data...`);
console.log(`  Perfumes: ${existingPerfumes.length}`);
console.log(`  Brands: ${existingBrands.length}`);
console.log(`  Collections: ${existingCollections.length}`);

// Read CSV
const csvContent = fs.readFileSync(csvPath, "utf-8");
const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);
const headers = lines[0].split(",").map((h) => h.trim());

// Find column indices
const nameFaIndex = headers.findIndex((h) => h.includes("نام فارسی"));
const nameEnIndex = headers.findIndex((h) => h.includes("نام انگلیسی"));
const topNotesIndex = headers.findIndex((h) => h.includes("نت اولیه"));
const middleNotesIndex = headers.findIndex((h) => h.includes("نت میانی"));
const baseNotesIndex = headers.findIndex((h) => h.includes("نت پایانی"));
const brandIndex = headers.findIndex((h) => h.includes("برند"));
const collectionIndex = headers.findIndex((h) => h.includes("کالکشن"));
const genderIndex = headers.findIndex((h) => h.includes("جنسیت"));

console.log(`\n📋 CSV columns found:`);
console.log(`  Name FA: ${nameFaIndex}, Name EN: ${nameEnIndex}`);
console.log(`  Top: ${topNotesIndex}, Middle: ${middleNotesIndex}, Base: ${baseNotesIndex}`);
console.log(`  Brand: ${brandIndex}, Collection: ${collectionIndex}, Gender: ${genderIndex}`);

// Helper to parse notes
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

// Helper to parse CSV fields (handle quoted strings)
function parseCSVLine(line) {
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
  return fields;
}

// Map gender from CSV to JSON format
function mapGender(csvGender) {
  if (!csvGender) return "Unisex";
  const gender = csvGender.trim();
  if (gender === "مرد") return "Male";
  if (gender === "زن") return "Female";
  if (gender === "یونیسکس") return "Unisex";
  return "Unisex";
}

// Create sets for quick lookup
const existingPerfumeNames = new Set(
  existingPerfumes.map((p) => p.name_en?.toLowerCase().trim())
);
const existingBrandNames = new Set(
  existingBrands.map((b) => b.name?.trim())
);
const existingCollectionNames = new Set(
  existingCollections.map((c) => c.name?.trim())
);

// Process CSV
const newPerfumes = [];
const newBrands = new Set();
const newCollections = new Set();

console.log(`\n🔄 Processing CSV...`);

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 5) continue;

  const nameEn = fields[nameEnIndex]?.trim();
  const nameFa = fields[nameFaIndex]?.trim();
  let brandPersian = fields[brandIndex]?.trim();
  const collectionPersian = fields[collectionIndex]?.trim();
  const gender = mapGender(fields[genderIndex]);

  if (!nameEn) continue;

  // Check if perfume already exists
  if (existingPerfumeNames.has(nameEn.toLowerCase())) {
    continue; // Skip existing perfumes
  }

  // Clean brand name - sometimes it might be empty or contain notes
  // Only use if it's a reasonable brand name (not a note)
  if (brandPersian) {
    // Filter out obvious note names (they're usually single words or very short)
    // Brand names in Persian are typically recognizable
    const commonBrands = ["زرجف", "شنل", "دیور", "کرید", "مارلی", "ایوسن لورن", "لایت بلو", "گوچی", "لالیک", "آزارو", "لوئوه", "ویکتوراندرالف", "ویکتوریا سکرت", "بولگاری", "جورجیو آرمانی", "لنوین", "میسون فرانسیس کرکجان", "هرمس", "اسنتریک", "کارتیر", "کلایو کریستین", "پنهالیگونز", "اسکادا", "اسی میاکه", "کنزو", "جنیفرلوپز", "دیویدوف", "آمواج", "ای ایکس نیهیلو", "ممو پاریس", "بای کیلیان", "دسکوارد", "بودیسیا", "روشاز", "تیری موگله", "اینیشیو پارفومز پرایوز", "تیزیاناترنزی", "الفکتیو", "اورتوپاریسی", "لویی ویتون", "تام فورد", "ژان پل گوتیه", "اتکینسون", "کاپتان بلک", "ورساچه", "باربری", "ناتیکا", "له لابو", "مارک آنتونی", "ریحانا", "کایالی", "جیوانچی", "کلوین کلین", "بوگارت", "تروساردی", "مون بلان", "هالوین", "روبرتو کاوالی", "شی سیدو", "ناسوماتو", "نارسیسو رودریگز", "کارولیناهررا", "دانهیل", "لانکوم", "گرلن", "پاکورابان"];
    
    // If it's not in common brands and looks like a note (contains common note words), skip it
    if (!commonBrands.includes(brandPersian) && brandPersian.length < 10) {
      // Might be a note, try to extract from perfume name or set to null
      brandPersian = null;
    }
  }

  // Parse notes
  const topNotes = parseNotes(fields[topNotesIndex] || "");
  const middleNotes = parseNotes(fields[middleNotesIndex] || "");
  const baseNotes = parseNotes(fields[baseNotesIndex] || "");

  // Track new brands and collections
  if (brandPersian && !existingBrandNames.has(brandPersian)) {
    newBrands.add(brandPersian);
  }
  if (collectionPersian && !existingCollectionNames.has(collectionPersian)) {
    newCollections.add(collectionPersian);
  }

  // Create perfume object
  const perfume = {
    brand: brandPersian || null,
    collection: collectionPersian || null,
    name_en: nameEn,
    name_fa: nameFa || nameEn,
    gender: gender,
    season: null, // Not in CSV, will need to be set manually
    family: null, // Not in CSV, will need to be set manually
    character: null, // Not in CSV, will need to be set manually
    notes: {
      top: topNotes,
      middle: middleNotes,
      base: baseNotes,
    },
  };

  newPerfumes.push(perfume);
}

console.log(`\n✅ Processing complete!`);
console.log(`📊 New perfumes found: ${newPerfumes.length}`);
console.log(`📊 New brands found: ${newBrands.size}`);
console.log(`📊 New collections found: ${newCollections.size}`);

// Add new brands to brands.json
if (newBrands.size > 0) {
  console.log(`\n➕ Adding new brands...`);
  Array.from(newBrands).forEach((brand) => {
    existingBrands.push({ name: brand });
    console.log(`  ✅ ${brand}`);
  });
}

// Add new collections to collections.json
if (newCollections.size > 0) {
  console.log(`\n➕ Adding new collections...`);
  Array.from(newCollections).forEach((collection) => {
    existingCollections.push({ name: collection });
    console.log(`  ✅ ${collection}`);
  });
}

// Add new perfumes to perfumes.json
if (newPerfumes.length > 0) {
  console.log(`\n➕ Adding new perfumes...`);
  newPerfumes.forEach((perfume) => {
    console.log(`  ✅ ${perfume.name_en} (${perfume.brand || "No brand"})`);
  });
  existingPerfumes.push(...newPerfumes);
}

// Create backups
console.log(`\n💾 Creating backups...`);
fs.writeFileSync(
  `${perfumesPath}.backup`,
  JSON.stringify(existingPerfumes, null, 2),
  "utf-8"
);
fs.writeFileSync(
  `${brandsPath}.backup`,
  JSON.stringify(existingBrands, null, 2),
  "utf-8"
);
fs.writeFileSync(
  `${collectionsPath}.backup`,
  JSON.stringify(existingCollections, null, 2),
  "utf-8"
);

// Write updated JSON files
console.log(`\n💾 Writing updated JSON files...`);
fs.writeFileSync(perfumesPath, JSON.stringify(existingPerfumes, null, 2), "utf-8");
fs.writeFileSync(brandsPath, JSON.stringify(existingBrands, null, 2), "utf-8");
fs.writeFileSync(collectionsPath, JSON.stringify(existingCollections, null, 2), "utf-8");

console.log(`\n🎉 Complete!`);
console.log(`📊 Final counts:`);
console.log(`  Perfumes: ${existingPerfumes.length} (added ${newPerfumes.length})`);
console.log(`  Brands: ${existingBrands.length} (added ${newBrands.size})`);
console.log(`  Collections: ${existingCollections.length} (added ${newCollections.size})`);
console.log(`\n💾 Backups created: *.backup`);

