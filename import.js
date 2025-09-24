const fs = require("fs");
const fetch = require("node-fetch");

// Strapi API base URL
const API_URL = "http://localhost:1337/api";
// Paste your Strapi Admin → Settings → API Tokens → Full Access token
const API_TOKEN =
  "812c56638029ffbcb9acb04d00c68ee1d84ca2ddeb367d1de01884ee7e19f326688f70ce5a5b66158579db2942bbf1fe13d399fd7a1ba7b447cd7bc22aee8bade7667b815da56cb5cfacbab65dd25241062ba953e0db904d7f599f940875092a732aaf64fb5ac9670a00cda3850d506fcdb6d6329bd4d4262a90c23b27b17f82";

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

async function main() {
  const brands = JSON.parse(fs.readFileSync("./brands.json", "utf-8"));
  const collections = JSON.parse(
    fs.readFileSync("./collections.json", "utf-8")
  );
  const perfumes = JSON.parse(fs.readFileSync("./perfumes.json", "utf-8"));

  const brandMap = {};
  const collectionMap = {};

  // 1. Brands
  for (const b of brands) {
    let existing = await getData("brands", "name", b.name);
    if (existing?.data?.length) {
      console.log(`⚠️ Brand ${b.name} already exists, skipping`);
      brandMap[b.name] = existing.data[0].id;
    } else {
      const created = await postData("brands", b);
      if (created?.data) {
        console.log(`✅ Created brand: ${b.name}`);
        brandMap[b.name] = created.data.id;
      }
    }
  }

  // 2. Collections
  for (const c of collections) {
    let existing = await getData("collections", "name", c.name);
    if (existing?.data?.length) {
      console.log(`⚠️ Collection ${c.name} already exists, skipping`);
      collectionMap[c.name] = existing.data[0].id;
    } else {
      const created = await postData("collections", c);
      if (created?.data) {
        console.log(`✅ Created collection: ${c.name}`);
        collectionMap[c.name] = created.data.id;
      }
    }
  }

  // 3. Perfumes
  for (const p of perfumes) {
    const data = {
      name_en: p.name_en,
      name_fa: p.name_fa,
      gender: p.gender, // ⚠️ send exactly as in JSON (make sure it matches enum in Strapi)
      season: p.season,
      family: p.family,
      character: p.character,
      notes: p.notes,
      brand: brandMap[p.brand] || null,
      collection: collectionMap[p.collection] || null,
    };
    await postData("perfumes", data);
    console.log(`✨ Imported perfume: ${p.name_en}`);
  }

  console.log("🎉 Import finished");
}

main();
