import { closeDatabase, openDatabase } from "./repository";

const sql = openDatabase();
const schema = await Bun.file(new URL("./schema.sql", import.meta.url)).text();

await sql.unsafe(schema);

const orgId = "org_internal";
const ownerId = "user_owner";
const ownerEmail = process.env.BOOTSTRAP_OWNER_EMAIL ?? "owner@example.com";

await sql`
  INSERT INTO organizations (id, name, plan, status)
  VALUES (${orgId}, 'Internal Team', 'internal', 'active')
  ON CONFLICT (id) DO NOTHING
`;

await sql`
  INSERT INTO users (id, email, google_sub, display_name, status)
  VALUES (${ownerId}, ${ownerEmail.toLowerCase()}, 'bootstrap-owner', 'Bootstrap Owner', 'active')
  ON CONFLICT (email) DO UPDATE SET google_sub = EXCLUDED.google_sub
`;

await sql`
  INSERT INTO memberships (user_id, organization_id, role)
  VALUES (${ownerId}, ${orgId}, 'owner')
  ON CONFLICT (user_id, organization_id) DO NOTHING
`;

await closeDatabase();

console.log("Initialized PostgreSQL database");
