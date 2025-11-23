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

// Known brand names in Persian
const knownBrands = [
  "زرجف", "مارلی", "شنل", "دیور", "جیوانچی", "کرید", "لاگوست", "ایوسن لورن",
  "کلوین کلین", "تروساردی", "مون بلان", "هالوین", "روبرتو کاوالی", "لایت بلو",
  "شی سیدو", "ناسوماتو", "نارسیسو رودریگز", "کارولیناهررا", "دانهیل", "لانکوم",
  "گرلن", "گوچی", "لالیک", "آزارو", "لوئوه", "ویکتوراندرالف", "ویکتوریا سکرت",
  "بولگاری", "جورجیو آرمانی", "لنوین", "میسون فرانسیس کرکجان", "هرمس", "اسنتریک",
  "کارتیر", "کلایو کریستین", "پنهالیگونز", "اسکادا", "اسی میاکه", "کنزو",
  "جنیفرلوپز", "دیویدوف", "آمواج", "ای ایکس نیهیلو", "ممو پاریس", "بای کیلیان",
  "دسکوارد", "بودیسیا", "روشاز", "تیری موگله", "اینیشیو پارفومز پرایوز",
  "تیزیاناترنزی", "الفکتیو", "اورتوپاریسی", "لویی ویتون", "تام فورد",
  "ژان پل گوتیه", "اتکینسون", "کاپتان بلک", "ورساچه", "باربری", "ناتیکا",
  "له لابو", "مارک آنتونی", "ریحانا", "کایالی"
];

// Read CSV
const csvContent = fs.readFileSync(csvPath, "utf-8");
const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);

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

function mapGender(csvGender) {
  if (!csvGender) return "Unisex";
  const gender = csvGender.trim();
  if (gender === "مرد") return "Male";
  if (gender === "زن") return "Female";
  if (gender === "یونیسکس") return "Unisex";
  return "Unisex";
}

function normalizeName(name) {
  return name?.toLowerCase().trim().replace(/\s+/g, " ") || "";
}

// Create lookup maps
const perfumeMap = new Map();
existingPerfumes.forEach((p) => {
  const key = normalizeName(p.name_en);
  perfumeMap.set(key, p);
  // Also index by name parts for flexible matching
  if (p.name_en) {
    const parts = p.name_en.toLowerCase().split(/\s+/);
    parts.forEach((part) => {
      if (part.length > 3 && !perfumeMap.has(part)) {
        perfumeMap.set(part, p); // Store reference for lookup
      }
    });
  }
});

const brandSet = new Set(existingBrands.map((b) => b.name?.trim()).filter(Boolean));
const collectionSet = new Set(existingCollections.map((c) => c.name?.trim()).filter(Boolean));

// Process CSV
const newPerfumes = [];
const updatedPerfumes = [];
const newBrandsSet = new Set();
const newCollectionsSet = new Set();
const csvPerfumes = [];

