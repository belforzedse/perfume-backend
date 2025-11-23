const fs = require("fs");
const path = require("path");

// Read categorized notes
const categorizedPath = path.join(__dirname, "learned-notes-categorized.json");
const categorizedData = JSON.parse(fs.readFileSync(categorizedPath, "utf-8"));

console.log("📖 Generating TypeScript file with learned notes...");

// Generate TypeScript file
const tsContent = `/**
 * Learned Notes Database
 * 
 * This file contains all notes learned from the CSV file, with translations,
 * categorizations, and layer information (top/middle/base).
 * 
 * Auto-generated from: perfume-backend/learned-notes-categorized.json
 * Total notes: ${categorizedData.totalNotes}
 * Generated: ${new Date().toISOString()}
 */

export interface LearnedNote {
  persian: string;
  english: string;
  isTranslated: boolean;
  category: string | null;
  confidence: number;
  stats: {
    top: number;
    middle: number;
    base: number;
    total: number;
    topRatio: number;
    middleRatio: number;
    baseRatio: number;
    primaryLayer: "top" | "middle" | "base";
  };
  brands: string[];
  brandCounts: Array<{ brand: string; count: number }>;
  totalBrands: number;
}

export interface NotesByCategory {
  [category: string]: LearnedNote[];
}

// Learned notes data
export const learnedNotesData = ${JSON.stringify(
  {
    notes: categorizedData.notes,
    notesByCategory: categorizedData.notesByCategory,
    categoryKeywords: categorizedData.categoryKeywords,
    categoryCounts: categorizedData.categoryCounts,
  },
  null,
  2
)} as const;

// Type for readonly note data from the generated file
type ReadonlyLearnedNote = {
  readonly persian: string;
  readonly english: string;
  readonly isTranslated: boolean;
  readonly category: string | null;
  readonly confidence: number;
  readonly stats: {
    readonly top: number;
    readonly middle: number;
    readonly base: number;
    readonly total: number;
    readonly topRatio: number;
    readonly middleRatio: number;
    readonly baseRatio: number;
    readonly primaryLayer: "top" | "middle" | "base";
  };
  readonly brands: readonly string[];
  readonly brandCounts: readonly Array<{ readonly brand: string; readonly count: number }>;
  readonly totalBrands: number;
};

/**
 * Get all learned notes
 */
export function getAllLearnedNotes(): LearnedNote[] {
  // Convert readonly array to mutable array, handling nested readonly arrays
  return learnedNotesData.notes.map((note) => ({
    ...note,
    brands: [...note.brands],
    brandCounts: note.brandCounts.map((bc) => ({ ...bc })),
  })) as LearnedNote[];
}

/**
 * Get notes by category
 */
export function getNotesByCategory(category: string): LearnedNote[] {
  const notesByCategory = learnedNotesData.notesByCategory as Record<string, readonly ReadonlyLearnedNote[]>;
  const categoryData = notesByCategory[category];
  if (!categoryData) return [];
  // Convert readonly array to mutable array, handling nested readonly arrays
  return categoryData.map((note) => ({
    ...note,
    brands: [...note.brands],
    brandCounts: note.brandCounts.map((bc) => ({ ...bc })),
  })) as LearnedNote[];
}

/**
 * Get all category keywords (expanded from learned notes)
 */
export function getCategoryKeywords(): Record<string, string[]> {
  const keywords = learnedNotesData.categoryKeywords as Record<string, readonly string[]>;
  const result: Record<string, string[]> = {};
  for (const [category, values] of Object.entries(keywords)) {
    result[category] = [...values];
  }
  return result;
}

/**
 * Find a note by English name
 */
export function findNoteByEnglish(englishName: string): LearnedNote | undefined {
  const notes = getAllLearnedNotes();
  const lowerName = englishName.toLowerCase();
  return notes.find(
    (note) => note.isTranslated && note.english && (
      note.english.toLowerCase() === lowerName || 
      note.english.toLowerCase().includes(lowerName)
    )
  );
}

/**
 * Find a note by Persian name
 */
export function findNoteByPersian(persianName: string): LearnedNote | undefined {
  const notes = getAllLearnedNotes();
  return notes.find((note) => note.persian === persianName);
}

/**
 * Get notes that match a keyword (for algorithm matching)
 */
export function getNotesMatchingKeyword(keyword: string): LearnedNote[] {
  const notes = getAllLearnedNotes();
  const lowerKeyword = keyword.toLowerCase();
  return notes.filter(
    (note) =>
      note.isTranslated &&
      note.english &&
      (note.english.toLowerCase().includes(lowerKeyword) ||
        note.persian.includes(keyword))
  );
}

/**
 * Get all English note names for a category (for algorithm keywords)
 */
export function getEnglishKeywordsForCategory(category: string): string[] {
  const keywords = learnedNotesData.categoryKeywords as Record<string, readonly string[]>;
  const categoryKeywords = keywords[category];
  return categoryKeywords ? [...categoryKeywords] : [];
}

/**
 * Get Persian-to-English translation map
 * Returns a map where keys are Persian note names and values are English translations
 */
export function getPersianToEnglishMap(): Map<string, string> {
  const notes = getAllLearnedNotes();
  const translationMap = new Map<string, string>();
  
  notes.forEach((note) => {
    if (note.isTranslated && note.english && note.persian) {
      // Add exact Persian -> English mapping
      translationMap.set(note.persian.toLowerCase().trim(), note.english.toLowerCase().trim());
      // Also add normalized versions (remove extra spaces)
      const normalizedPersian = note.persian.trim().replace(/\\s+/g, " ");
      translationMap.set(normalizedPersian.toLowerCase(), note.english.toLowerCase().trim());
    }
  });
  
  return translationMap;
}

/**
 * Translate a Persian note to English
 * Returns both the original Persian and English translation for matching
 */
export function translatePersianNote(persianNote: string): string[] {
  const normalized = persianNote.toLowerCase().trim();
  const translationMap = getPersianToEnglishMap();
  
  // Try exact match first
  const english = translationMap.get(normalized);
  if (english) {
    return [normalized, english];
  }
  
  // Try to find by partial match
  for (const [persian, eng] of translationMap.entries()) {
    if (normalized.includes(persian) || persian.includes(normalized)) {
      return [normalized, eng];
    }
  }
  
  // If no translation found, return just the Persian (for fallback matching)
  return [normalized];
}

/**
 * Check if a note belongs to a specific layer
 */
export function isNoteInLayer(note: LearnedNote, layer: "top" | "middle" | "base"): boolean {
  return note.stats.primaryLayer === layer;
}

/**
 * Get layer weight for a note (based on how often it appears in that layer)
 */
export function getLayerWeight(note: LearnedNote, layer: "top" | "middle" | "base"): number {
  switch (layer) {
    case "top":
      return note.stats.topRatio;
    case "middle":
      return note.stats.middleRatio;
    case "base":
      return note.stats.baseRatio;
  }
}

/**
 * Get all unique English keywords for a category (deduplicated)
 */
export function getUniqueKeywordsForCategory(category: string): string[] {
  const keywords = getEnglishKeywordsForCategory(category);
  return Array.from(new Set(keywords));
}

const learnedNotesModule = {
  getAllLearnedNotes,
  getNotesByCategory,
  getCategoryKeywords,
  findNoteByEnglish,
  findNoteByPersian,
  getNotesMatchingKeyword,
  getEnglishKeywordsForCategory,
  isNoteInLayer,
  getLayerWeight,
  getUniqueKeywordsForCategory,
  getPersianToEnglishMap,
  translatePersianNote,
};

export default learnedNotesModule;
`;

// Write to frontend lib directory
const outputPath = path.join(
  __dirname,
  "..",
  "perfume-frontend-new",
  "src",
  "lib",
  "learned-notes.ts"
);
fs.writeFileSync(outputPath, tsContent, "utf-8");

console.log(`✅ Generated TypeScript file!`);
console.log(`💾 Saved to: ${outputPath}`);
console.log(`📊 Total notes: ${categorizedData.totalNotes}`);
console.log(
  `📈 Categories: ${Object.keys(categorizedData.categoryCounts).length}`
);
