const fs = require("fs");
// Using Node.js built-in fetch (available in Node 18+)

// Strapi API base URL
const API_URL = "http://localhost:1337/api";
// Paste your Strapi Admin → Settings → API Tokens → Full Access token
const API_TOKEN =
  "506061ccebba94b76a5367d675f321b661507da2a96d32157153d6d1eebf633a583705d25da01f8d2d064e3bcd629b2ee8d7a439927ed863c1bfc71a3f449c4d619329fda1d4969865724874e1ba7f7508862dfd7a0f348b7c9dcadddf6831043f690c9f956132b013094e48717a1b8668a184a2fb6b0b22b4bfd76dab73d3d2";

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