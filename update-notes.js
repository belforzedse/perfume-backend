const fs = require("fs");

// Strapi API base URL
const API_URL = "http://localhost:1337/api";
// Updated API token
const API_TOKEN =
  "506061ccebba94b76a5367d675f321b661507da2a96d32157153d6d1eebf633a583705d25da01f8d2d064e3bcd629b2ee8d7a439927ed863c1bfc71a3f449c4d619329fda1d4969865724874e1ba7f7508862dfd7a0f348b7c9dcadddf6831043f690c9f956132b013094e48717a1b8668a184a2fb6b0b22b4bfd76dab73d3d2";

// Helper: GET all data
async function getAllData(endpoint) {
  const res = await fetch(`${API_URL}/${endpoint}?pagination[pageSize]=1000`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Helper: PUT request
async function putData(endpoint, documentId, data) {
  const res = await fetch(`${API_URL}/${endpoint}/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    console.error(`❌ Error updating ${endpoint}/${documentId}:`, await res.text());
    return null;
  }
  return res.json();
}

async function main() {
  // Read the updated perfumes.json with Persian notes
  console.log('📖 Reading perfumes.json with Persian notes...');
  const perfumes = JSON.parse(fs.readFileSync("./perfumes.json", "utf-8"));

  // Get all existing perfumes from database
  console.log('🔍 Fetching existing perfumes from database...');
  const existingPerfumesResponse = await getAllData("perfumes");
  if (!existingPerfumesResponse?.data) {
    console.error("❌ Failed to fetch existing perfumes");
    return;
  }

  console.log(`Found ${existingPerfumesResponse.data.length} existing perfumes in database`);
  console.log(`Found ${perfumes.length} perfumes in JSON file`);

  let updatedCount = 0;
  let skippedCount = 0;

  // Update perfumes with Persian notes
  for (const importPerfume of perfumes) {
    // Find existing perfume by name_en
    const existingPerfume = existingPerfumesResponse.data.find(
      p => p.name_en === importPerfume.name_en
    );

    if (!existingPerfume) {
      console.log(`⚠️ Perfume not found in database: ${importPerfume.name_en}`);
      skippedCount++;
      continue;
    }

    // Update the perfume with Persian notes
    const updateData = {
      notes: importPerfume.notes // This now contains Persian notes
    };

    const updated = await putData("perfumes", existingPerfume.documentId, updateData);
    if (updated) {
      console.log(`✅ Updated notes for: ${importPerfume.name_en}`);
      console.log(`   Top: ${importPerfume.notes.top?.slice(0, 3).join(', ')}...`);
      updatedCount++;
    } else {
      console.log(`❌ Failed to update notes for: ${importPerfume.name_en}`);
      skippedCount++;
    }
  }

  console.log(`\n🎉 Update finished!`);
  console.log(`✅ Successfully updated: ${updatedCount} perfumes`);
  console.log(`⚠️ Skipped: ${skippedCount} perfumes`);
  console.log(`\n🔤 All perfume notes are now in Persian!`);
}

main();