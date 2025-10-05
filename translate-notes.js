const fs = require('fs');

// Persian translation mapping for perfume notes
const noteTranslations = {
  "Akigalawood": "آکیگالاوود",
  "Aldehydes": "آلدهید",
  "Almond": "بادام",
  "Amber": "کهربا",
  "Amberwood": "چوب کهربایی",
  "Ambrette (Musk Mallow)": "آمبرت (مشک خیرالمخلوق)",
  "Ambroxan": "آمبروکسان",
  "Apple": "سیب",
  "Basil (Shahbui)": "ریحان (شاهبوی)",
  "Bay Leaf": "برگ بو",
  "Bergamot": "برگاموت",
  "Birch": "توس",
  "Black Currant": "انگور فرنگی سیاه",
  "Black Pepper": "فلفل سیاه",
  "Blood Orange": "پرتقال خونی",
  "Brazilian Rosewood": "چوب رز برزیلی",
  "Bulgarian Rose": "رز بلغاری",
  "Cacao": "کاکائو",
  "Caramel": "کارامل",
  "Cardamom": "هل",
  "Carnation": "میخک",
  "Cashmere Accord": "آکورد کشمیر",
  "Cedar": "سدر",
  "Chamomile": "بابونه",
  "Chocolate": "شکلات",
  "Cinnamon": "دارچین",
  "Civet": "زباد",
  "Clary Sage": "مریمیه",
  "Clove": "میخک",
  "Coffee": "قهوه",
  "Coriander": "گشنیز",
  "Coumarin": "کومارین",
  "Dried Fruits": "میوه‌های خشک",
  "Dry Woods": "چوب‌های خشک",
  "Elemi": "المی",
  "Eucalyptus": "اکالیپتوس",
  "Floral Aromatics": "عطریات گلی",
  "Frankincense": "کندر",
  "Fruity Notes": "نت‌های میوه‌ای",
  "Galbanum": "گالبانوم",
  "Gardenia": "گاردنیا",
  "Geranium": "شمعدانی",
  "Ginger": "زنجبیل",
  "Grapefruit": "گریپ فروت",
  "Green Tea": "چای سبز",
  "Guaiac Wood": "چوب گوایاک",
  "Haitian Vetiver": "وتیور هائیتی",
  "Hawthorn": "زالزالک",
  "Hazelnut": "فندق",
  "Honey": "عسل",
  "Honeysuckle": "پیچ عسلی",
  "Hyacinth": "سنبل",
  "Incense": "عود",
  "Iris": "زنبق",
  "Jasmine": "یاس",
  "Jasmine Sambac": "یاس سامباک",
  "Juniper Berries": "توت ارس",
  "Key Lime": "لیمو کی",
  "Labdanum": "لابدانوم",
  "Lavender": "اسطوخودوس",
  "Leather": "چرم",
  "Lemon": "لیمو",
  "Lemon Verbena": "لیمو وربنا",
  "Licorice": "شیرین بیان",
  "Lilac": "یاس بنفش",
  "Lily of the Valley": "سوسن دره",
  "Lime": "لیمو",
  "Lotus": "نیلوفر",
  "Mandarin": "نارنگی",
  "Mandarin Orange": "نارنگی ماندارین",
  "Mimosa": "میموزا",
  "Mint": "نعنا",
  "Musk": "مشک",
  "Narcissus": "نرگس",
  "Neroli": "نرولی",
  "Nutmeg": "جوز هندی",
  "Nutmeg Flower": "گل جوز هندی",
  "Oakmoss": "خزه بلوط",
  "Olibanum": "اولیبانوم",
  "Opoponax": "اپوپوناکس",
  "Orange": "پرتقال",
  "Orange Blossom": "شکوفه پرتقال",
  "Orchid": "ارکیده",
  "Oregano": "پونه کوهی",
  "Oriental Notes": "نت‌های شرقی",
  "Orris Root": "ریشه زنبق",
  "Osmanthus": "اسمانتوس",
  "Oud": "عود",
  "Papyrus": "پاپیروس",
  "Patchouli": "پچولی",
  "Peach": "هلو",
  "Pear": "گلابی",
  "Peony": "صدتومان",
  "Pepper": "فلفل",
  "Petitgrain": "پتی‌گرن",
  "Pineapple": "آناناس",
  "Pink Pepper": "فلفل صورتی",
  "Quince": "به",
  "Red Berries": "توت‌های قرمز",
  "Rose": "رز",
  "Rosemary": "رزماری",
  "Saffron": "زعفران",
  "Sage": "مریمیه",
  "Sandalwood": "صندل",
  "Sea Notes": "نت‌های دریایی",
  "Sea Water": "آب دریا",
  "Sichuan Pepper": "فلفل سیچوان",
  "Smoky Notes": "نت‌های دودی",
  "Spices": "ادویه‌جات",
  "Spicy Notes": "نت‌های تند",
  "Suede": "جیر",
  "Sweet Violet Leaf": "برگ بنفشه شیرین",
  "Tea": "چای",
  "Tobacco": "تنباکو",
  "Tobacco Blossom": "شکوفه تنباکو",
  "Tobacco Leaf": "برگ تنباکو",
  "Tonka Bean": "لوبیا تونکا",
  "Truffle": "قارچ دنبلان",
  "Tuberose": "مریم گلی",
  "Vanilla": "وانیل",
  "Vetiver": "وتیور",
  "Violet": "بنفشه",
  "Violet Leaf": "برگ بنفشه",
  "Water Lily": "نیلوفر آبی",
  "Woody Notes": "نت‌های چوبی",
  "Ylang-Ylang": "یلانگ یلانگ"
};

// Read the perfumes.json file
console.log('Reading perfumes.json...');
const perfumes = JSON.parse(fs.readFileSync('perfumes.json', 'utf8'));

// Function to translate notes
function translateNotes(notes) {
  if (!notes) return notes;

  const translated = {};
  if (notes.top) {
    translated.top = notes.top.map(note => noteTranslations[note] || note);
  }
  if (notes.middle) {
    translated.middle = notes.middle.map(note => noteTranslations[note] || note);
  }
  if (notes.base) {
    translated.base = notes.base.map(note => noteTranslations[note] || note);
  }
  return translated;
}

// Translate all perfumes
console.log('Translating notes to Persian...');
const translatedPerfumes = perfumes.map(perfume => ({
  ...perfume,
  notes: translateNotes(perfume.notes)
}));

// Create backup of original file
console.log('Creating backup of original file...');
fs.writeFileSync('perfumes-original.json', JSON.stringify(perfumes, null, 2), 'utf8');

// Write the translated perfumes back to the file
console.log('Writing translated perfumes.json...');
fs.writeFileSync('perfumes.json', JSON.stringify(translatedPerfumes, null, 2), 'utf8');

console.log('✅ Translation complete! Notes are now in Persian.');
console.log('📁 Original file backed up as perfumes-original.json');

// Show a sample of the changes
console.log('\n📝 Sample of translated notes:');
if (translatedPerfumes[0] && translatedPerfumes[0].notes) {
  console.log('First perfume notes:');
  console.log('- Top:', translatedPerfumes[0].notes.top);
  console.log('- Middle:', translatedPerfumes[0].notes.middle);
  console.log('- Base:', translatedPerfumes[0].notes.base);
}