const fs = require("fs");

// Strapi API base URL
const API_URL = "http://localhost:1337/api";
// Updated API token
const API_TOKEN =
  "52026d5bf4499b85d2e072dfe0f8cd87946e02b57f9cd2d9bca950e3c0b79c6a5330bc3ce6b8e0b1a2dc00ca8a1243a3ddbe0ff4926b7eaf26a0fe88b319d0bcced9e057ff2d8f727ee2ca62050d8083afe0bc89d2501d42043aa493841a2b12ee651cdf6ebf9a8929f83b7e7d38e65ef55854a9230e4793d6347a98bb489cb0";

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