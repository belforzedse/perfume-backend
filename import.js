const fs = require("fs");
const fetch = require("node-fetch");

// Strapi API base URL
const API_URL = process.env.API_URL || "http://82.115.26.133:1337/api";
// Paste your Strapi Admin → Settings → API Tokens → Full Access token
const API_TOKEN =
  process.env.API_TOKEN ||
  "506061ccebba94b76a5367d675f321b661507da2a96d32157153d6d1eebf633a583705d25da01f8d2d064e3bcd629b2ee8d7a439927ed863c1bfc71a3f449c4d619329fda1d4969865724874e1ba7f7508862dfd7a0f348b7c9dcadddf6831043f690c9f956132b013094e48717a1b8668a184a2fb6b0b22b4bfd76dab73d3d2";

// Helper: GET request
async function getData(endpoint, filterField, value) {
  const res = await fetch(
    `${API_URL}/${endpoint}?filters[${filterField}][$eq]=${encodeURIComponent(value)}`,
    {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );
  if (!res.ok) return null;
  return res.json();
}

// Helper: POST request
async function postData(endpoint, data) {
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    console.error(`❌ Error posting to ${endpoint}:`, await res.text());
    return null;
  }
  return res.json();
}

/**
 * NOTE TRANSLATION:
 * This script translates perfume notes from Persian to English during import.
 * This improves algorithm performance since notes are stored in English in the database,
 * matching the algorithm's English keyword matching system.
 *
 * Notes that don't have translations will be kept in Persian (the algorithm
 * can still handle them with the translatePersianNote function at runtime).
 */

// Load Persian-to-English note translation mapping
const noteTranslations = JSON.parse(
  fs.readFileSync("./persian-to-english-notes.json", "utf-8")
);

// Load learned notes for comprehensive translation
const learnedNotes = JSON.parse(
  fs.readFileSync("./learned-notes-categorized.json", "utf-8")
);

// Build a map of Persian to English from learned notes
const learnedNotesMap = new Map();
if (learnedNotes.notes && Array.isArray(learnedNotes.notes)) {
  learnedNotes.notes.forEach((note) => {
    if (note.persian && note.english && note.isTranslated) {
      learnedNotesMap.set(note.persian.trim(), note.english.trim());
    }
  });
}

// Common Persian modifiers and their English translations
const persianModifiers = {
  خونی: "blood",
  سبز: "green",
  سیاه: "black",
  سفید: "white",
  قرمز: "red",
  صورتی: "pink",
  زرد: "yellow",
  آبی: "blue",
  فرانسوی: "french",
  ایتالیایی: "italian",
  چینی: "chinese",
  هندی: "indian",
  مطلق: "absolute",
  عادی: "common",
  تلخ: "bitter",
  شیرین: "sweet",
  ترش: "sour",
  تازه: "fresh",
  خشک: "dry",
  خیس: "wet",
};

// Helper function to translate compound notes (e.g., "ماندارین خونی" -> "blood mandarin")
function translateCompoundNote(persianNote) {
  const trimmed = persianNote.trim();
  const words = trimmed.split(/\s+/);

  if (words.length < 2) return null;

  // Try to find a base note and a modifier
  for (let i = 0; i < words.length; i++) {
    const possibleModifier = words[i];
    const modifierTranslation = persianModifiers[possibleModifier];

    if (modifierTranslation) {
      // Found a modifier, try to translate the rest
      const baseWords = words.filter((w, idx) => idx !== i);
      const baseNote = baseWords.join(" ");

      // Try to translate the base note
      let baseTranslation = null;

      // Check learned notes first
      if (learnedNotesMap.has(baseNote)) {
        baseTranslation = learnedNotesMap.get(baseNote);
      } else if (
        noteTranslations[baseNote] &&
        typeof noteTranslations[baseNote] === "string"
      ) {
        baseTranslation = noteTranslations[baseNote];
      }

      if (baseTranslation) {
        // Return modifier + base (e.g., "blood mandarin")
        return `${modifierTranslation} ${baseTranslation}`;
      }
    }
  }

  return null;
}

