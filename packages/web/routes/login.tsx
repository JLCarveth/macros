import { Head } from "$fresh/runtime.ts";
import LoginForm from "../islands/LoginForm.tsx";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - Nutrition Llama</title>
      </Head>

      <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Or{" "}
              <a href="/register" class="font-medium text-primary-600 hover:text-primary-500">
                create a new account
              </a>
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </>
  );
}
