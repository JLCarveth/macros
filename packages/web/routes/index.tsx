import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Nutrition Llama - AI-Powered Nutrition Tracking</title>
      </Head>

      <div class="relative overflow-hidden">
        {/* Hero Section */}
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div class="text-center">
            <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span class="block">Track Nutrition</span>
              <span class="block text-primary-600">With AI</span>
            </h1>
            <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Snap a photo of any nutrition label and let AI extract the data for you.
              Track your daily intake, monitor macros, and reach your health goals.
            </p>
            <div class="mt-10 flex justify-center gap-4">
              <a
                href="/register"
                class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
              >
                Get Started Free
              </a>
              <a
                href="/login"
                class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div class="bg-white py-16">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center">
              <h2 class="text-3xl font-extrabold text-gray-900">
                Everything you need to track nutrition
              </h2>
            </div>

            <div class="mt-16 grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div class="text-center">
                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mx-auto">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-lg font-medium text-gray-900">Scan Labels</h3>
                <p class="mt-2 text-gray-500">
                  Use your camera to scan nutrition labels. Our AI extracts all the data automatically.
                </p>
              </div>

              {/* Feature 2 */}
              <div class="text-center">
                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mx-auto">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-lg font-medium text-gray-900">Track Macros</h3>
                <p class="mt-2 text-gray-500">
                  Monitor your daily calories, protein, carbs, and fat intake with detailed breakdowns.
                </p>
              </div>

              {/* Feature 3 */}
              <div class="text-center">
                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mx-auto">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 class="mt-4 text-lg font-medium text-gray-900">Daily Logs</h3>
                <p class="mt-2 text-gray-500">
                  Log meals by time of day and review your nutrition history anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div class="bg-primary-600 py-16">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl font-extrabold text-white">
              Ready to start tracking?
            </h2>
            <p class="mt-4 text-xl text-primary-100">
              Create a free account and start scanning nutrition labels today.
            </p>
            <a
              href="/register"
              class="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 shadow-sm"
            >
              Sign Up Free
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
