import postgres from "postgres";
import type { AuthenticatedUser, JobStatus, KnowledgeType, Role } from "@content/core";

export type Db = ReturnType<typeof postgres>;

export interface SessionContext {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

export interface ClientRecord {
  id: string;
  organization_id: string;
  name: string;
  google_folder_id: string | null;
  sheet_id: string | null;
  status: string;
}

export interface JobRecord {
  id: string;
  client_id: string;
  requested_by: string;
  status: JobStatus;
  scope: string;
  payload_json: unknown;
  result_links_json: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeRecord {
  id: string;
  client_id: string;
  type: KnowledgeType;
  content: string;
  source_file_id: string | null;
  version: number;
  created_by: string | null;
  created_at: string;
}

let db: Db | null = null;

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for PostgreSQL");
  }
  return databaseUrl;
}

export function openDatabase(): Db {
  db ??= postgres(getDatabaseUrl(), {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5)
  });
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (!db) return;
  await db.end();
  db = null;
}

export async function ensureUser(sql: Db, user: AuthenticatedUser): Promise<string> {
  const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${user.email}`;
  if (existing[0]) return existing[0].id;

  const id = crypto.randomUUID();
  await sql`
    INSERT INTO users (id, email, google_sub, display_name, status)
    VALUES (${id}, ${user.email}, ${user.googleSub}, ${user.displayName ?? null}, 'active')
  `;
  return id;
}

export async function getSessionForUser(sql: Db, user: AuthenticatedUser): Promise<SessionContext | null> {
  const userId = await ensureUser(sql, user);
  const rows = await sql<SessionContext[]>`
    SELECT
      users.id AS "userId",
      users.email AS email,
      memberships.organization_id AS "organizationId",
      memberships.role AS role
    FROM users
    JOIN memberships ON memberships.user_id = users.id
    WHERE users.id = ${userId}
    ORDER BY memberships.created_at ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function listClients(sql: Db, organizationId: string): Promise<ClientRecord[]> {
  return await sql<ClientRecord[]>`
    SELECT id, organization_id, name, google_folder_id, sheet_id, status
    FROM clients
    WHERE organization_id = ${organizationId}
    ORDER BY name
  `;
}

export async function createClient(
  sql: Db,
  organizationId: string,
  input: { name: string; googleFolderId?: string; sheetId?: string }
): Promise<ClientRecord> {
  const id = crypto.randomUUID();
  const rows = await sql<ClientRecord[]>`
    INSERT INTO clients (id, organization_id, name, google_folder_id, sheet_id)
    VALUES (${id}, ${organizationId}, ${input.name}, ${input.googleFolderId ?? null}, ${input.sheetId ?? null})
    RETURNING id, organization_id, name, google_folder_id, sheet_id, status
  `;
  return rows[0]!;
}

export async function listJobs(sql: Db, organizationId: string): Promise<JobRecord[]> {
  return await sql<JobRecord[]>`
    SELECT content_jobs.*
    FROM content_jobs
    JOIN clients ON clients.id = content_jobs.client_id
    WHERE clients.organization_id = ${organizationId}
    ORDER BY content_jobs.created_at DESC
  `;
}

export async function createJob(
  sql: Db,
  organizationId: string,
  input: { clientId: string; requestedBy: string; scope: string; payload: unknown }
): Promise<JobRecord> {
  const client = await sql<{ id: string }[]>`
    SELECT id FROM clients WHERE id = ${input.clientId} AND organization_id = ${organizationId}
  `;
  if (!client[0]) throw new Error("Client not found");

  const id = crypto.randomUUID();
  const rows = await sql<JobRecord[]>`
    INSERT INTO content_jobs
      (id, client_id, requested_by, status, scope, payload_json)
    VALUES (${id}, ${input.clientId}, ${input.requestedBy}, 'queued', ${input.scope}, ${sql.json(input.payload)})
    RETURNING *
  `;
  return rows[0]!;
}

export async function updateJobStatus(
  sql: Db,
  organizationId: string,
  input: { jobId: string; status: JobStatus; resultLinks?: string[]; errorMessage?: string | null }
): Promise<JobRecord> {
  const rows = await sql<JobRecord[]>`
    UPDATE content_jobs
    SET
      status = ${input.status},
      result_links_json = ${sql.json(input.resultLinks ?? [])},
      error_message = ${input.errorMessage ?? null},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${input.jobId}
      AND client_id IN (SELECT id FROM clients WHERE organization_id = ${organizationId})
    RETURNING *
  `;
  if (!rows[0]) throw new Error("Job not found");
  return rows[0];
}

export async function listKnowledge(sql: Db, organizationId: string, clientId: string): Promise<KnowledgeRecord[]> {
  const client = await sql<{ id: string }[]>`
    SELECT id FROM clients WHERE id = ${clientId} AND organization_id = ${organizationId}
  `;
  if (!client[0]) throw new Error("Client not found");

  return await sql<KnowledgeRecord[]>`
    SELECT knowledge_documents.*
    FROM knowledge_documents
    JOIN (
      SELECT type, MAX(version) AS latest_version
      FROM knowledge_documents
      WHERE client_id = ${clientId}
      GROUP BY type
    ) latest
      ON latest.type = knowledge_documents.type
     AND latest.latest_version = knowledge_documents.version
    WHERE knowledge_documents.client_id = ${clientId}
    ORDER BY knowledge_documents.type
  `;
}

export async function getKnowledgeByType(
  sql: Db,
  organizationId: string,
  clientId: string,
  type: KnowledgeType
): Promise<KnowledgeRecord | null> {
  const client = await sql<{ id: string }[]>`
    SELECT id FROM clients WHERE id = ${clientId} AND organization_id = ${organizationId}
  `;
  if (!client[0]) throw new Error("Client not found");

  const rows = await sql<KnowledgeRecord[]>`
    SELECT *
    FROM knowledge_documents
    WHERE client_id = ${clientId} AND type = ${type}
    ORDER BY version DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createKnowledge(
  sql: Db,
  organizationId: string,
  input: { clientId: string; type: KnowledgeType; content: string; sourceFileId?: string | null; createdBy: string }
): Promise<KnowledgeRecord> {
  const client = await sql<{ id: string }[]>`
    SELECT id FROM clients WHERE id = ${input.clientId} AND organization_id = ${organizationId}
  `;
  if (!client[0]) throw new Error("Client not found");

  const latest = await sql<{ version: number | null }[]>`
    SELECT MAX(version) AS version
    FROM knowledge_documents
    WHERE client_id = ${input.clientId} AND type = ${input.type}
  `;
  const version = (latest[0]?.version ?? 0) + 1;
  const id = crypto.randomUUID();

  const rows = await sql<KnowledgeRecord[]>`
    INSERT INTO knowledge_documents
      (id, client_id, type, content, source_file_id, version, created_by)
    VALUES (
      ${id},
      ${input.clientId},
      ${input.type},
      ${input.content},
      ${input.sourceFileId ?? null},
      ${version},
      ${input.createdBy}
    )
    RETURNING *
  `;
  return rows[0]!;
}

export async function createAuditLog(
  sql: Db,
  input: { actorUserId: string; action: string; targetType: string; targetId?: string; metadata?: unknown }
): Promise<void> {
  await sql`
    INSERT INTO audit_logs
      (id, actor_user_id, action, target_type, target_id, metadata_json)
    VALUES (
      ${crypto.randomUUID()},
      ${input.actorUserId},
      ${input.action},
      ${input.targetType},
      ${input.targetId ?? null},
      ${sql.json(input.metadata ?? {})}
    )
  `;
}
