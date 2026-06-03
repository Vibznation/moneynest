import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — MoneyNest",
  description: "How MoneyNest collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "June 3, 2025";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            ← Back to MoneyNest
          </Link>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-foreground-muted mb-10">
          Effective date: {effectiveDate}
        </p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Who We Are</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">
              MoneyNest (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a personal finance app that helps you
              organize your bills, subscriptions, savings goals, and spending in one place.
              This Privacy Policy explains what data we collect, how we use it, and your rights
              regarding that data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Data We Collect</h2>
            <p className="text-sm text-foreground-muted leading-relaxed mb-3">
              We collect only the data necessary to provide our service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-muted">
              <li>
                <strong className="text-foreground">Account information</strong> — your email address and
                optional display name, used to create and manage your account.
              </li>
              <li>
                <strong className="text-foreground">Financial data you enter</strong> — bill names and amounts,
                subscription details, savings goals, income sources, and account balances that you
                manually add to the app.
              </li>
              <li>
                <strong className="text-foreground">Bank account data (optional)</strong> — if you choose to
                link a bank account via Plaid, we receive read-only access to your account balances
                and transaction history from your financial institution.
              </li>
              <li>
                <strong className="text-foreground">App preferences</strong> — theme, currency, notification
                settings, and other local preferences.
              </li>
              <li>
                <strong className="text-foreground">Device &amp; usage data</strong> — basic device information
                (browser type, operating system) processed by our infrastructure providers solely for
                security and service operation purposes. We do not run third-party analytics.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Third-Party Services</h2>
            <p className="text-sm text-foreground-muted leading-relaxed mb-4">
              MoneyNest relies on the following third-party services. Each has its own privacy policy
              that governs how they handle data.
            </p>

            <div className="space-y-5">
              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold mb-1">Supabase (Authentication &amp; Database)</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  We use <strong>Supabase</strong> to handle user authentication (sign-up / sign-in) and to
                  securely store your financial data in the cloud when you create an account. Supabase
                  stores data on servers provided by Amazon Web Services (AWS).
                </p>
                <p className="text-sm text-foreground-muted mt-2">
                  Data collected by Supabase on our behalf:{" "}
                  <em>email address, hashed password, user ID, and any financial data you save while
                  signed in.</em>
                </p>
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-accent hover:underline"
                >
                  Supabase Privacy Policy →
                </a>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold mb-1">Plaid (Bank Account Linking — Optional)</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  If you choose to link a bank account, we use <strong>Plaid</strong> to securely connect
                  to your financial institution. MoneyNest requests <em>read-only</em> access only;
                  we cannot move or transfer money. Plaid processes your banking credentials directly
                  and does not share them with us.
                </p>
                <p className="text-sm text-foreground-muted mt-2">
                  Data accessed via Plaid:{" "}
                  <em>account balances, transaction history (amounts, merchants, dates), and account
                  metadata (account type, institution name).</em>
                </p>
                <a
                  href="https://plaid.com/legal/#end-user-privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-accent hover:underline"
                >
                  Plaid Privacy Policy →
                </a>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold mb-1">Google Fonts (Vercel / CDN)</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  We use the <strong>Geist</strong> typeface served by Google Fonts via the Next.js font
                  optimization pipeline. When the app loads, your browser may make a request to Google
                  servers to fetch the font, which may transmit your IP address.
                </p>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-accent hover:underline"
                >
                  Google Privacy Policy →
                </a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-muted">
              <li>To provide, maintain, and improve the MoneyNest service.</li>
              <li>To authenticate you and secure your account.</li>
              <li>To display your financial data within the app.</li>
              <li>To send transactional emails (e.g., email confirmation, password reset) via Supabase.</li>
            </ul>
            <p className="text-sm text-foreground-muted mt-3 leading-relaxed">
              We do <strong>not</strong> sell your data, share it with advertisers, or use it for
              profiling or targeted advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Data Storage &amp; Security</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">
              When you use the app without signing in, all data is stored <strong>locally on your
              device</strong> using your browser&apos;s localStorage and never leaves your device.
            </p>
            <p className="text-sm text-foreground-muted leading-relaxed mt-3">
              When you create an account, your data is stored in Supabase&apos;s encrypted database.
              Supabase enforces row-level security (RLS) so that only you can access your own data.
              All data in transit is encrypted via HTTPS/TLS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Data Retention</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Your data is retained for as long as your account is active. You may delete your account
              and all associated data at any time by contacting us (see Section 9). Local data stored
              in your browser can be cleared at any time using the &quot;Reset &amp; delete data&quot; option in
              Settings or by clearing your browser&apos;s site data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Children&apos;s Privacy</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">
              MoneyNest is not directed to children under the age of 13 (or the applicable age of
              digital consent in your jurisdiction). We do not knowingly collect personal information
              from children. If you believe a child has provided us with personal data, please contact
              us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Your Rights</h2>
            <p className="text-sm text-foreground-muted leading-relaxed mb-2">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground-muted">
              <li><strong className="text-foreground">Access</strong> — request a copy of the data we hold about you.</li>
              <li><strong className="text-foreground">Correction</strong> — update inaccurate or incomplete data.</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your account and data.</li>
              <li><strong className="text-foreground">Portability</strong> — receive your data in a structured format.</li>
              <li><strong className="text-foreground">Withdrawal of consent</strong> — opt out of data processing where consent is the legal basis.</li>
            </ul>
            <p className="text-sm text-foreground-muted mt-3">
              To exercise any of these rights, contact us at the address in Section 9.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Contact</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">
              For any privacy-related questions or requests, please contact us at:{" "}
              <strong className="text-foreground">privacy@moneynest.app</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">
              We may update this policy from time to time. When we do, we will revise the
              &quot;Effective date&quot; at the top of this page. Continued use of MoneyNest after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link
            href="/"
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            ← Back to MoneyNest
          </Link>
        </div>
      </div>
    </div>
  );
}
