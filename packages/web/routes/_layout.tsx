import { type PageProps } from "$fresh/server.ts";

export default function Layout({ Component, state }: PageProps) {
  const user = state?.user;

  return (
    <div class="min-h-screen flex flex-col">
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <a href="/" class="flex items-center">
                <span class="text-xl font-bold text-primary-600">Nutrition Llama</span>
              </a>
              {user && (
                <div class="hidden sm:ml-8 sm:flex sm:space-x-4">
                  <a
                    href="/dashboard"
                    class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/scan"
                    class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md"
                  >
                    Scan
                  </a>
                  <a
                    href="/foods"
                    class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md"
                  >
                    My Foods
                  </a>
                  <a
                    href="/log"
                    class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md"
                  >
                    Food Log
                  </a>
                </div>
              )}
            </div>
            <div class="flex items-center space-x-4">
              {user ? (
                <>
                  <a
                    href="/dashboard"
                    class="text-sm text-gray-600 hover:text-primary-600"
                  >
                    {user.displayName || user.email}
                  </a>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      class="text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    class="text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Mobile navigation for logged-in users */}
        {user && (
          <div class="sm:hidden border-t border-gray-200 px-4 py-2">
            <div class="flex justify-around">
              <a
                href="/dashboard"
                class="flex flex-col items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </a>
              <a
                href="/scan"
                class="flex flex-col items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan
              </a>
              <a
                href="/foods"
                class="flex flex-col items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Foods
              </a>
              <a
                href="/log"
                class="flex flex-col items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Log
              </a>
            </div>
          </div>
        )}
      </nav>

      <main class="flex-1">
        <Component />
      </main>

      <footer class="bg-white border-t border-gray-200 py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p class="text-sm text-gray-500">
            Nutrition Llama - Track your nutrition with AI
          </p>
          <a
            href="/privacy"
            class="text-sm text-gray-500 hover:text-primary-600"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
