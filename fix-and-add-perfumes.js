const fs = require("fs");
const path = require("path");

// Read existing JSON files
const perfumesPath = path.join(__dirname, "perfumes.json");
const brandsPath = path.join(__dirname, "brands.json");
const collectionsPath = path.join(__dirname, "collections.json");
const csvPath = path.join(__dirname, "..", "عطرها  - Sheet1.csv");

// Restore from backup if exists
const perfumesBackup = `${perfumesPath}.backup`;
const brandsBackup = `${brandsPath}.backup`;
const collectionsBackup = `${collectionsPath}.backup`;

let existingPerfumes, existingBrands, existingCollections;

if (fs.existsSync(perfumesBackup)) {
  console.log("📖 Restoring from backup...");
  existingPerfumes = JSON.parse(fs.readFileSync(perfumesBackup, "utf-8"));
  existingBrands = JSON.parse(fs.readFileSync(brandsBackup, "utf-8"));
  existingCollections = JSON.parse(fs.readFileSync(collectionsBackup, "utf-8"));
} else {
  existingPerfumes = JSON.parse(fs.readFileSync(perfumesPath, "utf-8"));
  existingBrands = JSON.parse(fs.readFileSync(brandsPath, "utf-8"));
  existingCollections = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
}

console.log(`📖 Reading existing data...`);
console.log(`  Perfumes: ${existingPerfumes.length}`);
console.log(`  Brands: ${existingBrands.length}`);
console.log(`  Collections: ${existingCollections.length}`);

// Known brand names in Persian (from CSV)
const knownBrands = [
  "زرجف", // Xerjoff
  "مارلی", // Parfums de Marly
  "شنل", // Chanel
  "دیور", // Dior
  "جیوانچی", // Givenchy
  "کرید", // Creed
  "لاگوست", // Lacoste
  "ایوسن لورن", // Yves Saint Laurent
  "کلوین کلین", // Calvin Klein
  "تروساردی", // Trussardi
  "مون بلان", // Montblanc
  "هالوین", // Halloween
  "روبرتو کاوالی", // Roberto Cavalli
  "لایت بلو", // Dolce & Gabbana Light Blue
  "شی سیدو", // Shiseido
  "ناسوماتو", // Nasomatto
  "نارسیسو رودریگز", // Narciso Rodriguez
  "کارولیناهررا", // Carolina Herrera
  "دانهیل", // Dunhill
  "لانکوم", // Lancome
  "گرلن", // Guerlain
  "گوچی", // Gucci
  "لالیک", // Lalique
  "آزارو", // Azzaro
  "لوئوه", // Loewe
  "ویکتوراندرالف", // Viktor & Rolf
  "ویکتوریا سکرت", // Victoria's Secret
  "بولگاری", // Bulgari
  "جورجیو آرمانی", // Giorgio Armani
  "لنوین", // Lanvin
  "میسون فرانسیس کرکجان", // Maison Francis Kurkdjian
  "هرمس", // Hermes
  "اسنتریک", // Escentric Molecules
  "کارتیر", // Cartier
  "کلایو کریستین", // Clive Christian
  "پنهالیگونز", // Penhaligon's
  "اسکادا", // Escada
  "اسی میاکه", // Issey Miyake
  "کنزو", // Kenzo
  "جنیفرلوپز", // Jennifer Lopez
  "دیویدوف", // Davidoff
  "آمواج", // Amouage
  "ای ایکس نیهیلو", // Ex Nihilo
  "ممو پاریس", // Memo Paris
  "بای کیلیان", // By Kilian
  "دسکوارد", // DSquared2
  "بودیسیا", // Boadicea the Victorious
  "روشاز", // Rochas
  "تیری موگله", // Thierry Mugler
  "اینیشیو پارفومز پرایوز", // Initio Parfums Prives
  "تیزیاناترنزی", // Tiziana Terenzi
  "الفکتیو", // Affective
  "اورتوپاریسی", // Orto Parisi
  "لویی ویتون", // Louis Vuitton
  "تام فورد", // Tom Ford
  "ژان پل گوتیه", // Jean Paul Gaultier
  "اتکینسون", // Atkinson
  "کاپتان بلک", // Captain Black
  "ورساچه", // Versace
  "باربری", // Burberry
  "ناتیکا", // Nautica
  "له لابو", // Le Labo
  "مارک آنتونی", // Marc Anthony
  "ریحانا", // Rihanna
  "کایالی", // Kayali
];

// Read CSV
const csvContent = fs.readFileSync(csvPath, "utf-8");
const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);
const headers = lines[0].split(",").map((h) => h.trim());

// Find column indices
const nameFaIndex = 0; // نام فارسی
const nameEnIndex = 1; // نام انگلیسی
const topNotesIndex = 2; // نت اولیه
const middleNotesIndex = 3; // نت میانی
const baseNotesIndex = 4; // نت پایانی
const brandIndex = 5; // برند
const collectionIndex = 6; // کالکشن
const genderIndex = 8; // جنسیت

console.log(`\n📋 Processing CSV with ${lines.length - 1} rows...`);

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

// Helper to parse CSV line
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

// Map gender
function mapGender(csvGender) {
  if (!csvGender) return "Unisex";
  const gender = csvGender.trim();
  if (gender === "مرد") return "Male";
  if (gender === "زن") return "Female";
  if (gender === "یونیسکس") return "Unisex";
  return "Unisex";
}

// Create lookup sets with flexible matching
const existingPerfumeNames = new Set(
  existingPerfumes.map((p) => p.name_en?.toLowerCase().trim()).filter(Boolean)
);

