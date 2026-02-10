import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const plausibleUrl = Deno.env.get("PLAUSIBLE_URL");
    if (!plausibleUrl) {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const body = await req.text();
      const clientIp = (ctx.remoteAddr as Deno.NetAddr)?.hostname || "127.0.0.1";

      const resp = await fetch(`${plausibleUrl}/api/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": req.headers.get("User-Agent") || "",
          "X-Forwarded-For": clientIp,
        },
        body,
      });

      return new Response(resp.body, { status: resp.status });
    } catch {
      return new Response("Failed to forward event", { status: 502 });
    }
  },
};
