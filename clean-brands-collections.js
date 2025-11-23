const fs = require("fs");
const path = require("path");

// Read the files
const brandsPath = path.join(__dirname, "brands.json");
const collectionsPath = path.join(__dirname, "collections.json");
const translationPath = path.join(__dirname, "persian-to-english-notes.json");

const brands = JSON.parse(fs.readFileSync(brandsPath, "utf-8"));
const collections = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
const translations = JSON.parse(fs.readFileSync(translationPath, "utf-8"));

console.log("📖 Cleaning brands and collections...");
console.log(`  Current brands: ${brands.length}`);
console.log(`  Current collections: ${collections.length}`);

// Get all known note names (Persian) from translation file
const allNoteNames = new Set(Object.keys(translations));
// Also add English note names
Object.values(translations).forEach((eng) => {
  if (eng && typeof eng === "string") {
    allNoteNames.add(eng.toLowerCase());
  }
});

// Known legitimate brands (from original backup and common perfume brands)
const legitimateBrands = new Set([
  "زرجف", // Xerjoff
  "شنل", // Chanel
  "دیور", // Dior
  "کرید", // Creed
  "آموآژ", // Amouage
  "تام فورد", // Tom Ford
  "ایو سن لورن", // Yves Saint Laurent
  "پاکو رابان", // Paco Rabanne
  "گیوانچی", // Givenchy
  "لاکتوز", // Lacoste
  "گوچی", // Gucci
  "ورساچه", // Versace
  "آرمانی", // Armani
  "پرادا", // Prada
  "بربری", // Burberry
  "هرمس", // Hermes
  "مارلی", // Parfums de Marly
  "لاگوست", // Lacoste
  "ایوسن لورن", // Yves Saint Laurent
  "کلوین کلین", // Calvin Klein
  "تروساردی", // Trussardi
  "مون بلان", // Montblanc
  "هالوین", // Halloween
  "روبرتو کاوالی", // Roberto Cavalli
  "لایت بلو", // Dolce & Gabbana Light Blue
  "ناسوماتو", // Nasomatto
  "نارسیسو رودریگز", // Narciso Rodriguez
  "کارولیناهررا", // Carolina Herrera
  "لانکوم", // Lancome
  "گرلن", // Guerlain
  "لالیک", // Lalique
  "لوئوه", // Loewe
  "ویکتوراندرالف", // Viktor & Rolf
  "ویکتوریا سکرت", // Victoria's Secret
  "بولگاری", // Bulgari
  "لنوین", // Lanvin
  "میسون فرانسیس کرکجان", // Maison Francis Kurkdjian
  "اسنتریک", // Escentric Molecules
  "کنزو", // Kenzo
  "جنیفرلوپز", // Jennifer Lopez
  "آمواج", // Amouage
  "ممو پاریس", // Memo Paris
  "بای کیلیان", // By Kilian
  "روشاز", // Rochas
  "تیری موگله", // Thierry Mugler
  "تیزیاناترنزی", // Tiziana Terenzi
  "اورتوپاریسی", // Orto Parisi
  "لویی ویتون", // Louis Vuitton
  "ژان پل گوتیه", // Jean Paul Gaultier
  "باربری", // Burberry
  "ناتیکا", // Nautica
  "ریحانا", // Rihanna
  "جرجی وود (تُنی چوبی و کهربایی مدرن)", // Giorgio Wood
  "فرنگی‌پانی", // Fragrance Panic
  "زیتون", // Zitoun (might be a brand)
]);

// Known legitimate collections (from original backup)
const legitimateCollections = new Set([
  "Casamorati",
  "Allure Homme",
  "Poison",
  "Le Male",
  "Code",
  "Interlude",
  "Aventus Line",
  "Private Blend",
  "Pour Homme",
  "Pour Femme",
  "مون بلان", // Montblanc
]);

