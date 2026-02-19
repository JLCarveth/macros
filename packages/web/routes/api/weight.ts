import { Handlers } from "$fresh/server.ts";
import { getCookie, verifyAccessToken } from "../../utils/auth.ts";
import { createWeightLogEntry, getWeightLog, deleteWeightLogEntry } from "../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const accessToken = getCookie(req, "access_token");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const url = new URL(req.url);
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");

      if (!start || !end) {
        return new Response(
          JSON.stringify({ error: "start and end query parameters are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const entries = await getWeightLog(payload.userId, start, end);
      return new Response(JSON.stringify(entries), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Get weight log error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get weight log" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  async POST(req) {
    const accessToken = getCookie(req, "access_token");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const body = await req.json();
      const { weightKg, bodyFatPct, loggedDate } = body;

      if (typeof weightKg !== "number" || weightKg <= 0) {
        return new Response(
          JSON.stringify({ error: "weightKg must be a positive number" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (bodyFatPct !== undefined && bodyFatPct !== null) {
        if (typeof bodyFatPct !== "number" || bodyFatPct <= 0 || bodyFatPct >= 100) {
          return new Response(
            JSON.stringify({ error: "bodyFatPct must be between 0 and 100" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const entry = await createWeightLogEntry(payload.userId, {
        weightKg,
        bodyFatPct: bodyFatPct ?? undefined,
        loggedDate,
      });

      return new Response(JSON.stringify(entry), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Create weight log error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save weight entry" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  async DELETE(req) {
    const accessToken = getCookie(req, "access_token");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(
          JSON.stringify({ error: "id query parameter is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      await deleteWeightLogEntry(id, payload.userId);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Delete weight log error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to delete weight entry" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
