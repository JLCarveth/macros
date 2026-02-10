import { Handlers } from "$fresh/server.ts";
import {
  getCookie,
  revokeUserRefreshToken,
  clearAuthCookies,
} from "../../../utils/auth.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      // Revoke refresh token if present
      const refreshToken = getCookie(req, "refresh_token");
      if (refreshToken) {
        await revokeUserRefreshToken(refreshToken);
      }

      // Clear cookies
      const headers = new Headers({
        Location: "/",
      });
      clearAuthCookies(headers);

      return new Response(null, { status: 302, headers });
    } catch (error) {
      console.error("Logout error:", error);

      // Still clear cookies even if revocation fails
      const headers = new Headers({
        Location: "/",
      });
      clearAuthCookies(headers);

      return new Response(null, { status: 302, headers });
    }
  },
};
