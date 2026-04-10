import fetch from "node-fetch";
import fs from "fs";

// 🔐 CONFIG (use GitHub secrets later)
const KOBO_URL = "https://eu.kobotoolbox.org/api/v2/assets/awP8AEtifYb6MrUTJU9b7T/data/?format=json";
const KOBO_TOKEN = process.env.KOBO_TOKEN;

const BASEROW_URL = "https://api.baserow.io/api/database/rows/table/918679/";
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;

// 📥 Load last processed submission
let lastId = null;
if (fs.existsSync("last_id.txt")) {
  lastId = fs.readFileSync("last_id.txt", "utf-8");
}

// 📡 Fetch Kobo data
const res = await fetch(KOBO_URL, {
  headers: {
    Authorization: `Token ${KOBO_TOKEN}`,
    "Accept": "application/json"
  }
});

// 🔍 Debug response
const text = await res.text();
console.log("RAW RESPONSE:", text);

// ✅ Parse JSON safely
let json;
try {
  json = JSON.parse(text);
} catch (e) {
  throw new Error("Kobo did not return JSON.");
}

// ✅ DEFINE submissions (this was missing)
const submissions = json.results;

// ✅ Handle empty case
if (!submissions || submissions.length === 0) {
  console.log("No new submissions.");
  process.exit(0);
}


// 🧠 Process only new entries
let newestId = lastId;

for (const d of submissions) {
  if (lastId && d._id <= lastId) continue;

  let lat = null;
let lon = null;

if (d.nest_coordinates) {
  const parts = d.nest_coordinates.split(" ");

  lat = parts[0] || null;
  lon = parts[1] || null;
}
const payload = {
  field_7969633: d.nest_id,
  field_7969634: d.river,
  field_7983573: d.transect,
  field_7969635: d.nest_name,

  field_7969636: lat,
  field_7969637: lon,

  field_7969642: d.aspect,
  field_7969643: d.side_going_downriver,
  field_7969644: d.height_m,
  field_7969645: d.ladder_needed,
  field_7969646: d.Enter_a_date,
  field_7969648: d.status,
  field_7969650: d.remark,
  field_7969682: d.Point_and_shoot_Use_mera_to_take_a_photo,
  field_7969683: d.Point_and_shoot_Use_mera_to_take_a_photo_001
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