// Helper function to translate a single note from Persian to English
function translateNote(persianNote) {
  if (!persianNote || typeof persianNote !== "string") return persianNote;

  const trimmed = persianNote.trim();

  // 1. Try exact match in learned notes (most comprehensive)
  if (learnedNotesMap.has(trimmed)) {
    return learnedNotesMap.get(trimmed);
  }

  // 2. Try exact match in simple translation mapping
  const translation = noteTranslations[trimmed];
  if (translation && typeof translation === "string") {
    return translation;
  }

  // 3. Try to translate compound notes (e.g., "ماندارین خونی")
  const compoundTranslation = translateCompoundNote(trimmed);
  if (compoundTranslation) {
    return compoundTranslation;
  }

  // 4. If no translation found, return the original Persian note
  // (algorithm can still handle it with translatePersianNote function)
  return trimmed;
}

// Helper function to translate notes object (top/middle/base arrays)
function translateNotes(notes) {
  if (!notes || typeof notes !== "object") return notes;

  return {
    top:
      Array.isArray(notes.top) ?
        notes.top.map(translateNote).filter(Boolean)
      : [],
    middle:
      Array.isArray(notes.middle) ?
        notes.middle.map(translateNote).filter(Boolean)
      : [],
    base:
      Array.isArray(notes.base) ?
        notes.base.map(translateNote).filter(Boolean)
      : [],
  };
}

