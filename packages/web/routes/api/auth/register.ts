import { Handlers } from "$fresh/server.ts";
import {
  registerUser,
  createAccessToken,
  createRefreshTokenForUser,
  setAuthCookies,
} from "../../../utils/auth.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { email, password, displayName } = body;

      // Validate input
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Register user
      const user = await registerUser(email, password, displayName);

      // Create tokens
      const accessToken = await createAccessToken(user);
      const refreshToken = await createRefreshTokenForUser(user);

      // Set cookies and return user
      const headers = new Headers({
        "Content-Type": "application/json",
      });
      setAuthCookies(headers, accessToken, refreshToken);

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          },
        }),
        { status: 201, headers }
      );
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        return new Response(
          JSON.stringify({ error: "Email already registered" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      console.error("Registration error:", error);
      return new Response(
        JSON.stringify({ error: "Registration failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
