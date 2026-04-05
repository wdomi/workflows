import fetch from "node-fetch";
import fs from "fs";

// 🔐 CONFIG (use GitHub secrets later)
const KOBO_URL = "https://eu.kobotoolbox.org/api/v2/assets/awP8AEtifYb6MrUTJU9b7T/data/";
const KOBO_TOKEN = process.env.KOBO_TOKEN;

const BASEROW_URL = "https://api.baserow.io/api/database/rows/table/918679/?user_field_names=true";
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;

// 📥 Load last processed submission
let lastId = null;
if (fs.existsSync("last_id.txt")) {
  lastId = fs.readFileSync("last_id.txt", "utf-8");
}

// 📡 Fetch Kobo data
const res = await fetch(KOBO_URL, {
  headers: {
    "Authorization": `Token ${KOBO_TOKEN}`,
    "Accept": "application/json"
  }
});

// 🔍 Debug response
const text = await res.text();
console.log("RAW RESPONSE:", text);

// ✅ Try parsing manually
let json;
try {
  json = JSON.parse(text);
} catch (e) {
  throw new Error("Kobo did not return JSON. Check URL + token.");
}


// 🧠 Process only new entries
let newestId = lastId;

for (const d of submissions) {
  if (lastId && d._id <= lastId) continue;

  const payload = {
    id: d.field_7969633,
    river: d.field_7969634,
    name: d.field_7969635,
    lat: d.field_7969636,
    lon: d.field_7969637,
    elev: d.field_7969638,
    position: d.field_7969639,
    dist_from_spring_m: d.field_7969640,
    dist_from_PdG_m: d.field_7969641,
    aspect: d.field_7969642,
    side_going_downriver: d.field_7969643,
    height_m: d.field_7969644,
    ladder: d.field_7969645,
    date_first: d.field_7969646,
    photo_url: d.field_7969647,
    status: d.field_7969648,
    last_active: d.field_7969649,
    remark: d.field_7969650,
    created: d.field_7969651,
    updated: d.field_7969652,
    pic1: d.field_7969682,
    pic2: d.field_7969683
  };

  console.log("Sending:", payload);

  await fetch(BASEROW_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${BASEROW_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  newestId = d._id;
}

// 💾 Save last processed ID
if (newestId) {
  fs.writeFileSync("last_id.txt", newestId.toString());
}
