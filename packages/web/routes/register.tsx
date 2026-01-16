import { Head } from "$fresh/runtime.ts";
import RegisterForm from "../islands/RegisterForm.tsx";

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Sign Up - Nutrition Llama</title>
      </Head>

      <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" class="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </a>
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </>
  );
}
