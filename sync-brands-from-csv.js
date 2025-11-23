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

// Brand name mapping (Persian -> English for reference, but we'll use Persian)
const brandMapping = {
  "زرجف": "Xerjoff",
  "مارلی": "Parfums de Marly",
  "شنل": "Chanel",
  "دیور": "Dior",
  "جیوانچی": "Givenchy",
  "کرید": "Creed",
  "لاگوست": "Lacoste",
  "ایوسن لورن": "Yves Saint Laurent",
  "کلوین کلین": "Calvin Klein",
  "تروساردی": "Trussardi",
  "مون بلان": "Montblanc",
  "هالوین": "Halloween",
  "روبرتو کاوالی": "Roberto Cavalli",
  "لایت بلو": "Dolce & Gabbana",
  "شی سیدو": "Shiseido",
  "ناسوماتو": "Nasomatto",
  "نارسیسو رودریگز": "Narciso Rodriguez",
  "کارولیناهررا": "Carolina Herrera",
  "دانهیل": "Dunhill",
  "لانکوم": "Lancome",
  "گرلن": "Guerlain",
  "گوچی": "Gucci",
  "لالیک": "Lalique",
  "آزارو": "Azzaro",
  "لوئوه": "Loewe",
  "ویکتوراندرالف": "Viktor & Rolf",
  "ویکتوریا سکرت": "Victoria's Secret",
  "بولگاری": "Bulgari",
  "جورجیو آرمانی": "Giorgio Armani",
  "لنوین": "Lanvin",
  "میسون فرانسیس کرکجان": "Maison Francis Kurkdjian",
  "هرمس": "Hermes",
  "اسنتریک": "Escentric Molecules",
  "کارتیر": "Cartier",
  "کلایو کریستین": "Clive Christian",
  "پنهالیگونز": "Penhaligon's",
  "اسکادا": "Escada",
  "اسی میاکه": "Issey Miyake",
  "کنزو": "Kenzo",
  "جنیفرلوپز": "Jennifer Lopez",
  "دیویدوف": "Davidoff",
  "آمواج": "Amouage",
  "ای ایکس نیهیلو": "Ex Nihilo",
  "ممو پاریس": "Memo Paris",
  "بای کیلیان": "By Kilian",
  "دسکوارد": "DSquared2",
  "بودیسیا": "Boadicea the Victorious",
  "روشاز": "Rochas",
  "تیری موگله": "Thierry Mugler",
  "اینیشیو پارفومز پرایوز": "Initio Parfums Prives",
  "تیزیاناترنزی": "Tiziana Terenzi",
  "الفکتیو": "Affective",
  "اورتوپاریسی": "Orto Parisi",
  "لویی ویتون": "Louis Vuitton",
  "تام فورد": "Tom Ford",
  "ژان پل گوتیه": "Jean Paul Gaultier",
  "اتکینسون": "Atkinson",
  "کاپتان بلک": "Captain Black",
  "ورساچه": "Versace",
  "باربری": "Burberry",
  "ناتیکا": "Nautica",
  "له لابو": "Le Labo",
  "مارک آنتونی": "Marc Anthony",
  "ریحانا": "Rihanna",
  "کایالی": "Kayali"
};

// Helper functions
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

function normalizeName(name) {
  return name?.toLowerCase().trim().replace(/\s+/g, " ") || "";
}

// Read CSV and create mapping
const csvContent = fs.readFileSync(csvPath, "utf-8");
const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);

const csvPerfumeMap = new Map(); // name_en -> {brand, collection, notes, gender}

console.log(`\n🔄 Processing ${lines.length - 1} CSV rows...`);

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 6) continue;

  const nameEn = fields[1]?.trim();
  const brandPersian = fields[5]?.trim();
  const collectionPersian = fields[6]?.trim();
  const gender = fields[8]?.trim();

  if (!nameEn) continue;

  const topNotes = parseNotes(fields[2] || "");
  const middleNotes = parseNotes(fields[3] || "");
  const baseNotes = parseNotes(fields[4] || "");

  // Only accept known brands
  const validBrand = brandPersian && brandMapping[brandPersian] ? brandPersian : null;

  csvPerfumeMap.set(normalizeName(nameEn), {
    brand: validBrand,
    collection: collectionPersian || null,
    notes: {
      top: topNotes,
      middle: middleNotes,
      base: baseNotes,
    },
    gender: gender,
  });
}

