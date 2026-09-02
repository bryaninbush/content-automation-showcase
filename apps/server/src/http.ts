import {
  assertPermission,
  isValidJobStatus,
  normalizeKnowledgeType,
  parseIapEmail,
  parseIapSubject,
  type AuthenticatedUser
} from "@content/core";
import { buildGwsLoginInstruction } from "@content/gws-runner";
import {
  createAuditLog,
  createClient,
  createKnowledge,
  createJob,
  getKnowledgeByType,
  getSessionForUser,
  listKnowledge,
  listClients,
  listJobs,
  openDatabase,
  updateJobStatus
} from "./db/repository";

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {})
    }
  });
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function getAuthenticatedUser(request: Request): AuthenticatedUser | null {
  const email = parseIapEmail(request.headers.get("x-goog-authenticated-user-email"));
  const googleSub = parseIapSubject(request.headers.get("x-goog-authenticated-user-id"));
  if (email && googleSub) return { email, googleSub };

  const devEmail = request.headers.get("x-dev-user-email");
  if (process.env.NODE_ENV !== "production" && devEmail) {
    return {
      email: devEmail.toLowerCase(),
      googleSub: `dev:${devEmail.toLowerCase()}`
    };
  }

  return null;
}

function notFound(): Response {
  return json({ error: "Not found" }, { status: 404 });
}

export async function handleApi(request: Request): Promise<Response> {
  try {
    return await routeApi(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    if (message.includes("does not have permission")) return json({ error: message }, { status: 403 });
    if (message === "Client not found" || message === "Job not found") return notFound();
    if (message === "Invalid JSON body" || message.startsWith("Unsupported knowledge type")) {
      return json({ error: message }, { status: 400 });
    }
    return json({ error: message }, { status: 500 });
  }
}

async function routeApi(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health") {
    return json({ ok: true, service: "content-automation-platform" });
  }

  const db = openDatabase();

  const user = getAuthenticatedUser(request);
  if (!user) {
    return json({ error: "Unauthenticated. Use Cloud Run IAP or x-dev-user-email in local development." }, { status: 401 });
  }

  const session = getSessionForUser(db, user);
  const resolvedSession = await session;
  if (!resolvedSession) {
    return json({ error: "Authenticated user is not a member of any organization", email: user.email }, { status: 403 });
  }

  if (url.pathname === "/api/me") {
    return json({
      user: { email: resolvedSession.email },
      organizationId: resolvedSession.organizationId,
      role: resolvedSession.role
    });
  }

  if (url.pathname === "/api/gws/login-instruction") {
    return json(buildGwsLoginInstruction());
  }

  if (url.pathname === "/api/clients" && request.method === "GET") {
    assertPermission(resolvedSession.role, "client:read");
    return json({ clients: await listClients(db, resolvedSession.organizationId) });
  }

  if (url.pathname === "/api/clients" && request.method === "POST") {
    assertPermission(resolvedSession.role, "client:write");
    const body = await readJson<{ name: string; googleFolderId?: string; sheetId?: string }>(request);
    if (!body.name?.trim()) return json({ error: "name is required" }, { status: 400 });
    const client = await createClient(db, resolvedSession.organizationId, {
      name: body.name.trim(),
      googleFolderId: body.googleFolderId,
      sheetId: body.sheetId
    });
    await createAuditLog(db, {
      actorUserId: resolvedSession.userId,
      action: "client.create",
      targetType: "client",
      targetId: client.id,
      metadata: { name: client.name }
    });
    return json({ client }, { status: 201 });
  }

  const knowledgeListMatch = url.pathname.match(/^\/api\/clients\/([^/]+)\/knowledge$/);
  if (knowledgeListMatch && request.method === "GET") {
    assertPermission(resolvedSession.role, "knowledge:read");
    const clientId = knowledgeListMatch[1]!;
    return json({ knowledge: await listKnowledge(db, resolvedSession.organizationId, clientId) });
  }

  if (knowledgeListMatch && request.method === "POST") {
    assertPermission(resolvedSession.role, "knowledge:write");
    const clientId = knowledgeListMatch[1]!;
    const body = await readJson<{ type: string; content: string; sourceFileId?: string | null }>(request);
    if (!body.content?.trim()) return json({ error: "content is required" }, { status: 400 });
    const type = normalizeKnowledgeType(body.type ?? "");
    const knowledge = await createKnowledge(db, resolvedSession.organizationId, {
      clientId,
      type,
      content: body.content,
      sourceFileId: body.sourceFileId,
      createdBy: resolvedSession.userId
    });
    await createAuditLog(db, {
      actorUserId: resolvedSession.userId,
      action: "knowledge.create",
      targetType: "knowledge_document",
      targetId: knowledge.id,
      metadata: { clientId, type, version: knowledge.version }
    });
    return json({ knowledge }, { status: 201 });
  }

  const knowledgeTypeMatch = url.pathname.match(/^\/api\/clients\/([^/]+)\/knowledge\/([^/]+)$/);
  if (knowledgeTypeMatch && request.method === "GET") {
    assertPermission(resolvedSession.role, "knowledge:read");
    const clientId = knowledgeTypeMatch[1]!;
    const type = normalizeKnowledgeType(decodeURIComponent(knowledgeTypeMatch[2]!));
    const knowledge = await getKnowledgeByType(db, resolvedSession.organizationId, clientId, type);
    if (!knowledge) return notFound();
    return json({ knowledge });
  }

  if (url.pathname === "/api/jobs" && request.method === "GET") {
    assertPermission(resolvedSession.role, "job:read");
    return json({ jobs: await listJobs(db, resolvedSession.organizationId) });
  }

  if (url.pathname === "/api/jobs" && request.method === "POST") {
    assertPermission(resolvedSession.role, "job:create");
    const body = await readJson<{ clientId: string; scope: string; rows?: number[]; notes?: string }>(request);
    if (!body.clientId) return json({ error: "clientId is required" }, { status: 400 });
    const job = await createJob(db, resolvedSession.organizationId, {
      clientId: body.clientId,
      requestedBy: resolvedSession.userId,
      scope: body.scope ?? "selected",
      payload: {
        clientId: body.clientId,
        requestedBy: resolvedSession.email,
        scope: body.scope ?? "selected",
        rows: body.rows ?? [],
        notes: body.notes ?? ""
      }
    });
    await createAuditLog(db, {
      actorUserId: resolvedSession.userId,
      action: "job.create",
      targetType: "content_job",
      targetId: job.id,
      metadata: { scope: job.scope }
    });
    return json({ job }, { status: 201 });
  }

  const jobStatusMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/status$/);
  if (jobStatusMatch && request.method === "PATCH") {
    assertPermission(resolvedSession.role, "job:update");
    const body = await readJson<{ status: string; resultLinks?: string[]; errorMessage?: string | null }>(request);
    if (!isValidJobStatus(body.status)) return json({ error: "Unsupported job status" }, { status: 400 });
    const job = await updateJobStatus(db, resolvedSession.organizationId, {
      jobId: jobStatusMatch[1]!,
      status: body.status,
      resultLinks: body.resultLinks,
      errorMessage: body.errorMessage
    });
    await createAuditLog(db, {
      actorUserId: resolvedSession.userId,
      action: "job.status.update",
      targetType: "content_job",
      targetId: job.id,
      metadata: { status: job.status }
    });
    return json({ job });
  }

  return notFound();
}

export async function handleStatic(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = Bun.file(new URL(`../../web/public${path}`, import.meta.url));
  if (!(await file.exists())) return notFound();
  return new Response(file);
}
