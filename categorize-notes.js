const fs = require("fs");
const path = require("path");

// Read translated notes
const translatedPath = path.join(__dirname, "learned-notes-translated.json");
const translatedData = JSON.parse(fs.readFileSync(translatedPath, "utf-8"));

console.log("📖 Categorizing notes into 8 categories...");

// Category keyword mappings (based on existing kiosk-options.ts)
// Expanded with more comprehensive keyword lists
const categoryKeywords = {
  citrus: [
    "bergamot",
    "lemon",
    "orange",
    "grapefruit",
    "lime",
    "citrus",
    "mandarin",
    "blood orange",
    "tangerine",
    "neroli",
    "petitgrain",
    "orange blossom",
    "bitter orange",
    "yuzu",
    "kumquat",
    "calamansi",
    "citron",
    "tart",
    "lemon blossom",
    "orange tree leaf",
    "mandarin orange",
  ],
  floral: [
    "rose",
    "jasmine",
    "tuberose",
    "violet",
    "peony",
    "lily",
    "iris",
    "lily of the valley",
    "orchid",
    "gardenia",
    "magnolia",
    "freesia",
    "honeysuckle",
    "osmanthus",
    "ylang ylang",
    "ylang",
    "carnation",
    "hyacinth",
    "narcissus",
    "water lily",
    "lotus",
    "lilac",
    "geranium",
    "mimosa",
    "snow flower",
    "passion flower",
    "silk flower",
    "sunflower",
    "marshmallow",
    "sweet pea",
    "damask rose",
    "bulgarian rose",
    "blossom",
    "flower",
    "petal",
    "bouquet",
    "jasmine grandiflorum",
  ],
  woody: [
    "cedar",
    "sandalwood",
    "vetiver",
    "oak",
    "oud",
    "wood",
    "guaiac",
    "birch",
    "pine",
    "cypress",
    "juniper",
    "ebony",
    "cashmere wood",
    "amber wood",
    "dry wood",
    "white sandalwood",
    "virginia cedar",
    "atlas cedar",
    "fir",
    "poplar",
    "akigalawood",
    "rosewood",
    "balsam",
    "oakmoss",
    "lichen",
    "moss",
    "mahogany",
    "guaiac wood",
    "tree",
  ],
  spicy: [
    "pepper",
    "cinnamon",
    "cardamom",
    "clove",
    "nutmeg",
    "spice",
    "saffron",
    "ginger",
    "coriander",
    "cumin",
    "thyme",
    "oregano",
    "black pepper",
    "pink pepper",
    "red pepper",
    "sichuan pepper",
    "nutmeg seed",
    "clove spice",
    "hot pepper",
    "sweet red pepper",
    "aromatic spices",
    "turmeric",
    "fennel",
  ],
  sweet: [
    "vanilla",
    "caramel",
    "tonka",
    "honey",
    "chocolate",
    "praline",
    "sugar",
    "cotton candy",
    "toffee",
    "cream",
    "milk",
    "almond",
    "hazelnut",
    "walnut",
    "licorice",
    "coumarin",
    "frankincense",
    "cacao",
    "cacao pod",
    "tonka bean",
    "burnt almond",
    "bitter almond",
    "dried fruits",
    "raisin",
    "rum",
    "cognac",
    "champagne",
    "caviar",
    "vanilla caviar",
  ],
  green: [
    "mint",
    "herb",
    "tea",
    "basil",
    "sage",
    "green",
    "rosemary",
    "thyme",
    "tarragon",
    "oregano",
    "clary sage",
    "grass",
    "fig leaf",
    "violet leaf",
    "sweet violet leaf",
    "green tea",
    "green notes",
    "moss",
    "lichen",
    "eucalyptus",
    "fennel",
    "green cumin",
    "clary sage",
  ],
  oriental: [
    "amber",
    "incense",
    "resin",
    "labdanum",
    "benzoin",
    "oriental",
    "frankincense",
    "myrrh",
    "galbanum",
    "elemi",
    "olibanum",
    "opoponax",
    "amber resin",
    "labdanum resin",
    "oriental notes",
    "liquid amber",
    "plant resin",
    "indian frankincense",
    "galbanum resin",
    "peruvian balsam",
    "colombian balsam",
    "sweet incense",
  ],
  musky: [
    "musk",
    "powder",
    "iris",
    "heliotrope",
    "cashmere",
    "vetiver",
    "oakmoss",
    "ambroxan",
    "ambrette",
    "cashmeran",
    "cashmere accord",
    "white musk",
    "musk mallow",
    "ambergris",
    "powdery",
    "moss",
    "orris root",
  ],
};

// Additional fruit keywords (can be categorized as citrus or sweet depending on context)
const fruitKeywords = [
  "apple",
  "pear",
  "peach",
  "plum",
  "cherry",
  "strawberry",
  "raspberry",
  "blackberry",
  "pomegranate",
  "fig",
  "pineapple",
  "mango",
  "coconut",
  "melon",
  "quince",
  "rhubarb",
  "red berry",
  "passion fruit",
  "yuzu",
];

