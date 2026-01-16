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
                  <span class="text-sm text-gray-600">{user.displayName || user.email}</span>
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
      </nav>

      <main class="flex-1">
        <Component />
      </main>

      <footer class="bg-white border-t border-gray-200 py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-gray-500">
            Nutrition Llama - Track your nutrition with AI
          </p>
        </div>
      </footer>
    </div>
  );
}
