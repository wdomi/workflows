import fetch from "node-fetch";
import fs from "fs";

// 🔐 CONFIG
const KOBO_TOKEN = process.env.KOBO_TOKEN;
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;

const BASEROW_URL = "https://api.baserow.io/api/database/rows/table/918679/";

// 📦 Your Kobo projects
const PROJECTS = [
  { id: "aXes776gYdMrEKVrw2dZ4s", name: "SP" },
  { id: "a2VSpLET9jb2j466sKKt9b", name: "RP" },
  { id: "aEpLqzmV9rMRy9Z3KAUMDa", name: "US" },
  { id: "auUDJUGB38voJaXNRkRxcw", name: "OF" }
];

// 📁 Load last processed IDs per project
let lastIds = {};
if (fs.existsSync("last_ids.json")) {
  lastIds = JSON.parse(fs.readFileSync("last_ids.json", "utf-8"));
}

for (const project of PROJECTS) {
  const KOBO_URL = `https://eu.kobotoolbox.org/api/v2/assets/${project.id}/data/?format=json`;

  console.log(`\n📡 Fetching project ${project.name}`);

  const res = await fetch(KOBO_URL, {
    headers: {
      Authorization: `Token ${KOBO_TOKEN}`,
      "Accept": "application/json"
    }
  });

  const text = await res.text();
  console.log("RAW RESPONSE:", text.slice(0, 200)); // shorter log

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error(`❌ Failed parsing JSON for ${project.name}`);
    continue;
  }

  const submissions = json.results;

  if (!submissions || submissions.length === 0) {
    console.log(`No submissions for ${project.name}`);
    continue;
  }

  let lastId = lastIds[project.id] || null;
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
      field_7969683: d.Point_and_shoot_Use_mera_to_take_a_photo_001,

      // ⭐ OPTIONAL: track source project
      field_project: project.name
    };

    console.log(`Sending from ${project.name}:`, payload);

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

  // 💾 Save newest ID per project
  if (newestId) {
    lastIds[project.id] = newestId;
  }
}

// 💾 Save all last IDs
fs.writeFileSync("last_ids.json", JSON.stringify(lastIds, null, 2));
