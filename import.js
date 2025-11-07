const fs = require("fs");
const fetch = require("node-fetch");

// Strapi API base URL
const API_URL = process.env.API_URL || "https://kioskapi.gandom-perfume.ir/api";
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

async function main() {
  const brands = JSON.parse(fs.readFileSync("./brands.json", "utf-8"));
  const collections = JSON.parse(
    fs.readFileSync("./collections.json", "utf-8")
  );
  const perfumes = JSON.parse(fs.readFileSync("./perfumes.json", "utf-8"));

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
    // Check if perfume already exists
    let existing = await getData("perfumes", "name_en", p.name_en);
    if (existing?.data?.length) {
      console.log(`⚠️ Perfume ${p.name_en} already exists, skipping`);
      continue;
    }

    // Convert English brand name to Persian for lookup
    const persianBrandName = brandNameMapping[p.brand] || p.brand;

    const data = {
      name_en: p.name_en,
      name_fa: p.name_fa,
      gender: p.gender, // ⚠️ send exactly as in JSON (make sure it matches enum in Strapi)
      season: p.season,
      family: p.family,
      character: p.character,
      notes: p.notes,
      brand: brandMap[persianBrandName] || null,
      collection: collectionMap[p.collection] || null,
    };

    if (!brandMap[persianBrandName] && p.brand) {
      console.log(`⚠️ Brand not found: ${p.brand} (Persian: ${persianBrandName})`);
    }

    await postData("perfumes", data);
    console.log(`✨ Imported perfume: ${p.name_en} (brand: ${p.brand} -> ${persianBrandName})`);
  }

  console.log("🎉 Import finished");
}

main();
