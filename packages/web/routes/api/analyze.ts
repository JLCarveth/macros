import { Handlers } from "$fresh/server.ts";
import { requireAuth, getCookie, verifyAccessToken } from "../../utils/auth.ts";

export const handler: Handlers = {
  async POST(req) {
    // Verify authentication
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
      // Get the API URL from environment
      const apiUrl = Deno.env.get("NUTRITION_API_URL") || "http://localhost:3000";

      // Get the form data from the request
      const formData = await req.formData();
      const image = formData.get("image");

      if (!image || !(image instanceof File)) {
        return new Response(
          JSON.stringify({ error: "No image file provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create new form data to forward to the API
      const forwardFormData = new FormData();
      forwardFormData.append("image", image);

      // Forward request to the Node.js API
      const response = await fetch(`${apiUrl}/analyze-nutrition`, {
        method: "POST",
        body: forwardFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ error: errorData.error || "Analysis failed" }),
          { status: response.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Analyze proxy error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
