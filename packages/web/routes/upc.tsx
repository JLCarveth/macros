import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import UpcLookup from "../islands/UpcLookup.tsx";

interface UpcData {
  user: User;
  initialCode: string | null;
}

export const handler: Handlers<UpcData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    // Extract optional ?code= query param for deep linking
    const url = new URL(req.url);
    const initialCode = url.searchParams.get("code");

    return ctx.render({
      user: authResult.user!,
      initialCode,
    });
  },
};

export default function UpcPage({ data }: PageProps<UpcData>) {
  return (
    <>
      <Head>
        <title>Quick Add - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Quick Add by Barcode</h1>
          <p class="text-gray-600">
            Scan a barcode to quickly log foods you've already saved.
          </p>
        </div>

        <UpcLookup initialCode={data.initialCode} />
      </div>
    </>
  );
}