console.log(`\n🔄 Processing ${lines.length - 1} CSV rows...`);

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 6) continue;

  const nameEn = fields[1]?.trim(); // نام انگلیسی
  const nameFa = fields[0]?.trim(); // نام فارسی
  const brandPersian = fields[5]?.trim(); // برند
  const collectionPersian = fields[6]?.trim(); // کالکشن
  const gender = mapGender(fields[8]); // جنسیت

  if (!nameEn) continue;

  const topNotes = parseNotes(fields[2] || "");
  const middleNotes = parseNotes(fields[3] || "");
  const baseNotes = parseNotes(fields[4] || "");

  // Validate brand - be strict, only accept known brands or reasonable brand names
  let validBrand = null;
  if (brandPersian) {
    const brandTrimmed = brandPersian.trim();
    // Only accept if it's in known brands list
    // Or if it's a reasonable length and doesn't look like a note
    if (knownBrands.includes(brandTrimmed)) {
      validBrand = brandTrimmed;
    } else if (
      brandTrimmed.length >= 3 &&
      brandTrimmed.length <= 30 &&
      !brandTrimmed.includes("،") && // No commas (notes have commas)
      !brandTrimmed.includes(",") &&
      !brandTrimmed.match(/^(لیمو|رز|یاس|وانیل|مشک|سدر|چوب|گل|برگ|شکوفه|دانه|نعناع|فلفل|دارچین|زعفران|هل|جوز|میخک|گشنیز|زنجبیل|زیره|ادویه|عسل|شکلات|کاکائو|لوبیا|کومارین|شکر|قند|پشمک|تافی|خامه|شیر|بادام|فندق|گردو|ریحان|مریم|رزماری|آویشن|ترخون|پونه|چای|ترکیبات|علف|نمونه|کهربا|عنبر|لابدانیوم|لابدانوم|بنزوئین|صمغ|کندر|رزین|گالبانوم|المی|اولیبانوم|نت|روایح|مشک|پودر|خس|وتیور|خزه|آمبروکسان|آمبرت|کشمران|آکورد|آمبرگریس|اپوپوناکس|آب|جلبک|نمک|ماسه|چرم|جیر|زباد|تنباکو|دود|پاپیروس|اسطوخودوس|اکالیپتوس|پچولی|عود|عثمانتوس|اسمنتوس|بخور|سنبل|به|بهار|نرولی|شکوفه|آلدهید|پتی|پیچ|گاردنیا|مگنولیا|لاله|نیلوفر|نی|سرو|پالو|سالویا|گل|بابونه|زالزالک|درمنه|شاهبوی|ریشه|گلسنگ|درخت|بلوط|غلات|جیران|پارادیسون|متیل|ترکیب|آمیل|پتالیا|نیمفیل|ماهونیا|داوانا|ناگارموتا|روغن|آکیگالا|تولو|بلسان|فیبر|بوته|میستیکال)/) // Not a common note word
    ) {
      // Might be a valid brand name
      validBrand = brandTrimmed;
    }
  }

  // Check if perfume exists (try multiple matching strategies)
  const nameEnNorm = normalizeName(nameEn);
  let existingPerfume = perfumeMap.get(nameEnNorm);
  
  if (!existingPerfume) {
    // Try matching by last word (e.g., "Casamorati Mefisto" -> "Mefisto")
    const nameParts = nameEnNorm.split(/\s+/);
    if (nameParts.length > 1) {
      const lastName = nameParts[nameParts.length - 1];
      existingPerfume = perfumeMap.get(lastName);
    }
  }

  if (existingPerfume) {
    // Update existing perfume with brand/collection if missing
    let updated = false;
    if (validBrand && !existingPerfume.brand) {
      existingPerfume.brand = validBrand;
      updated = true;
    }
    if (collectionPersian && !existingPerfume.collection) {
      existingPerfume.collection = collectionPersian;
      updated = true;
    }
    // Update notes if they're missing or empty
    if (existingPerfume.notes && (
      !existingPerfume.notes.top?.length ||
      !existingPerfume.notes.middle?.length ||
      !existingPerfume.notes.base?.length
    )) {
      if (topNotes.length > 0) existingPerfume.notes.top = topNotes;
      if (middleNotes.length > 0) existingPerfume.notes.middle = middleNotes;
      if (baseNotes.length > 0) existingPerfume.notes.base = baseNotes;
      updated = true;
    }
    if (updated) {
      updatedPerfumes.push(nameEn);
    }
  } else {
    // New perfume
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
    csvPerfumes.push(nameEn);
  }

  // Track brands and collections
  if (validBrand && !brandSet.has(validBrand)) {
    newBrandsSet.add(validBrand);
  }
  if (collectionPersian && !collectionSet.has(collectionPersian)) {
    newCollectionsSet.add(collectionPersian);
  }
}

console.log(`\n✅ Processing complete!`);
console.log(`📊 New perfumes: ${newPerfumes.length}`);
console.log(`📊 Updated perfumes: ${updatedPerfumes.length}`);
console.log(`📊 New brands: ${newBrandsSet.size}`);
console.log(`📊 New collections: ${newCollectionsSet.size}`);

// Add new brands
if (newBrandsSet.size > 0) {
  console.log(`\n➕ Adding brands:`);
  Array.from(newBrandsSet).sort().forEach((brand) => {
    existingBrands.push({ name: brand });
    console.log(`  ✅ ${brand}`);
  });
}

// Add new collections
if (newCollectionsSet.size > 0) {
  console.log(`\n➕ Adding collections:`);
  Array.from(newCollectionsSet).sort().forEach((collection) => {
    existingCollections.push({ name: collection });
    console.log(`  ✅ ${collection}`);
  });
}

// Add new perfumes
if (newPerfumes.length > 0) {
  console.log(`\n➕ Adding perfumes:`);
  newPerfumes.forEach((p) => {
    console.log(`  ✅ ${p.name_en} (${p.brand || "No brand"})`);
  });
  existingPerfumes.push(...newPerfumes);
}

if (updatedPerfumes.length > 0) {
  console.log(`\n🔄 Updated perfumes (first 10):`);
  updatedPerfumes.slice(0, 10).forEach((name) => {
    console.log(`  ✅ ${name}`);
  });
  if (updatedPerfumes.length > 10) {
    console.log(`  ... and ${updatedPerfumes.length - 10} more`);
  }
}

// Write updated files
console.log(`\n💾 Writing updated JSON files...`);
fs.writeFileSync(perfumesPath, JSON.stringify(existingPerfumes, null, 2), "utf-8");
fs.writeFileSync(brandsPath, JSON.stringify(existingBrands, null, 2), "utf-8");
fs.writeFileSync(collectionsPath, JSON.stringify(existingCollections, null, 2), "utf-8");

console.log(`\n🎉 Complete!`);
console.log(`📊 Final counts:`);
console.log(`  Perfumes: ${existingPerfumes.length} (added ${newPerfumes.length}, updated ${updatedPerfumes.length})`);
console.log(`  Brands: ${existingBrands.length} (added ${newBrandsSet.size})`);
console.log(`  Collections: ${existingCollections.length} (added ${newCollectionsSet.size})`);