// Helper function to check if a name is a note
function isNote(name) {
  if (!name || typeof name !== "string") return false;
  const normalized = name.toLowerCase().trim();

  // Check against known notes
  if (allNoteNames.has(normalized) || allNoteNames.has(name.trim())) {
    return true;
  }

  // Check for common note patterns
  const notePatterns = [
    /^(لیمو|رز|یاس|وانیل|مشک|سدر|چوب|گل|برگ|شکوفه|دانه|نعناع|فلفل|دارچین|زعفران|هل|جوز|میخک|گشنیز|زنجبیل|زیره|ادویه|عسل|شکلات|کاکائو|لوبیا|کومارین|شکر|قند|پشمک|تافی|خامه|شیر|بادام|فندق|گردو|ریحان|مریم|رزماری|آویشن|ترخون|پونه|چای|ترکیبات|علف|نمونه|کهربا|عنبر|لابدانیوم|لابدانوم|بنزوئین|صمغ|کندر|رزین|گالبانوم|المی|اولیبانوم|نت|روایح|پودر|خس|وتیور|خزه|آمبروکسان|آمبرت|کشمران|آکورد|آمبرگریس|اپوپوناکس|آب|جلبک|نمک|ماسه|چرم|جیر|زباد|تنباکو|دود|پاپیروس|اسطوخودوس|اکالیپتوس|پچولی|عود|عثمانتوس|اسمنتوس|بخور|سنبل|به|بهار|نرولی|آلدهید|پتی|پیچ|گاردنیا|مگنولیا|لاله|نیلوفر|نی|سرو|پالو|سالویا|بابونه|زالزالک|درمنه|شاهبوی|ریشه|گلسنگ|درخت|بلوط|غلات|جیران|پارادیسون|متیل|ترکیب|آمیل|پتالیا|نیمفیل|ماهونیا|داوانا|ناگارموتا|روغن|آکیگالا|تولو|بلسان|فیبر|بوته|میستیکال)/,
    /^(lemon|rose|jasmine|vanilla|musk|cedar|wood|flower|leaf|blossom|seed|mint|pepper|cinnamon|saffron|cardamom|nutmeg|clove|coriander|ginger|cumin|spice|honey|chocolate|cacao|bean|coumarin|sugar|candy|toffee|cream|milk|almond|hazelnut|walnut|basil|sage|rosemary|thyme|tarragon|oregano|tea|green|amber|labdanum|benzoin|resin|galbanum|elemi|olibanum|opoponax|powder|vetiver|moss|ambroxan|ambrette|cashmeran|accord|ambergris|water|seaweed|salt|sand|leather|suede|civet|tobacco|smoke|papyrus|lavender|eucalyptus|patchouli|oud|osmanthus|incense|hyacinth|quince|neroli|aldehydes|petitgrain|honeysuckle|gardenia|magnolia|water lily|lotus|reed|cypress|palo|clary sage|borage|chamomile|hawthorn|wormwood|orris|lichen|oak|grains|geranium|paradisone|methyl|hedione|amyl|petalia|nymphaea|mahonia|davana|nagarmotha|oil|akigala|tolu|balsam|fiber|wild|mystical)/i,
  ];

  return notePatterns.some((pattern) => pattern.test(normalized));
}

