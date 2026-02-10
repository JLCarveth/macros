import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import CameraCapture from "../islands/CameraCapture.tsx";

interface ScanData {
  user: User;
  initialUpc: string | null;
}

export const handler: Handlers<ScanData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    // Extract optional ?upc= query param to pre-fill UPC field
    const url = new URL(req.url);
    const initialUpc = url.searchParams.get("upc");

    return ctx.render({
      user: authResult.user!,
      initialUpc,
    });
  },
};

export default function ScanPage({ data }: PageProps<ScanData>) {
  return (
    <>
      <Head>
        <title>Scan Nutrition Label - Nutrition Llama</title>
      </Head>

      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Scan Nutrition Label</h1>
          <p class="text-gray-600">
            Take a photo of a nutrition label to extract the information automatically.
          </p>
        </div>

        <CameraCapture initialUpc={data.initialUpc} />
      </div>
    </>
  );
}
