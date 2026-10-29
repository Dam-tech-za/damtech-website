/**
 * One-shot: apply ops_xero_sync_log migration bits + restore K&S49 overwrite
 * on Damtech Admin (service role from .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
  return env;
}

const RESTORE = [
  { match: /francois|ppcf/i, contact_person: "Francois Joubert", contact_email: "francois@ppcf.co.za", contact_phone: "+27832800970", dual: true },
  { match: /pexmart/i, contact_person: "Pexmart", contact_email: "", contact_phone: null, clearEmailIfSharon: true },
  { match: /sharetech/i, contact_person: "Henry Arendse", contact_email: "tara@sharetechsa.co.za", contact_phone: null },
  { match: /boscobel/i, contact_person: "Jannie Odendal", contact_email: "jannie@boscobel.net", contact_phone: "+27768461543" },
  { match: /hire\s*eng/i, contact_person: "", contact_email: "Admin@hireng.co.za", contact_phone: null },
  { match: /clinton/i, contact_person: "", contact_email: "Clinton@inimitablevenue.com", contact_phone: null },
  { match: /dryers/i, contact_person: "Catherine de Villiers", contact_email: "cath@dryersforafrica.co.za", contact_phone: "+27714988436" },
  { match: /alfred|mensah|qu0348/i, contact_person: null, contact_email: null, contact_phone: "+27749217449" },
];

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase URL or service role key");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: projects, error } = await db
  .from("ops_projects")
  .select("id, title, contact_person, contact_email, contact_phone")
  .is("archived_at", null)
  .limit(200);

if (error) {
  console.error("load failed", error.message);
  process.exit(1);
}

let restored = 0;
for (const p of projects ?? []) {
  const rule = RESTORE.find((r) => r.match.test(p.title));
  if (!rule) continue;
  const corrupted =
    /k\s*&\s*s\s*49/i.test(p.contact_person ?? "") ||
    /sharon@silvertonmidas/i.test(p.contact_email ?? "") ||
    /k\s*&\s*s\s*49/i.test(p.contact_email ?? "");
  const patch = {};
  if (rule.contact_person !== null && (corrupted || !String(p.contact_person ?? "").trim())) {
    patch.contact_person = rule.contact_person;
  }
  if (rule.contact_person === null && corrupted) {
    patch.contact_person = "";
  }
  if (rule.contact_email !== null && (corrupted || !String(p.contact_email ?? "").trim() || rule.clearEmailIfSharon)) {
    if (rule.clearEmailIfSharon && /sharon@silvertonmidas/i.test(p.contact_email ?? "")) {
      patch.contact_email = null;
    } else if (rule.contact_email !== "") {
      patch.contact_email = rule.contact_email;
    } else if (corrupted || /sharon@silvertonmidas/i.test(p.contact_email ?? "")) {
      patch.contact_email = null;
    }
  }
  if (rule.contact_email === null && corrupted && /sharon@silvertonmidas/i.test(p.contact_email ?? "")) {
    patch.contact_email = null;
  }
  if (rule.contact_phone !== null && (corrupted || !String(p.contact_phone ?? "").trim())) {
    patch.contact_phone = rule.contact_phone;
  }
  if (!Object.keys(patch).length) continue;
  const { error: upErr } = await db.from("ops_projects").update(patch).eq("id", p.id);
  if (upErr) console.error("update failed", p.title, upErr.message);
  else {
    restored += 1;
    console.log("restored", p.title, patch);
  }
}

console.log(`Done. Restored ${restored} projects.`);
