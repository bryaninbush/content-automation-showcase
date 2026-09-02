import { closeDatabase } from "./db/repository";
import { handleApi } from "./http";

const baseUrl = "http://local.test";
const devEmail = process.env.BOOTSTRAP_OWNER_EMAIL ?? "owner@example.com";

async function api(path: string, init: RequestInit = {}) {
  const response = await handleApi(
    new Request(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-dev-user-email": devEmail,
        ...(init.headers ?? {})
      }
    })
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const suffix = Date.now();
  const health = await api("/api/health");
  if (!health.ok) throw new Error("Health check did not return ok=true");

  await api("/api/me");
  await api("/api/gws/login-instruction");
  await api("/api/clients");

  const createdClient = await api("/api/clients", {
    method: "POST",
    body: JSON.stringify({
      name: `Smoke Test Client ${suffix}`,
      googleFolderId: `folder_${suffix}`,
      sheetId: `sheet_${suffix}`
    })
  });
  const clientId = createdClient.client.id;

  await api(`/api/clients/${clientId}/knowledge`, {
    method: "POST",
    body: JSON.stringify({
      type: "brand-context",
      content: `Smoke test brand context ${suffix}`,
      sourceFileId: `doc_${suffix}`
    })
  });
  await api(`/api/clients/${clientId}/knowledge`);
  await api(`/api/clients/${clientId}/knowledge/brand-context`);

  const createdJob = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      clientId,
      scope: "selected",
      rows: [3, 5],
      notes: `Smoke test job ${suffix}`
    })
  });

  await api("/api/jobs");
  await api(`/api/jobs/${createdJob.job.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "in_progress"
    })
  });
  await api(`/api/jobs/${createdJob.job.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "done",
      resultLinks: [`https://docs.example.test/${suffix}`]
    })
  });

  console.log("Smoke test passed");
}

try {
  await main();
} finally {
  await closeDatabase();
}