// Helper function to check if a note matches category keywords
function categorizeNote(englishNote) {
  if (!englishNote || typeof englishNote !== "string") {
    return { category: null, confidence: 0 };
  }

  const lowerNote = englishNote.toLowerCase().trim();
  const matches = {};

  // Check each category with improved matching
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let matchCount = 0;
    let exactMatch = false;

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      // Exact match gets higher weight
      if (lowerNote === lowerKeyword) {
        exactMatch = true;
        matchCount += 3;
      } else if (
        lowerNote.includes(lowerKeyword) ||
        lowerKeyword.includes(lowerNote)
      ) {
        matchCount += 1;
      }
    }

    if (matchCount > 0) {
      // Normalize by category size, but boost exact matches
      const baseScore = matchCount / keywords.length;
      const exactBonus = exactMatch ? 0.3 : 0;
      matches[category] = baseScore + exactBonus;
    }
  }

  // Special handling for fruits - categorize based on context
  const isFruit = fruitKeywords.some(
    (fruit) =>
      lowerNote.includes(fruit.toLowerCase()) ||
      fruit.toLowerCase().includes(lowerNote)
  );

  if (isFruit) {
    // Fruits can be citrus (if tart/citrusy) or sweet (if sweet)
    if (
      lowerNote.includes("tart") ||
      lowerNote.includes("citrus") ||
      lowerNote.includes("lemon") ||
      lowerNote.includes("orange") ||
      lowerNote.includes("grapefruit") ||
      lowerNote.includes("lime")
    ) {
      matches.citrus = (matches.citrus || 0) + 0.2;
    } else {
      matches.sweet = (matches.sweet || 0) + 0.2;
    }
  }

  if (Object.keys(matches).length === 0) {
    return { category: null, confidence: 0 };
  }

  // Find best match
  const bestCategory = Object.entries(matches).reduce((a, b) =>
    matches[a[0]] > matches[b[0]] ? a : b
  );

  // Only assign category if confidence is above threshold
  const confidence = Math.min(1, bestCategory[1] * 5); // Adjusted scaling
  const category = confidence > 0.3 ? bestCategory[0] : null;

  return {
    category: category,
    confidence: confidence,
    allMatches: matches,
  };
}

// Categorize all notes
const categorizedNotes = translatedData.notes.map((note) => {
  const categorization = categorizeNote(note.english);
  return {
    ...note,
    category: categorization.category,
    confidence: categorization.confidence,
    allMatches: categorization.allMatches,
    // Preserve brand information
    brands: note.brands || [],
    brandCounts: note.brandCounts || [],
    totalBrands: note.totalBrands || 0,
  };
});

// Count by category
const categoryCounts = {};
categorizedNotes.forEach((note) => {
  const cat = note.category || "uncategorized";
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
});

console.log(`\n✅ Categorization complete!`);
console.log(`\n📊 Notes by category:`);
Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

// Group by category for easy lookup
const notesByCategory = {};
categorizedNotes.forEach((note) => {
  const cat = note.category || "uncategorized";
  if (!notesByCategory[cat]) {
    notesByCategory[cat] = [];
  }
  notesByCategory[cat].push({
    persian: note.persian,
    english: note.english,
    isTranslated: note.isTranslated,
    stats: note.stats,
    confidence: note.confidence,
    brands: note.brands || [],
    brandCounts: note.brandCounts || [],
    totalBrands: note.totalBrands || 0,
  });
});

// Save categorized notes
const outputPath = path.join(__dirname, "learned-notes-categorized.json");
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      totalNotes: categorizedNotes.length,
      categoryCounts: categoryCounts,
      notes: categorizedNotes,
      notesByCategory: notesByCategory,
      // Create keyword arrays for each category (for algorithm use)
      categoryKeywords: Object.fromEntries(
        Object.keys(categoryKeywords).map((cat) => [
          cat,
          notesByCategory[cat] ?
            notesByCategory[cat]
              .filter((n) => n.isTranslated && n.english)
              .map((n) => n.english.toLowerCase())
              .filter((v, i, a) => a.indexOf(v) === i) // Unique
          : [],
        ])
      ),
    },
    null,
    2
  ),
  "utf-8"
);

console.log(`💾 Saved categorized notes to: ${outputPath}`);

// Show sample categorizations
console.log(`\n📋 Sample categorizations (first 15):`);
categorizedNotes.slice(0, 15).forEach((note, i) => {
  const cat = note.category || "❓ uncategorized";
  const conf =
    note.confidence > 0 ? `(${Math.round(note.confidence * 100)}%)` : "";
  console.log(`  ${i + 1}. ${cat} ${conf}: ${note.english || note.persian}`);
});

// Show uncategorized notes
const uncategorized = categorizedNotes.filter((n) => !n.category);
if (uncategorized.length > 0) {
  console.log(`\n⚠️  Un categorized notes (${uncategorized.length}):`);
  uncategorized.slice(0, 10).forEach((note, i) => {
    console.log(`  ${i + 1}. ${note.english || note.persian}`);
  });
}
