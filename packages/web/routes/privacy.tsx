import { Head } from "$fresh/runtime.ts";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Nutrition Llama</title>
      </Head>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
        <p class="mt-2 text-sm text-gray-500">Last updated: February 10, 2026</p>

        <div class="mt-8 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 class="text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p class="mt-2">
              Nutrition Llama ("we", "us", or "our") is operated from Canada. We
              are committed to protecting your privacy and handling your personal
              information in accordance with Canada's{" "}
              <em>Personal Information Protection and Electronic Documents Act</em>
              {" "}(PIPEDA). This policy explains what data we collect, why we
              collect it, and how we use it.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              2. Information We Collect
            </h2>

            <h3 class="mt-4 text-lg font-medium text-gray-800">
              Account Information
            </h3>
            <p class="mt-1">
              When you create an account, we collect your <strong>email address</strong>{" "}
              and a <strong>display name</strong> (if you choose to provide one).
              Your password is cryptographically hashed before storage — we never
              store your password in plain text and cannot retrieve it.
            </p>

            <h3 class="mt-4 text-lg font-medium text-gray-800">
              Nutrition Data
            </h3>
            <p class="mt-1">
              We store the food items and nutrition information you choose to save
              and log through the application, including food names, nutrition
              facts, serving sizes, meal types, and dates. This data is provided
              entirely at your discretion — we only store what you explicitly
              submit.
            </p>

            <h3 class="mt-4 text-lg font-medium text-gray-800">
              Uploaded Images
            </h3>
            <p class="mt-1">
              When you scan a nutrition label, the image is sent to a
              third-party AI service (currently{" "}
              <a
                href="https://openrouter.ai/privacy"
                class="text-primary-600 hover:text-primary-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenRouter
              </a>) for analysis via a vision language model. The image is
              processed to extract nutrition data and is not permanently stored
              by us. Please refer to OpenRouter's privacy policy for details on
              how they handle data passed through their API.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              3. Analytics
            </h2>
            <p class="mt-2">
              We use{" "}
              <a
                href="https://plausible.io"
                class="text-primary-600 hover:text-primary-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Plausible Analytics
              </a>, a privacy-focused analytics tool. Plausible does not use
              cookies, does not collect personal data, and does not track
              individual users across sites. All data is aggregated and no
              personally identifiable information is gathered. Plausible is
              compliant with GDPR, CCPA, and PECR.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              4. How We Use Your Information
            </h2>
            <p class="mt-2">We use the information we collect to:</p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li>Provide and maintain your account</li>
              <li>Store and display your saved food items and daily nutrition logs</li>
              <li>Analyze nutrition label images you submit</li>
              <li>Understand aggregate usage patterns through anonymous analytics</li>
            </ul>
            <p class="mt-2">
              We do not sell, rent, or share your personal information with third
              parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              5. Third-Party Services
            </h2>
            <p class="mt-2">We use the following third-party services:</p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li>
                <strong>OpenRouter</strong> — Routes nutrition label images to a
                vision language model for analysis. Image data is transmitted to
                their API and processed according to their{" "}
                <a
                  href="https://openrouter.ai/privacy"
                  class="text-primary-600 hover:text-primary-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  privacy policy
                </a>.
              </li>
              <li>
                <strong>Plausible Analytics</strong> — Privacy-focused, cookieless
                web analytics. No personal data is collected.
              </li>
            </ul>
            <p class="mt-2">
              We do not use any other third-party services that process your
              personal data.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              6. Data Storage and Security
            </h2>
            <p class="mt-2">
              Your data is stored in a PostgreSQL database. We use
              industry-standard security measures including encrypted passwords
              (hashed with bcrypt), HTTP-only authentication cookies, and secure
              token-based authentication. While no system is perfectly secure, we
              take reasonable steps to protect your information.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              7. Your Rights
            </h2>
            <p class="mt-2">
              Under PIPEDA, you have the right to:
            </p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for the collection and use of your information</li>
            </ul>
            <p class="mt-2">
              To exercise any of these rights, please contact us using the
              information below.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              8. Cookies
            </h2>
            <p class="mt-2">
              We use only essential cookies required for authentication (session
              tokens). We do not use any tracking cookies or third-party cookies.
              Plausible Analytics operates without cookies entirely.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              9. Changes to This Policy
            </h2>
            <p class="mt-2">
              We may update this privacy policy from time to time. Any changes
              will be posted on this page with an updated revision date. Your
              continued use of the application after changes are posted
              constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              10. Contact
            </h2>
            <p class="mt-2">
              If you have questions about this privacy policy or wish to exercise
              your rights regarding your personal data, please contact us at the
              email address associated with the application administrator.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
