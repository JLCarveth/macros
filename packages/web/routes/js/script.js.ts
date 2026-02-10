import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    const plausibleUrl = Deno.env.get("PLAUSIBLE_URL");
    if (!plausibleUrl) {
      return new Response("Not Found", { status: 404 });
    }

    const scriptPath = Deno.env.get("PLAUSIBLE_SCRIPT_PATH") || "/js/script.js";

    try {
      const resp = await fetch(`${plausibleUrl}${scriptPath}`);
      if (!resp.ok) {
        return new Response("Failed to fetch script", { status: resp.status });
      }

      const body = await resp.text();
      return new Response(body, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      return new Response("Failed to fetch script", { status: 502 });
    }
  },
};