async function main() {
  const brands = JSON.parse(fs.readFileSync("./brands.json", "utf-8"));
  const collections = JSON.parse(
    fs.readFileSync("./collections.json", "utf-8")
  );
  const perfumes = JSON.parse(fs.readFileSync("./perfumes.json", "utf-8"));

  // Map English brand names to Persian names (reverse of brandMapping from sync-brands-from-csv.js)
  // This handles perfumes.json entries that still have English brand names
  const englishToPersianBrand = {
    Xerjoff: "زرجف",
    "Parfums de Marly": "مارلی",
    Chanel: "شنل",
    Dior: "دیور",
    Givenchy: "گیوانچی",
    Creed: "کرید",
    Lacoste: "لاگوست",
    "Yves Saint Laurent": "ایوسن لورن",
    "Calvin Klein": "کلوین کلین",
    Trussardi: "تروساردی",
    Montblanc: "مون بلان",
    Halloween: "هالوین",
    "Roberto Cavalli": "روبرتو کاوالی",
    "Dolce & Gabbana": "لایت بلو",
    Shiseido: "شی سیدو",
    Nasomatto: "ناسوماتو",
    "Narciso Rodriguez": "نارسیسو رودریگز",
    "Carolina Herrera": "کارولیناهررا",
    Dunhill: "دانهیل",
    Lancome: "لانکوم",
    Guerlain: "گرلن",
    Gucci: "گوچی",
    Lalique: "لالیک",
    Azzaro: "آزارو",
    Loewe: "لوئوه",
    "Viktor & Rolf": "ویکتوراندرالف",
    "Victoria's Secret": "ویکتوریا سکرت",
    Bulgari: "بولگاری",
    "Giorgio Armani": "جورجیو آرمانی",
    Lanvin: "لنوین",
    "Maison Francis Kurkdjian": "میسون فرانسیس کرکجان",
    Hermes: "هرمس",
    "Escentric Molecules": "اسنتریک",
    Cartier: "کارتیر",
    "Clive Christian": "کلایو کریستین",
    "Penhaligon's": "پنهالیگونز",
    Escada: "اسکادا",
    "Issey Miyake": "اسی میاکه",
    Kenzo: "کنزو",
    "Jennifer Lopez": "جنیفرلوپز",
    Davidoff: "دیویدوف",
    Amouage: "آمواج",
    "Ex Nihilo": "ای ایکس نیهیلو",
    "Memo Paris": "ممو پاریس",
    "By Kilian": "بای کیلیان",
    DSquared2: "دسکوارد",
    "Boadicea the Victorious": "بودیسیا",
    Rochas: "روشاز",
    "Thierry Mugler": "تیری موگله",
    "Initio Parfums Prives": "اینیشیو پارفومز پرایوز",
    "Tiziana Terenzi": "تیزیاناترنزی",
    Affective: "الفکتیو",
    "Orto Parisi": "اورتوپاریسی",
    "Louis Vuitton": "لویی ویتون",
    "Tom Ford": "تام فورد",
    "Jean Paul Gaultier": "ژان پل گوتیه",
    Atkinson: "اتکینسون",
    "Captain Black": "کاپتان بلک",
    Versace: "ورساچه",
    Burberry: "باربری",
    Nautica: "ناتیکا",
    "Le Labo": "له لابو",
    "Marc Anthony": "مارک آنتونی",
    Rihanna: "ریحانا",
    Kayali: "کایالی",
    // Additional mappings for common variations
    Amouage: "آموآژ",
    "Paco Rabanne": "پاکو رابان",
    Armani: "آرمانی",
    Prada: "پرادا",
  };

  const brandMap = {};
  const collectionMap = {};

  // 1. Brands - all brands in brands.json are now in Persian
  console.log(`\n📦 Processing ${brands.length} brands...`);
  for (const b of brands) {
    const brandName = b.name?.trim();
    if (!brandName) continue;

    let existing = await getData("brands", "name", brandName);
    if (existing?.data?.length) {
      console.log(`⚠️  Brand "${brandName}" already exists, skipping`);
      brandMap[brandName] = existing.data[0].id;
    } else {
      const created = await postData("brands", { name: brandName });
      if (created?.data) {
        console.log(`✅ Created brand: ${brandName}`);
        brandMap[brandName] = created.data.id;
      } else {
        console.error(`❌ Failed to create brand: ${brandName}`);
      }
    }
  }

  // 2. Collections - can be in English or Persian
  console.log(`\n📦 Processing ${collections.length} collections...`);
  for (const c of collections) {
    const collectionName = c.name?.trim();
    if (!collectionName) continue;

    let existing = await getData("collections", "name", collectionName);
    if (existing?.data?.length) {
      console.log(
        `⚠️  Collection "${collectionName}" already exists, skipping`
      );
      collectionMap[collectionName] = existing.data[0].id;
    } else {
      const created = await postData("collections", { name: collectionName });
      if (created?.data) {
        console.log(`✅ Created collection: ${collectionName}`);
        collectionMap[collectionName] = created.data.id;
      } else {
        console.error(`❌ Failed to create collection: ${collectionName}`);
      }
    }
  }

  // Build a set of valid brand names for quick lookup
  const validBrandNames = new Set(
    brands.map((b) => b.name?.trim()).filter(Boolean)
  );

  // Helper function to check if a name is actually a note (not a brand)
  function isNote(name) {
    if (!name || typeof name !== "string") return false;
    const trimmed = name.trim();

    // Check if it exists in note translations (it's a note)
    if (noteTranslations.hasOwnProperty(trimmed)) {
      return true;
    }

    // Check if it's a valid brand name
    if (validBrandNames.has(trimmed)) {
      return false;
    }

    // Check common note patterns (single words that are typically notes)
    const commonNoteWords = [
      "لیمو",
      "رز",
      "یاس",
      "وانیل",
      "مشک",
      "سدر",
      "چوب",
      "گل",
      "برگ",
      "شکوفه",
      "دانه",
      "نعناع",
      "فلفل",
      "دارچین",
      "زعفران",
      "هل",
      "جوز",
      "میخک",
      "گشنیز",
      "زنجبیل",
      "زیره",
      "ادویه",
      "عسل",
      "شکلات",
      "کاکائو",
      "لوبیا",
      "کومارین",
      "شکر",
      "قند",
      "پشمک",
      "تافی",
      "خامه",
      "شیر",
      "بادام",
      "فندق",
      "گردو",
      "ریحان",
      "مریم",
      "رزماری",
      "آویشن",
      "ترخون",
      "پونه",
      "چای",
      "ترکیبات",
      "علف",
      "نمونه",
      "کهربا",
      "عنبر",
      "لابدانیوم",
      "لابدانوم",
      "بنزوئین",
      "صمغ",
      "کندر",
      "رزین",
      "گالبانوم",
      "المی",
      "اولیبانوم",
      "نت",
      "روایح",
      "پودر",
      "خس",
      "وتیور",
      "خزه",
      "آمبروکسان",
      "آمبرت",
      "کشمران",
      "آکورد",
      "آمبرگریس",
      "اپوپوناکس",
      "آب",
      "جلبک",
      "نمک",
      "ماسه",
      "چرم",
      "جیر",
      "زباد",
      "تنباکو",
      "دود",
      "پاپیروس",
      "اسطوخودوس",
      "اکالیپتوس",
      "پچولی",
      "عود",
      "عثمانتوس",
      "اسمنتوس",
      "بخور",
      "سنبل",
      "به",
      "بهار",
      "نرولی",
      "آلدهید",
      "پتی",
      "پیچ",
      "گاردنیا",
      "مگنولیا",
      "لاله",
      "نیلوفر",
      "نی",
      "سرو",
      "پالو",
      "سالویا",
      "بابونه",
      "زالزالک",
      "درمنه",
      "شاهبوی",
      "ریشه",
      "گلسنگ",
      "درخت",
      "بلوط",
      "غلات",
      "جیران",
      "پارادیسون",
      "متیل",
      "ترکیب",
      "آمیل",
      "پتالیا",
      "نیمفیل",
      "ماهونیا",
      "داوانا",
      "ناگارموتا",
      "روغن",
      "آکیگالا",
      "تولو",
      "بلسان",
      "فیبر",
      "بوته",
      "میستیکال",
      "ماندارین",
      "گریپ فروت",
      "پرتقال",
      "آناناس",
      "توت",
      "سیب",
      "گلابی",
      "هلو",
      "انار",
      "انجیر",
      "آلبالو",
      "گیلاس",
      "تمشک",
      "توت فرنگی",
      "توت سیاه",
      "خربزه",
      "نارگیل",
      "مانگا",
      "یوزو",
      "بالنگ",
      "ترنج",
      "برگاموت",
      "شکوفه پرتقال",
      "زنبق",
      "ارکیده",
      "فریزیا",
      "پونی",
      "گل صد تومانی",
      "گل مریم",
      "گل یاس",
      "گل یاسمن",
      "گل رز",
      "بنفشه",
      "سوسن",
      "نرگس",
      "شمعدانی",
      "گل ساعت",
      "لاله مردابی",
      "نیلوفر آبی",
      "مگنولیا",
      "خس خس",
      "کشمش",
      "جوز هندی",
      "زعفران",
      "زنجبیل",
      "هل",
      "دارچین",
      "فلفل سیاه",
      "فلفل صورتی",
      "فلفل قرمز",
      "میخک",
      "گشنیز",
      "زیره",
      "رازیانه",
      "ترخون",
      "پونه کوهی",
      "ریحان",
      "مریم گلی",
      "سالویا",
      "رزماری",
      "آویشن",
      "نعناع",
      "نعناع فلفلی",
      "نعناع هندی",
      "پچولی",
      "چوب صندل",
      "چوب بلسان",
      "چوب گایاک",
      "چوب ماهون",
      "چوب کشمیر",
      "چوب عنبر",
      "سدر",
      "سرو",
      "صنوبر",
      "درخت کاج",
      "درخت نراد",
      "خزه درخت بلوط",
      "خس خس",
      "وتیور",
      "گلسنگ",
      "پاپیروس",
      "پالو سانتو",
      "کهربا",
      "عنبر",
      "لابدانیوم",
      "لابدانوم",
      "بنزوئین",
      "صمغ کندر",
      "کندر",
      "رزین",
      "گالبانوم",
      "المی",
      "اولیبانوم",
      "بخور",
      "بخورخوشبو",
      "مشک",
      "کشمران",
      "آمبروکسان",
      "آمبرت",
      "آکورد",
      "آمبرگریس",
      "اپوپوناکس",
      "آمیل سالیسیلات",
      "متیل دی‌هیدروجاسمونات",
      "پارادیسون",
      "ایزو ای سوپر",
      "ترکیب ایزو ای سوپر",
      "ترکیب شیمیایی هدیون",
      "وانیل",
      "کارامل",
      "شکلات",
      "کاکائو",
      "عسل",
      "شکر",
      "قند",
      "پشمک",
      "تافی",
      "خامه",
      "شیر",
      "بادام",
      "فندق",
      "گردو",
      "پشمک",
      "پرالین",
      "لوبیای تونکا",
      "دانه تونکا",
      "لوبیا تونکا",
      "کومارین",
      "شیرین بیان",
      "چای",
      "قهوه",
      "کنیاک",
      "ویسکی",
      "رام",
      "شامپاین",
      "آب",
      "آب دریا",
      "جلبک دریایی",
      "نمک",
      "ماسه دریا",
      "چرم",
      "جیر",
      "زباد",
      "تنباکو",
      "دود",
      "باروت",
      "صفحه گرامافون",
      "لاستیک",
      "فیبر بیدستران",
    ];

    // Check if it's a single word that matches a common note
    if (commonNoteWords.includes(trimmed)) {
      return true;
    }

    // Check if it starts with common note prefixes
    const notePrefixes = [
      "گل ",
      "برگ ",
      "شکوفه ",
      "دانه ",
      "ریشه ",
      "چوب ",
      "نت ",
      "روایح ",
    ];
    if (notePrefixes.some((prefix) => trimmed.startsWith(prefix))) {
      return true;
    }

    return false;
  }

  // 3. Perfumes
  console.log(`\n📦 Processing ${perfumes.length} perfumes...`);
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let invalidBrands = 0;
  let invalidCollections = 0;

  for (const p of perfumes) {
    // Check if perfume already exists
    let existing = await getData("perfumes", "name_en", p.name_en);
    if (existing?.data?.length) {
      console.log(`⚠️  Perfume "${p.name_en}" already exists, skipping`);
      skipped++;
      continue;
    }

    // Convert English brand name to Persian if needed
    // perfumes.json may have English or Persian brand names
    let brandName = p.brand?.trim();

    // Validate brand name - check if it's actually a note
    if (brandName) {
      if (englishToPersianBrand[brandName]) {
        brandName = englishToPersianBrand[brandName];
      }

      // Check if the brand is actually a note
      if (isNote(brandName)) {
        console.log(
          `⚠️  Brand "${brandName}" for perfume "${p.name_en}" is actually a note, setting to null`
        );
        brandName = null;
        invalidBrands++;
      } else if (!validBrandNames.has(brandName)) {
        // Brand not found in valid brands list
        console.log(
          `⚠️  Brand "${brandName}" not found in valid brands for perfume "${p.name_en}", setting to null`
        );
        brandName = null;
        invalidBrands++;
      }
    }

    // Get collection name (can be English or Persian)
    let collectionName = p.collection?.trim() || null;

    // Validate collection name - check if it's actually a note
    if (collectionName && isNote(collectionName)) {
      console.log(
        `⚠️  Collection "${collectionName}" for perfume "${p.name_en}" is actually a note, setting to null`
      );
      collectionName = null;
      invalidCollections++;
    } else if (
      collectionName &&
      !collectionMap[collectionName] &&
      !collectionName.match(/^[A-Za-z\s&'-]+$/)
    ) {
      // Collection not found and doesn't look like an English collection name
      // (English collection names like "Casamorati", "Allure Homme" are valid)
      const isEnglishCollection = collectionName.match(/^[A-Za-z\s&'-]+$/);
      if (!isEnglishCollection) {
        console.log(
          `⚠️  Collection "${collectionName}" not found for perfume "${p.name_en}", setting to null`
        );
        collectionName = null;
        invalidCollections++;
      }
    }

    // Final brand validation - ensure it exists in brandMap
    if (brandName && !brandMap[brandName]) {
      console.log(
        `⚠️  Brand "${brandName}" not found in database for perfume "${p.name_en}", setting to null`
      );
      brandName = null;
      invalidBrands++;
    }

    // Final collection validation - ensure it exists in collectionMap (or is a valid English name)
    if (collectionName && !collectionMap[collectionName]) {
      // Allow English collection names even if not in collectionMap (they might be created separately)
      const isEnglishCollection = collectionName.match(/^[A-Za-z\s&'-]+$/);
      if (!isEnglishCollection) {
        console.log(
          `⚠️  Collection "${collectionName}" not found in database for perfume "${p.name_en}", setting to null`
        );
        collectionName = null;
        invalidCollections++;
      }
    }

    // Translate notes from Persian to English
    const translatedNotes = translateNotes(p.notes);

    const data = {
      name_en: p.name_en,
      name_fa: p.name_fa,
      gender: p.gender, // ⚠️ send exactly as in JSON (make sure it matches enum in Strapi)
      season: p.season,
      family: p.family,
      character: p.character,
      notes: translatedNotes, // Notes are now in English
      brand: brandName ? brandMap[brandName] || null : null,
      collection: collectionName ? collectionMap[collectionName] || null : null,
    };

    const result = await postData("perfumes", data);
    if (result?.data) {
      const noteCount =
        (translatedNotes.top?.length || 0) +
        (translatedNotes.middle?.length || 0) +
        (translatedNotes.base?.length || 0);
      console.log(
        `✨ Imported perfume: ${p.name_en} (brand: ${p.brand} -> ${brandName || "N/A"}, notes: ${noteCount} translated to English)`
      );
      imported++;
    } else {
      console.error(`❌ Failed to import perfume: ${p.name_en}`);
      errors++;
    }
  }

  console.log(`\n🎉 Import finished!`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   🔍 Invalid brands detected (set to null): ${invalidBrands}`);
  console.log(
    `   🔍 Invalid collections detected (set to null): ${invalidCollections}`
  );
}

main();
