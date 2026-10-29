import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: bad } = await db
  .from("ops_projects")
  .select("title, contact_person, contact_email")
  .is("archived_at", null)
  .or("contact_person.ilike.%K&S%,contact_email.ilike.%silvertonmidas%");
console.log("still corrupted:", bad?.length ?? 0, bad ?? []);

const names = ["Francois", "Pexmart", "ShareTech", "Boscobel", "Hire", "Clinton", "Dryers", "Alfred"];
const { data: rows } = await db
  .from("ops_projects")
  .select("title, contact_person, contact_email, contact_phone")
  .is("archived_at", null)
  .limit(80);
for (const p of rows ?? []) {
  if (!names.some((n) => p.title.includes(n))) continue;
  console.log(
    `${p.title.slice(0, 55)} | ${p.contact_person ?? "—"} | ${p.contact_email ?? "—"} | ${p.contact_phone ?? "—"}`,
  );
}
