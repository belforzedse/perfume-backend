const fs = require("fs");
// Using Node.js built-in fetch (available in Node 18+)

// Strapi API base URL
const API_URL = "http://localhost:1337/api";
// Paste your Strapi Admin → Settings → API Tokens → Full Access token
const API_TOKEN =
  "812c56638029ffbcb9acb04d00c68ee1d84ca2ddeb367d1de01884ee7e19f326688f70ce5a5b66158579db2942bbf1fe13d399fd7a1ba7b447cd7bc22aee8bade7667b815da56cb5cfacbab65dd25241062ba953e0db904d7f599f940875092a732aaf64fb5ac9670a00cda3850d506fcdb6d6329bd4d4262a90c23b27b17f82";

// Map English brand names to Persian names
const brandNameMapping = {
  "Xerjoff": "زرجف",
  "Chanel": "شنل",
  "Dior": "دیور",
  "Creed": "کرید",
  "Amouage": "آموآژ",
  "Tom Ford": "تام فورد",
  "Yves Saint Laurent": "ایو سن لورن",
  "Paco Rabanne": "پاکو رابان",
  "Givenchy": "گیوانچی",
  "Lacoste": "لاکتوز",
  "Gucci": "گوچی",
  "Versace": "ورساچه",
  "Armani": "آرمانی",
  "Prada": "پرادا",
  "Burberry": "بربری",
  "Hermes": "هرمس"
};

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
  const perfumes = JSON.parse(fs.readFileSync("./perfumes.json", "utf-8"));

  // Get all brands and create mapping
  const brandsResponse = await getAllData("brands");
  const brandMap = {};
  if (brandsResponse?.data) {
    for (const brand of brandsResponse.data) {
      brandMap[brand.name] = brand.id;
    }
  }

  // Get all collections and create mapping
  const collectionsResponse = await getAllData("collections");
  const collectionMap = {};
  if (collectionsResponse?.data) {
    for (const collection of collectionsResponse.data) {
      collectionMap[collection.name] = collection.id;
    }
  }

  // Get all existing perfumes
  const existingPerfumesResponse = await getAllData("perfumes");
  if (!existingPerfumesResponse?.data) {
    console.error("❌ Failed to fetch existing perfumes");
    return;
  }

  console.log(`Found ${existingPerfumesResponse.data.length} existing perfumes`);
  console.log(`Found ${Object.keys(brandMap).length} brands`);
  console.log(`Found ${Object.keys(collectionMap).length} collections`);

  // Update perfumes with brand relationships
  for (const importPerfume of perfumes) {
    // Find existing perfume by name_en
    const existingPerfume = existingPerfumesResponse.data.find(
      p => p.name_en === importPerfume.name_en
    );

    if (!existingPerfume) {
      console.log(`⚠️ Perfume not found in database: ${importPerfume.name_en}`);
      continue;
    }

    // Convert English brand name to Persian for lookup
    const persianBrandName = brandNameMapping[importPerfume.brand] || importPerfume.brand;
    const brandId = brandMap[persianBrandName] || null;
    const collectionId = collectionMap[importPerfume.collection] || null;

    if (!brandId && importPerfume.brand) {
      console.log(`⚠️ Brand not found: ${importPerfume.brand} (Persian: ${persianBrandName})`);
    }

    // Update the perfume with brand and collection
    const updateData = {
      brand: brandId,
      collection: collectionId,
    };

    const updated = await putData("perfumes", existingPerfume.documentId, updateData);
    if (updated) {
      console.log(`✅ Updated perfume: ${importPerfume.name_en} -> brand: ${persianBrandName} (ID: ${brandId})`);
    } else {
      console.log(`❌ Failed to update perfume: ${importPerfume.name_en}`);
    }
  }

  console.log("🎉 Update finished");
}

main();