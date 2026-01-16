import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-6xl font-bold text-gray-900">404</h1>
          <p class="mt-4 text-xl text-gray-600">Page not found</p>
          <a
            href="/"
            class="mt-6 inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Go Home
          </a>
        </div>
      </div>
    </>
  );
}