console.log(`✅ Loaded ${csvPerfumeMap.size} perfumes from CSV`);

// Update existing perfumes with CSV data
let updatedCount = 0;
let brandUpdatedCount = 0;
let collectionUpdatedCount = 0;
let notesUpdatedCount = 0;

const brandSet = new Set(existingBrands.map((b) => b.name?.trim()).filter(Boolean));
const collectionSet = new Set(existingCollections.map((c) => c.name?.trim()).filter(Boolean));
const newBrandsSet = new Set();
const newCollectionsSet = new Set();

existingPerfumes.forEach((perfume) => {
  const nameNorm = normalizeName(perfume.name_en);
  let csvData = csvPerfumeMap.get(nameNorm);
  
  // Also try matching by last word
  if (!csvData && perfume.name_en) {
    const nameParts = nameNorm.split(/\s+/);
    if (nameParts.length > 1) {
      const lastName = nameParts[nameParts.length - 1];
      csvData = csvPerfumeMap.get(lastName);
    }
  }

  if (csvData) {
    let updated = false;

    // Update brand
    if (csvData.brand && perfume.brand !== csvData.brand) {
      perfume.brand = csvData.brand;
      brandUpdatedCount++;
      updated = true;
      
      if (!brandSet.has(csvData.brand)) {
        newBrandsSet.add(csvData.brand);
      }
    }

    // Update collection
    if (csvData.collection && perfume.collection !== csvData.collection) {
      perfume.collection = csvData.collection;
      collectionUpdatedCount++;
      updated = true;
      
      if (!collectionSet.has(csvData.collection)) {
        newCollectionsSet.add(csvData.collection);
      }
    }

    // Update notes if missing
    if (csvData.notes) {
      if (!perfume.notes) {
        perfume.notes = csvData.notes;
        notesUpdatedCount++;
        updated = true;
      } else {
        // Update if notes are empty or incomplete
        if (
          (!perfume.notes.top || perfume.notes.top.length === 0) &&
          csvData.notes.top.length > 0
        ) {
          perfume.notes.top = csvData.notes.top;
          notesUpdatedCount++;
          updated = true;
        }
        if (
          (!perfume.notes.middle || perfume.notes.middle.length === 0) &&
          csvData.notes.middle.length > 0
        ) {
          perfume.notes.middle = csvData.notes.middle;
          notesUpdatedCount++;
          updated = true;
        }
        if (
          (!perfume.notes.base || perfume.notes.base.length === 0) &&
          csvData.notes.base.length > 0
        ) {
          perfume.notes.base = csvData.notes.base;
          notesUpdatedCount++;
          updated = true;
        }
      }
    }

    if (updated) {
      updatedCount++;
    }
  }
});

// Add new brands
if (newBrandsSet.size > 0) {
  console.log(`\n➕ Adding new brands:`);
  Array.from(newBrandsSet).sort().forEach((brand) => {
    existingBrands.push({ name: brand });
    console.log(`  ✅ ${brand}`);
  });
}

// Add new collections
if (newCollectionsSet.size > 0) {
  console.log(`\n➕ Adding new collections:`);
  Array.from(newCollectionsSet).sort().forEach((collection) => {
    existingCollections.push({ name: collection });
    console.log(`  ✅ ${collection}`);
  });
}

console.log(`\n📊 Update summary:`);
console.log(`  Perfumes updated: ${updatedCount}`);
console.log(`  Brands updated: ${brandUpdatedCount}`);
console.log(`  Collections updated: ${collectionUpdatedCount}`);
console.log(`  Notes updated: ${notesUpdatedCount}`);

// Write updated files
console.log(`\n💾 Writing updated JSON files...`);
fs.writeFileSync(perfumesPath, JSON.stringify(existingPerfumes, null, 2), "utf-8");
fs.writeFileSync(brandsPath, JSON.stringify(existingBrands, null, 2), "utf-8");
fs.writeFileSync(collectionsPath, JSON.stringify(existingCollections, null, 2), "utf-8");

console.log(`\n🎉 Complete!`);
console.log(`📊 Final counts:`);
console.log(`  Perfumes: ${existingPerfumes.length}`);
console.log(`  Brands: ${existingBrands.length} (added ${newBrandsSet.size})`);
console.log(`  Collections: ${existingCollections.length} (added ${newCollectionsSet.size})`);