// Filter brands - keep only legitimate brands
const cleanedBrands = brands
  .filter((brand) => {
    const name = brand.name?.trim();
    if (!name) return false;

    // Keep if it's a known legitimate brand
    if (legitimateBrands.has(name)) {
      return true;
    }

    // Remove if it's a note
    if (isNote(name)) {
      return false;
    }

    // Keep if it looks like a brand name (not a note pattern)
    // Brand names are usually longer, don't match note patterns, and might be in English
    const isEnglishBrand = /^[A-Za-z\s&'-]+$/.test(name);
    const isPersianBrand = /^[\u0600-\u06FF\s]+$/.test(name) && name.length > 2;

    // If it's a single word that matches a note, remove it
    const words = name.split(/\s+/);
    if (words.length === 1 && isNote(words[0])) {
      return false;
    }

    // Keep if it's a multi-word name that doesn't look like notes
    if (words.length > 1) {
      // If all words are notes, it's probably not a brand
      const allNotes = words.every((word) => isNote(word));
      if (allNotes) return false;
    }

    // Default: keep it if it doesn't match note patterns
    return !isNote(name);
  })
  .filter((brand) => {
    // Additional filtering: remove obvious notes that slipped through
    const name = brand.name?.trim();
    if (!name) return false;

    // Remove single-word items that are clearly notes
    const singleWordNotes = [
      "اوکاليپتوس",
      "آويشن",
      "ماندارین",
      "نعنا",
      "لیمو",
      "جير",
      "صنوبر",
      "نوشیدنی",
      "الکلی",
      "ریشه",
      "زنبق",
      "گیاه",
      "درمنه",
      "ناگارموتا",
      "گیاهان",
      "جنگلی",
      "شلیل",
      "کلاری",
      "سیج",
      "بنزویین",
      "کنجد",
      "رایحه",
      "باروت",
      "الیبانوم",
      "صندل",
      "وود",
      "هندوانه",
      "اوپوپوناکس",
      "لوبيا",
      "تونکا",
      "سوسن",
      "دره",
      "اولتراوانیل",
      "رام",
      "نوعی",
      "نوشیدنی",
      "جو",
      "ترمه",
      "پارچه",
      "کشميري",
      "میموس",
      "مشک",
      "مالو",
    ];

    if (singleWordNotes.includes(name)) {
      return false;
    }

    // Remove if it contains common note words
    const noteWords = ["گل", "برگ", "شکوفه", "دانه", "ریشه", "چوب", "گیاه"];
    if (noteWords.some((word) => name.includes(word) && name.length < 20)) {
      return false;
    }

    return true;
  });

// Filter collections - keep only legitimate collections
const cleanedCollections = collections
  .filter((collection) => {
    const name = collection.name?.trim();
    if (!name) return false;

    // Keep if it's a known legitimate collection
    if (legitimateCollections.has(name)) {
      return true;
    }

    // Remove if it's a note
    if (isNote(name)) {
      return false;
    }

    // Keep English collection names (usually proper nouns)
    if (/^[A-Z][a-zA-Z\s&'-]+$/.test(name)) {
      return true;
    }

    // Remove single-word notes
    const words = name.split(/\s+/);
    if (words.length === 1 && isNote(words[0])) {
      return false;
    }

    // Default: keep if it doesn't match note patterns
    return !isNote(name);
  })
  .filter((collection) => {
    // Additional filtering: remove obvious notes
    const name = collection.name?.trim();
    if (!name) return false;

    // Remove single-word items that are clearly notes
    const singleWordNotes = [
      "کلاری",
      "سیج",
      "بنزویین",
      "کنجد",
      "رایحه",
      "باروت",
      "الیبانوم",
      "صندل",
      "وود",
      "هندوانه",
      "اوپوپوناکس",
      "لوبيا",
      "تونکا",
      "سوسن",
      "دره",
      "اولتراوانیل",
      "رام",
      "نوعی",
      "نوشیدنی",
      "جو",
      "ترمه",
      "پارچه",
      "کشميري",
      "میموس",
      "مشک",
      "مالو",
      "زنبق",
    ];

    if (singleWordNotes.includes(name)) {
      return false;
    }

    // Remove if it contains common note words and is short
    const noteWords = ["گل", "برگ", "شکوفه", "دانه", "ریشه", "چوب", "گیاه"];
    if (noteWords.some((word) => name.includes(word) && name.length < 25)) {
      return false;
    }

    return true;
  });

console.log(`\n✅ Cleaning complete!`);
console.log(
  `📊 Brands: ${brands.length} → ${cleanedBrands.length} (removed ${brands.length - cleanedBrands.length})`
);
console.log(
  `📊 Collections: ${collections.length} → ${cleanedCollections.length} (removed ${collections.length - cleanedCollections.length})`
);

// Show removed items
const removedBrands = brands.filter((b) => !cleanedBrands.includes(b));
const removedCollections = collections.filter(
  (c) => !cleanedCollections.includes(c)
);

if (removedBrands.length > 0) {
  console.log(`\n🗑️  Removed brands (first 20):`);
  removedBrands.slice(0, 20).forEach((b) => {
    console.log(`  - ${b.name}`);
  });
  if (removedBrands.length > 20) {
    console.log(`  ... and ${removedBrands.length - 20} more`);
  }
}

if (removedCollections.length > 0) {
  console.log(`\n🗑️  Removed collections (first 20):`);
  removedCollections.slice(0, 20).forEach((c) => {
    console.log(`  - ${c.name}`);
  });
  if (removedCollections.length > 20) {
    console.log(`  ... and ${removedCollections.length - 20} more`);
  }
}

// Create backup
fs.writeFileSync(
  `${brandsPath}.backup2`,
  JSON.stringify(brands, null, 2),
  "utf-8"
);
fs.writeFileSync(
  `${collectionsPath}.backup2`,
  JSON.stringify(collections, null, 2),
  "utf-8"
);

// Write cleaned files
fs.writeFileSync(brandsPath, JSON.stringify(cleanedBrands, null, 2), "utf-8");
fs.writeFileSync(
  collectionsPath,
  JSON.stringify(cleanedCollections, null, 2),
  "utf-8"
);

console.log(`\n💾 Saved cleaned files`);
console.log(`💾 Backups created: *.backup2`);
