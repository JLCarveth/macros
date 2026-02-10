import { FreshContext } from "$fresh/server.ts";
import { getOptionalUser } from "../utils/auth.ts";

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds

export async function handler(req: Request, ctx: FreshContext) {
  // Check authentication and set user in state for all pages
  const { user, newAccessToken } = await getOptionalUser(req);

  // Set user in state so layout and pages can access it
  ctx.state.user = user;

  // If we issued a new access token, set it in the response
  if (newAccessToken) {
    const response = await ctx.next();
    const body = await response.text();
    const headers = new Headers(response.headers);
    headers.append(
      "Set-Cookie",
      `access_token=${newAccessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ACCESS_TOKEN_EXPIRY}`
    );
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return ctx.next();
}
