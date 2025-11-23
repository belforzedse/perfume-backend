const fs = require("fs");
const path = require("path");

// Read the extracted notes
const rawNotesPath = path.join(__dirname, "learned-notes-raw.json");
const rawData = JSON.parse(fs.readFileSync(rawNotesPath, "utf-8"));

console.log("📖 Reading extracted notes from CSV...");
console.log(`Found ${rawData.notesWithLayers.length} unique notes`);

// Comprehensive Persian to English translation mapping
// Only including notes that we know exist in the CSV
const translationMap = {};

// Helper function to normalize Persian text (remove extra spaces, handle variations)
function normalizePersian(text) {
  return text.trim().replace(/\s+/g, " ");
}

// Build translation mapping for all notes found in CSV
rawData.notesWithLayers.forEach((item) => {
  const persianNote = normalizePersian(item.note);

  // Skip if already translated
  if (translationMap[persianNote]) return;

  // Common translations based on actual perfume note terminology
  // This is a comprehensive mapping for the notes we found
  const translations = {
    // Citrus & Fruits
    ترنج: "bergamot",
    برگاموت: "bergamot",
    برغموت: "bergamot",
    لیمو: "lemon",
    "لیمو ترش": "lemon",
    "لیمو شيرازي": "lime",
    پرتقال: "orange",
    "پرتقال خونی": "blood orange",
    "پرتقال خوني": "blood orange",
    "پرتقال ماندارین": "mandarin orange",
    نارنگی: "mandarin",
    "نارنگی ماندارین": "mandarin orange",
    "گریپ فروت": "grapefruit",
    آناناس: "pineapple",
    سیب: "apple",
    گلابی: "pear",
    هلو: "peach",
    آلو: "plum",
    تمشک: "raspberry",
    "انگور فرنگی": "currant",
    "انگور فرنگی سیاه": "black currant",
    "انگور فرنگی سرخ": "red currant",
    "توت فرنگی": "strawberry",
    "توت سیاه": "blackberry",
    انار: "pomegranate",
    آلبالو: "cherry",
    انجیر: "fig",
    "برگ انجیر": "fig leaf",
    میوه‌جات: "fruits",
    "میوه جات": "fruits",

    // Floral
    رز: "rose",
    "گل رز": "rose",
    "رز بلغاری": "bulgarian rose",
    "گل سرخ بلغاري": "bulgarian rose",
    یاس: "jasmine",
    یاسمن: "jasmine",
    "یاسمن بزرگ گيا": "jasmine grandiflorum",
    "یاسمن تاهيتي": "tahitian jasmine",
    "یاس سامباک": "jasmine sambac",
    "یلانگ یلانگ": "ylang ylang",
    یلانگ: "ylang",
    بنفشه: "violet",
    "برگ بنفشه": "violet leaf",
    "برگ بنفشه شيرين": "sweet violet leaf",
    "بنفشه شيرين": "sweet violet",
    زنبق: "iris",
    "زنبق دره": "lily of the valley",
    "زنبق دره‌ای": "lily of the valley",
    سوسن: "lily",
    "سوسن دره ای": "lily of the valley",
    "سوسن آبی": "water lily",
    "گل صدتومانی": "peony",
    "گل صد تومانی": "peony",
    صدتومان: "peony",
    ارکیده: "orchid",
    "گل ارکیده": "orchid",
    "گل برف": "snow flower",
    "موگه (گل برف)": "lily of the valley",
    "گل مریم": "tuberose",
    "مریم گلی": "tuberose",
    شمعدانی: "geranium",
    "گل شمعدانی": "geranium",
    فریزیا: "freesia",
    "گل فریسیا": "freesia",
    "گل یاس": "jasmine",
    "گل یاسمن": "jasmine",
    "گل نرگس": "narcissus",
    نرگس: "narcissus",
    "گل محمدی": "damask rose",
    "گل ابریشم": "silk flower",
    "گل آفتاب پرست": "sunflower",
    "گل ساعت": "passion flower",
    "میوه گل ساعت": "passion fruit",
    "گل خطمی": "marshmallow",
    "گل ختمی": "marshmallow",
    "گل نخود": "sweet pea",
    "گل اوسمانتوس": "osmanthus",
    "گل اوسمانتوس چینی": "chinese osmanthus",
    "گل تیاره": "tiare flower",
    "گل‌های معطر": "aromatic flowers",
    "گل‌های گلی": "floral notes",

    // Woody
    سدر: "cedar",
    "سدر ويرجينيا": "virginia cedar",
    "سدر ویرجینیا": "virginia cedar",
    "سدر اطلس": "atlas cedar",
    "چوب صندل": "sandalwood",
    "چوب صندل سفید": "white sandalwood",
    صندل: "sandalwood",
    "چوب گوایاک": "guaiac wood",
    "چوب گاياک": "guaiac wood",
    "گوایاک وود": "guaiac wood",
    "چوب خشک": "dry wood",
    "چوب‌های خشک": "dry woods",
    "چوب‌های سفید": "white woods",
    "چوب عنبر": "amber wood",
    "چوب کشمیر": "cashmere wood",
    "چوب کشمیرد": "cashmere wood",
    "چوب بلسان بنفش برزيلي": "brazilian rosewood",
    "چوب آبنوس": "ebony",
    "چوب تبریزی": "poplar wood",
    "چوب آکیگالاو": "akigalawood",
    آکیگالاوود: "akigalawood",
    "درخت توس": "birch",
    توس: "birch",
    "درخت نراد": "fir",
    "درخت کاج": "pine",
    "درخت سدر": "cedar",
    "درخت خس خس": "vetiver",
    "درخت پچولی": "patchouli",
    "درخت نارنج": "orange tree",
    "برگ درخت نارنج": "orange tree leaf",
    "روایح چوبی": "woody notes",
    "نت‌های چوبی": "woody notes",
    چوب: "wood",

    // Spicy
    دارچین: "cinnamon",
    فلفل: "pepper",
    "فلفل سیاه": "black pepper",
    "فلفل صورتی": "pink pepper",
    "فلفل قرمز": "red pepper",
    "فلفل سیچوان": "sichuan pepper",
    زعفران: "saffron",
    هل: "cardamom",
    "هل سبز": "green cardamom",
    جوز: "nutmeg",
    "جوز هندی": "nutmeg",
    "دانه جوز هندي": "nutmeg seed",
    میخک: "clove",
    "گل میخک": "clove",
    "ادویه گل میخک": "clove spice",
    گشنیز: "coriander",
    زنجبیل: "ginger",
    زیره: "cumin",
    "زیره سبز": "green cumin",
    "ادویه جات": "spices",
    "ادویه جات معطر": "aromatic spices",
    "ادویه‌جات معطر": "aromatic spices",

    // Sweet & Gourmand
    وانیل: "vanilla",
    وانيل: "vanilla",
    "وانیل بوربون": "bourbon vanilla",
    "وانیل ماداگاسکار": "madagascar vanilla",
    کارامل: "caramel",
    عسل: "honey",
    "شهد عسل": "honey nectar",
    "عسل سفيد": "white honey",
    شکلات: "chocolate",
    کاکائو: "cacao",
    "غلاف کاکائو": "cacao pod",
    "لوبیا تونکا": "tonka bean",
    "لوبيا تونکا": "tonka bean",
    "دانه تونکا": "tonka bean",
    لوبان: "frankincense",
    لوبان: "frankincense",
    پرالین: "praline",
    "شیرین بیان": "licorice",
    "شيرين بيان": "licorice",
    کومارین: "coumarin",
    کومارين: "coumarin",
    شکر: "sugar",
    قند: "sugar",
    پشمک: "cotton candy",
    تافی: "toffee",
    خامه: "cream",
    شیر: "milk",
    بادام: "almond",
    "بادام تلخ": "bitter almond",
    "بادام سوخته": "burnt almond",
    فندق: "hazelnut",
    "گردوی خوارزمی": "walnut",

    // Green & Herbal
    نعناع: "mint",
    نعنا: "mint",
    "نعناع هندی": "patchouli",
    "نعنا هندي": "patchouli",
    "نعناع فلفلی": "peppermint",
    ریحان: "basil",
    "مریم گلی": "sage",
    مریمیه: "sage",
    رزماری: "rosemary",
    آویشن: "thyme",
    ترخون: "tarragon",
    "پونه کوهی": "oregano",
    چای: "tea",
    "چای سبز": "green tea",
    "ترکیبات سبز": "green notes",
    "نت‌های سبز": "green notes",
    علف: "grass",
    "نمونه‌های سبز": "green notes",
    "نمونه هاي سبز": "green notes",

    // Oriental & Resins
    کهربا: "amber",
    عنبر: "amber",
    "عنبر کهربایی": "amber",
    "عنبر سائل": "liquid amber",
    لابدانیوم: "labdanum",
    لابدانوم: "labdanum",
    بنزوئین: "benzoin",
    بنزوئين: "benzoin",
    "صمغ کندر": "frankincense",
    کندر: "frankincense",
    "صمغ درختچه مر": "myrrh",
    "صمغ گیاهی": "plant resin",
    رزین: "resin",
    "رزین لبدانیوم": "labdanum resin",
    "رزین کندر هندی": "indian frankincense",
    "رزین باریجه": "galbanum resin",
    گالبانوم: "galbanum",
    المی: "elemi",
    اولیبانوم: "olibanum",
    "نت‌های شرقی": "oriental notes",
    "روایح شرقی": "oriental notes",

    // Musky & Powdery
    مشک: "musk",
    "مشک سفید": "white musk",
    "مشک مالو": "musk mallow",
    "گیاه مشک مالو": "musk mallow plant",
    پودر: "powder",
    پودری: "powdery",
    "خس خس": "vetiver",
    وتیور: "vetiver",
    "وتیور هائیتی": "haitian vetiver",
    خزه: "moss",
    "خزه درخت بلوط": "oakmoss",
    "خزه بلوط": "oakmoss",
    آمبروکسان: "ambroxan",
    آمبروکسان: "ambroxan",
    آمبروفیکس: "ambroxan",
    آمبرت: "ambrette",
    کشمران: "cashmeran",
    کشمیران: "cashmeran",
    "آکورد کشمیر": "cashmere accord",

    // Aquatic & Fresh
    آب: "water",
    "آب دریا": "sea water",
    "نت‌های دریایی": "marine notes",
    "نت های دریایی": "marine notes",
    "جلبک دریایی": "seaweed",
    "نمک دریایی": "sea salt",
    "ماسه دریا": "sea sand",

    // Leather & Animalic
    چرم: "leather",
    جیر: "suede",
    "نت‌های حیوانات": "animalic notes",
    "نت‌های حیوانی": "animalic notes",
    زباد: "civet",

    // Tobacco & Smoky
    تنباکو: "tobacco",
    "برگ توتون": "tobacco leaf",
    "برگ تنباکو": "tobacco leaf",
    "شکوفه تنباکو": "tobacco blossom",
    دود: "smoke",
    "نت‌های دودی": "smoky notes",
    "روایح دودی": "smoky notes",
    پاپیروس: "papyrus",
    پاپيروس: "papyrus",

    // Other
    اسطوخودوس: "lavender",
    اسطوخدوس: "lavender",
    "اسطو خودوس": "lavender",
    "اسطوخودوس فرانسوی": "french lavender",
    "اسطوخودوس عادی": "lavender",
    اکالیپتوس: "eucalyptus",
    اوکاليپتوس: "eucalyptus",
    پچولی: "patchouli",
    پاتچولی: "patchouli",
    "گیاه پاتچولی": "patchouli plant",
    عود: "oud",
    عثمانتوس: "osmanthus",
    اسمنتوس: "osmanthus",
    اسمانتوس: "osmanthus",
    بخور: "incense",
    بخورخوشبو: "sweet incense",
    سنبل: "hyacinth",
    به: "quince",
    "بهار نارنج": "neroli",
    بهارنارنج: "neroli",
    نرولی: "neroli",
    "شکوفه پرتقال": "orange blossom",
    "شکوفه پرتقال آفریقایی": "african orange blossom",
    "شکوفه پرتقال تونس": "tunisian orange blossom",
    "شکوفه بادام": "almond blossom",
    "شکوفه شلیل": "nectarine blossom",
    "شکوفه لیمو": "lemon blossom",
    "شکوفه هلو": "peach blossom",
    آلدهید: "aldehydes",
    آلدئید: "aldehydes",
    "پتی دانه": "petitgrain",
    "پیچ امین الدوله": "honeysuckle",
    "پيچ امين الدوله": "honeysuckle",
    "پیچ عسلی": "honeysuckle",
    گاردنیا: "gardenia",
    "گاردنیای یاسمنی": "gardenia jasmine",
    مگنولیا: "magnolia",
    ماگنولیا: "magnolia",
    "لاله مردابی": "water lily",
    نیلوفر: "lotus",
    "نیلوفر آبی": "water lily",
    "نیلوفر رنگون": "rangoon creeper",
    نی: "reed",
    سرو: "cypress",
    "سرو کوهی": "juniper",
    "دانه سرو کوهی": "juniper berry",
    "سرو ایتالیایی": "italian cypress",
    "سرو سفید": "white cypress",
    "درخت سرو": "cypress",
    "پالو سانتو": "palo santo",
    پالوسانتو: "palo santo",
    سالویا: "sage",
    "سالویا اسکلاریا": "clary sage",
    "گل گاو زبان": "borage",
    بابونه: "chamomile",
    زالزالک: "hawthorn",
    درمنه: "wormwood",
    شاهبوی: "basil",
    "ریشه زنبق": "orris root",
    "ریشه زنبق زرد": "yellow iris root",
    گلسنگ: "lichen",
    "خزه درخت بلوط": "oakmoss",
    "درخت بلوط": "oak",
    بلوط: "oak",
    "غلات هندی": "indian grains",
    جیران: "geranium",
    پارادیسون: "paradisone",
    "متیل دی‌هیدروجاسمونات": "methyl dihydrojasmonate",
    "ترکیب ایزو ای سوپر": "iso e super",
    "ترکیب شیمیایی هدیون": "hedione",
    "آمیل سالیسیلات": "amyl salicylate",
    پتالیا: "petalia",
    نیمفیل: "nymphaea",
    ماهونیا: "mahonia",
    داوانا: "davana",
    ماهونیال: "mahonial",
    ناگارموتا: "nagarmotha",
    "گیاه ناگارموتا": "nagarmotha plant",
    "روغن کرچک": "castor oil",
    "روغن سیپریول": "cypriol oil",
    "آکیگالا وود": "akigalawood",
    "آمبرت (مشک خیرالمخلوق)": "ambrette (musk mallow)",
    آمبرگریس: "ambergris",
    "تولو بلسا": "tolu balsam",
    "بلسان پرویی": "peruvian balsam",
    "بلسان کلمبیایی": "colombian balsam",
    "بلسان پِرويي": "peruvian balsam",
    "بلسان کلمبیایی": "colombian balsam",
    "فیبر بیدستران": "fiber bidestran",
    "بوته وحشی جاوی": "wild javanese patchouli",
    میستیکال: "mystical",
    جیر: "suede",
    پچولی: "patchouli",
    پاتچولی: "patchouli",
    "گیاه پاتچولی": "patchouli",
    "خس خس": "vetiver",
    وتیور: "vetiver",
    "وتیور هائیتی": "haitian vetiver",
    خزه: "moss",
    "خزه درخت بلوط": "oakmoss",
    "خزه بلوط": "oakmoss",
    گلسنگ: "lichen",
    مشک: "musk",
    "مشک سفید": "white musk",
    "مشک مالو": "musk mallow",
    "گیاه مشک مالو": "musk mallow plant",
    آمبروکسان: "ambroxan",
    آمبروفیکس: "ambroxan",
    کشمران: "cashmeran",
    کشمیران: "cashmeran",
    "آکورد کشمیر": "cashmere accord",
    آمبرت: "ambrette",
    آمبرگریس: "ambergris",
    اپوپوناکس: "opoponax",
    اوپوپوناکس: "opoponax",
    پچولی: "patchouli",
    پاتچولی: "patchouli",
    "گیاه پاتچولی": "patchouli",
    "خس خس": "vetiver",
    وتیور: "vetiver",
    "وتیور هائیتی": "haitian vetiver",
    خزه: "moss",
    "خزه درخت بلوط": "oakmoss",
    "خزه بلوط": "oakmoss",
    گلسنگ: "lichen",
    مشک: "musk",
    "مشک سفید": "white musk",
    "مشک مالو": "musk mallow",
    "گیاه مشک مالو": "musk mallow plant",
    آمبروکسان: "ambroxan",
    آمبروفیکس: "ambroxan",
    کشمران: "cashmeran",
    کشمیران: "cashmeran",
    "آکورد کشمیر": "cashmere accord",
    آمبرت: "ambrette",
    آمبرگریس: "ambergris",
    اپوپوناکس: "opoponax",
    اوپوپوناکس: "opoponax",
  };

  // Try to find translation
  let englishNote = translations[persianNote];

  // If not found, try case-insensitive and with variations
  if (!englishNote) {
    // Try without leading/trailing spaces
    const trimmed = persianNote.trim();
    englishNote = translations[trimmed];

    // If still not found, keep Persian as fallback (we'll handle manually)
    if (!englishNote) {
      englishNote = null; // Mark for manual translation
    }
  }

  if (englishNote) {
    translationMap[persianNote] = englishNote;
  } else {
    // Keep track of untranslated notes
    translationMap[persianNote] = null;
  }
});

// Count translated vs untranslated
const translated = Object.values(translationMap).filter(
  (v) => v !== null
).length;
const untranslated = Object.values(translationMap).filter(
  (v) => v === null
).length;

console.log(`\n✅ Translation mapping created!`);
console.log(`📊 Translated: ${translated}`);
console.log(`⚠️  Untranslated: ${untranslated}`);

// Save translation mapping
const outputPath = path.join(__dirname, "persian-to-english-notes.json");
fs.writeFileSync(outputPath, JSON.stringify(translationMap, null, 2), "utf-8");

console.log(`💾 Saved to: ${outputPath}`);

// Show untranslated notes for manual review
if (untranslated > 0) {
  console.log(`\n⚠️  Notes needing manual translation:`);
  Object.entries(translationMap)
    .filter(([_, eng]) => eng === null)
    .slice(0, 20)
    .forEach(([persian, _]) => {
      console.log(`  - ${persian}`);
    });
  if (untranslated > 20) {
    console.log(`  ... and ${untranslated - 20} more`);
  }
}



