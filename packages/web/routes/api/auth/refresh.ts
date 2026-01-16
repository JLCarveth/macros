import { Handlers } from "$fresh/server.ts";
import {
  getCookie,
  verifyRefreshTokenAndGetUser,
  createAccessToken,
  setAuthCookies,
  createRefreshTokenForUser,
  revokeUserRefreshToken,
} from "../../../utils/auth.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const refreshToken = getCookie(req, "refresh_token");

      if (!refreshToken) {
        return new Response(
          JSON.stringify({ error: "No refresh token" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Verify refresh token and get user
      const user = await verifyRefreshTokenAndGetUser(refreshToken);

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Invalid refresh token" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Revoke old refresh token
      await revokeUserRefreshToken(refreshToken);

      // Create new tokens (token rotation)
      const newAccessToken = await createAccessToken(user);
      const newRefreshToken = await createRefreshTokenForUser(user);

      // Set cookies
      const headers = new Headers({
        "Content-Type": "application/json",
      });
      setAuthCookies(headers, newAccessToken, newRefreshToken);

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          },
        }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Refresh error:", error);
      return new Response(
        JSON.stringify({ error: "Token refresh failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
