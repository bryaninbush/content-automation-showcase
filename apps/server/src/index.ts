import { handleApi, handleStatic } from "./http";

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request);
      }
      return await handleStatic(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ error: message }, null, 2), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
  }
});

console.log(`Content Automation Platform listening on :${port}`);
