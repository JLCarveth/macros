import { type PageProps } from "$fresh/server.ts";

const plausibleDomain = Deno.env.get("PLAUSIBLE_DOMAIN");
const plausibleEnabled = !!Deno.env.get("PLAUSIBLE_URL") && !!plausibleDomain;

export default function App({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nutrition Llama</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="https://esm.sh/chart.js@4.4.7/dist/chart.umd.js" defer></script>
        {plausibleEnabled && (
          <script
            defer
            data-api="/api/event"
            data-domain={plausibleDomain}
            src="/js/script.js"
          />
        )}
      </head>
      <body class="bg-gray-50 min-h-screen">
        <Component />
      </body>
    </html>
  );
}