// Also create a set of name parts for flexible matching
const existingPerfumeNameParts = new Set();
existingPerfumes.forEach((p) => {
  const name = p.name_en?.toLowerCase().trim();
  if (name) {
    existingPerfumeNameParts.add(name);
    // Also add parts (e.g., "Casamorati Mefisto" -> "mefisto")
    const parts = name.split(/\s+/);
    parts.forEach((part) => {
      if (part.length > 2) {
        existingPerfumeNameParts.add(part);
      }
    });
  }
});

const existingBrandNames = new Set(
  existingBrands.map((b) => b.name?.trim()).filter(Boolean)
);
const existingCollectionNames = new Set(
  existingCollections.map((c) => c.name?.trim()).filter(Boolean)
);

// Process CSV
const newPerfumes = [];
const newBrandsSet = new Set();
const newCollectionsSet = new Set();

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 6) continue;

  const nameEn = fields[nameEnIndex]?.trim();
  const nameFa = fields[nameFaIndex]?.trim();
  const brandPersian = fields[brandIndex]?.trim();
  const collectionPersian = fields[collectionIndex]?.trim();
  const gender = mapGender(fields[genderIndex]);

  if (!nameEn) continue;

  // Check if perfume already exists (flexible matching)
  const nameEnLower = nameEn.toLowerCase().trim();
  let exists = false;
  
  // Check exact match
  if (existingPerfumeNames.has(nameEnLower)) {
    exists = true;
  } else {
    // Check if any part of the name matches
    const nameParts = nameEnLower.split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 2 && existingPerfumeNameParts.has(part)) {
        // Check if this part uniquely identifies an existing perfume
        const matching = existingPerfumes.filter((p) => {
          const pName = p.name_en?.toLowerCase().trim();
          return pName && (pName === part || pName.includes(part) || part.includes(pName));
        });
        if (matching.length === 1 && matching[0].name_en?.toLowerCase().trim() === part) {
          exists = true;
          break;
        }
      }
    }
  }
  
  if (exists) {
    continue;
  }

  // Validate brand - only use if it's a known brand or looks like a brand name
  let validBrand = null;
  if (brandPersian) {
    // Check if it's in known brands list
    if (knownBrands.includes(brandPersian)) {
      validBrand = brandPersian;
    } else if (brandPersian.length > 2 && brandPersian.length < 50) {
      // Might be a valid brand, add it
      validBrand = brandPersian;
    }
  }

  // Parse notes
  const topNotes = parseNotes(fields[topNotesIndex] || "");
  const middleNotes = parseNotes(fields[middleNotesIndex] || "");
  const baseNotes = parseNotes(fields[baseNotesIndex] || "");

  // Track new brands and collections
  if (validBrand && !existingBrandNames.has(validBrand)) {
    newBrandsSet.add(validBrand);
  }
  if (collectionPersian && !existingCollectionNames.has(collectionPersian)) {
    newCollectionsSet.add(collectionPersian);
  }

  // Create perfume object
  const perfume = {
    brand: validBrand || null,
    collection: collectionPersian || null,
    name_en: nameEn,
    name_fa: nameFa || nameEn,
    gender: gender,
    season: null,
    family: null,
    character: null,
    notes: {
      top: topNotes,
      middle: middleNotes,
      base: baseNotes,
    },
  };

  newPerfumes.push(perfume);
}

console.log(`\n✅ Processing complete!`);
console.log(`📊 New perfumes: ${newPerfumes.length}`);
console.log(`📊 New brands: ${newBrandsSet.size}`);
console.log(`📊 New collections: ${newCollectionsSet.size}`);

// Add new brands
if (newBrandsSet.size > 0) {
  console.log(`\n➕ Adding brands:`);
  Array.from(newBrandsSet)
    .sort()
    .forEach((brand) => {
      existingBrands.push({ name: brand });
      console.log(`  ✅ ${brand}`);
    });
}

// Add new collections
if (newCollectionsSet.size > 0) {
  console.log(`\n➕ Adding collections:`);
  Array.from(newCollectionsSet)
    .sort()
    .forEach((collection) => {
      existingCollections.push({ name: collection });
      console.log(`  ✅ ${collection}`);
    });
}

// Add new perfumes
if (newPerfumes.length > 0) {
  console.log(`\n➕ Adding perfumes (first 10):`);
  newPerfumes.slice(0, 10).forEach((p) => {
    console.log(`  ✅ ${p.name_en} (${p.brand || "No brand"})`);
  });
  if (newPerfumes.length > 10) {
    console.log(`  ... and ${newPerfumes.length - 10} more`);
  }
  existingPerfumes.push(...newPerfumes);
}

// Write updated files
console.log(`\n💾 Writing updated JSON files...`);
fs.writeFileSync(perfumesPath, JSON.stringify(existingPerfumes, null, 2), "utf-8");
fs.writeFileSync(brandsPath, JSON.stringify(existingBrands, null, 2), "utf-8");
fs.writeFileSync(collectionsPath, JSON.stringify(existingCollections, null, 2), "utf-8");

console.log(`\n🎉 Complete!`);
console.log(`📊 Final counts:`);
console.log(`  Perfumes: ${existingPerfumes.length} (added ${newPerfumes.length})`);
console.log(`  Brands: ${existingBrands.length} (added ${newBrandsSet.size})`);
console.log(`  Collections: ${existingCollections.length} (added ${newCollectionsSet.size})`);

