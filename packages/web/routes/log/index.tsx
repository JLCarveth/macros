import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    // Redirect to today's log
    const today = new Date().toISOString().split("T")[0];
    return new Response(null, {
      status: 302,
      headers: { Location: `/log/${today}` },
    });
  },
};

export default function LogIndex() {
  return (
    <>
      <Head>
        <title>Food Log - Nutrition Llama</title>
      </Head>
      <div class="flex items-center justify-center min-h-screen">
        <p class="text-gray-500">Redirecting...</p>
      </div>
    </>
  );
}
