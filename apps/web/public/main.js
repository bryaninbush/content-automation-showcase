async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-dev-user-email": "owner@example.com",
      ...(options.headers ?? {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function renderJson(id, data) {
  document.getElementById(id).textContent = JSON.stringify(data, null, 2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderClients(clients) {
  document.getElementById("clients").innerHTML = clients
    .map(
      (client) => `
        <div class="item">
          <strong>${escapeHtml(client.name)}</strong>
          <div class="muted">ID: ${escapeHtml(client.id)}</div>
          <div class="muted">Folder: ${escapeHtml(client.google_folder_id ?? "未設定")}</div>
          <div class="muted">Sheet: ${escapeHtml(client.sheet_id ?? "未設定")}</div>
        </div>
      `
    )
    .join("");
}

function renderJobs(jobs) {
  document.getElementById("jobs").innerHTML = jobs
    .map(
      (job) => `
        <div class="item">
          <strong>${escapeHtml(job.status)}</strong>
          <div class="muted">ID: ${escapeHtml(job.id)}</div>
          <div class="muted">Client: ${escapeHtml(job.client_id)}</div>
          <div class="muted">Scope: ${escapeHtml(job.scope)}</div>
          <div class="item-actions">
            <button type="button" data-job-status="in_progress" data-job-id="${escapeHtml(job.id)}">In Progress</button>
            <button type="button" data-job-status="waiting_review" data-job-id="${escapeHtml(job.id)}">Waiting Review</button>
            <button type="button" data-job-status="done" data-job-id="${escapeHtml(job.id)}">Done</button>
            <button type="button" data-job-status="failed" data-job-id="${escapeHtml(job.id)}">Failed</button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderKnowledge(documents) {
  document.getElementById("knowledge").innerHTML = documents
    .map(
      (document) => `
        <div class="item">
          <strong>${escapeHtml(document.type)} v${escapeHtml(document.version)}</strong>
          <div class="muted">Source: ${escapeHtml(document.source_file_id ?? "未設定")}</div>
          <div class="muted">Created: ${escapeHtml(document.created_at)}</div>
          <pre>${escapeHtml(document.content)}</pre>
        </div>
      `
    )
    .join("");
}

async function load() {
  const [me, gws, clients, jobs] = await Promise.all([
    api("/api/me"),
    api("/api/gws/login-instruction"),
    api("/api/clients"),
    api("/api/jobs")
  ]);

  renderJson("session", me);
  document.getElementById("gws-command").textContent = gws.command;
  renderClients(clients.clients);
  renderJobs(jobs.jobs);
}

document.getElementById("refresh").addEventListener("click", () => load().catch(alert));

document.getElementById("client-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await api("/api/clients", {
    method: "POST",
    body: JSON.stringify({
      name: form.get("name"),
      googleFolderId: form.get("googleFolderId") || undefined,
      sheetId: form.get("sheetId") || undefined
    })
  });
  event.currentTarget.reset();
  await load();
});

document.getElementById("job-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const rows = String(form.get("rows") ?? "")
    .split(",")
    .map((row) => Number(row.trim()))
    .filter((row) => Number.isFinite(row));

  await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      clientId: form.get("clientId"),
      scope: form.get("scope"),
      rows,
      notes: form.get("notes") || undefined
    })
  });
  event.currentTarget.reset();
  await load();
});

document.getElementById("jobs").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-job-status]");
  if (!button) return;
  await api(`/api/jobs/${button.dataset.jobId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: button.dataset.jobStatus
    })
  });
  await load();
});

document.getElementById("knowledge-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const clientId = form.get("clientId");
  await api(`/api/clients/${clientId}/knowledge`, {
    method: "POST",
    body: JSON.stringify({
      type: form.get("type"),
      content: form.get("content"),
      sourceFileId: form.get("sourceFileId") || undefined
    })
  });
  document.getElementById("knowledge-client-id").value = clientId;
  event.currentTarget.reset();
  const documents = await api(`/api/clients/${clientId}/knowledge`);
  renderKnowledge(documents.knowledge);
});

document.getElementById("load-knowledge").addEventListener("click", async () => {
  const clientId = document.getElementById("knowledge-client-id").value.trim();
  if (!clientId) return;
  const documents = await api(`/api/clients/${clientId}/knowledge`);
  renderKnowledge(documents.knowledge);
});

load().catch((error) => {
  renderJson("session", { error: error.message });
});
