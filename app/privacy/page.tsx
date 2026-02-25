import type { ReactNode } from "react";

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-3">
        {number}. {title}
      </h2>
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold text-white mb-1">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-2">PrimeOS — The Operating System for Pizza</p>
      <p className="text-xs text-slate-500 mb-8">Effective Date: February 23, 2026</p>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        <Section number="1" title="Who We Are">
          <p>
            PrimeOS is operated by Ambition & Legacy LLC, Kent, Ohio 44240. When we say &quot;we,&quot; &quot;us,&quot; or &quot;our,&quot; we mean Ambition & Legacy LLC. When we say &quot;you&quot; or &quot;User,&quot; we mean anyone who uses PrimeOS.
          </p>
          <p>Contact: hello@getprimeos.com</p>
        </Section>

        <Section number="2" title="What Data We Collect">
          <p className="font-semibold text-white">Account Information</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Full name</li>
            <li>→ Email address</li>
            <li>→ Phone number</li>
            <li>→ Business name and legal entity name</li>
            <li>→ Business address(es)</li>
            <li>→ Password (encrypted, we cannot see your password)</li>
          </ul>
          <p className="font-semibold text-white mt-3">Business and Operational Data</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Daily sales figures</li>
            <li>→ Labor costs and hours</li>
            <li>→ Food cost and inventory data</li>
            <li>→ Recipe and menu information</li>
            <li>→ Employee information (names, roles, hire dates, pay rates)</li>
            <li>→ Marketing campaign data and ad spend</li>
            <li>→ Delivery platform data (DoorDash, UberEats, etc.)</li>
            <li>→ Catering and large order data</li>
            <li>→ Vendor and invoice data</li>
          </ul>
          <p className="font-semibold text-white mt-3">Data from Third-Party Integrations</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ FoodTec Solutions POS data (sales, orders, labor, menu)</li>
            <li>→ FoodTec Solutions Marketing data (loyalty, email, SMS campaigns)</li>
            <li>→ Meta Marketing API data (ad campaigns, spend, performance)</li>
          </ul>
          <p className="font-semibold text-white mt-3">Technical Data</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Device type and browser information</li>
            <li>→ IP address</li>
            <li>→ Login timestamps and session data</li>
            <li>→ Cookies and local storage data</li>
          </ul>
        </Section>

        <Section number="3" title="How We Use Your Data">
          <ul className="list-none space-y-1 ml-4">
            <li>→ To operate PrimeOS and display your business data in the dashboard</li>
            <li>→ To calculate KPIs, grades, benchmarks, and generate AI Morning Briefs</li>
            <li>→ To provide educational content relevant to your operational data</li>
            <li>→ To process billing and manage your subscription</li>
            <li>→ To communicate with you about your account, updates, and support</li>
            <li>→ To improve PrimeOS through anonymized, aggregated usage analytics</li>
            <li>→ To create anonymized industry benchmarks and reports (no individual business is identifiable)</li>
          </ul>
        </Section>

        <Section number="4" title="What We Do NOT Do With Your Data">
          <p className="font-semibold text-white">We want to be completely clear:</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ We do NOT sell your individual business data to anyone. Ever.</li>
            <li>→ We do NOT share your identifiable business data with other operators, competitors, or third parties</li>
            <li>→ We do NOT use your data for advertising or ad targeting</li>
            <li>→ We do NOT share your employee information with anyone outside your organization</li>
            <li>→ We do NOT provide your financial data to lenders, insurers, or credit agencies</li>
          </ul>
        </Section>

        <Section number="5" title="Anonymized and Aggregated Data">
          <p>
            We may use anonymized, aggregated data from all PrimeOS users to create industry benchmarks, performance reports, and analytics insights. For example, we may calculate &quot;the average food cost percentage across all PrimeOS operators is 31.2%.&quot;
          </p>
          <p>
            In anonymized data, no individual operator, business name, location, or financial detail is identifiable. You cannot be identified from aggregated data.
          </p>
          <p>
            This aggregated data helps us improve benchmarks and may be used in marketing materials, industry reports, or shared with partners to improve their services. At no point will your individual data be identifiable.
          </p>
        </Section>

        <Section number="6" title="How We Store and Protect Your Data">
          <p>Your data is stored on secure, enterprise-grade infrastructure:</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Database: Supabase (SOC 2 compliant, encrypted at rest and in transit)</li>
            <li>→ Hosting: Vercel (SOC 2 compliant, encrypted HTTPS)</li>
            <li>→ Authentication: Supabase Auth with encrypted passwords (bcrypt hashing)</li>
            <li>→ API keys and secrets: Stored in encrypted environment variables, never exposed in client-side code</li>
            <li>→ Row Level Security: Your data is isolated from other operators at the database level</li>
          </ul>
          <p>
            While we take reasonable measures to protect your data, no system is 100% secure. We cannot guarantee absolute security but we commit to promptly notifying affected users in the event of a data breach.
          </p>
        </Section>

        <Section number="7" title="Third-Party Services">
          <p>PrimeOS integrates with the following third-party services. Each has their own privacy policy:</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Supabase (database and authentication) — supabase.com/privacy</li>
            <li>→ Vercel (hosting) — vercel.com/legal/privacy-policy</li>
            <li>→ Stripe (payment processing) — stripe.com/privacy</li>
            <li>→ FoodTec Solutions (POS and marketing data) — foodtecsolutions.com</li>
            <li>→ Meta Platforms (advertising data) — facebook.com/privacy</li>
            <li>→ Anthropic (AI-generated content) — anthropic.com/privacy</li>
          </ul>
          <p>We are not responsible for the privacy practices of third-party services. We encourage you to review their privacy policies.</p>
        </Section>

        <Section number="8" title="Cookies">
          <p>PrimeOS uses cookies and similar technologies for:</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Authentication — keeping you logged in</li>
            <li>→ Preferences — remembering your selected store and settings</li>
            <li>→ Analytics — understanding how the app is used to improve it</li>
          </ul>
          <p>We do not use cookies for advertising or tracking across other websites. You can disable cookies in your browser settings, but this may affect the functionality of PrimeOS.</p>
        </Section>

        <Section number="9" title="Your Rights">
          <p>You have the following rights regarding your data:</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Access — You can request a copy of all data we hold about you and your business</li>
            <li>→ Export — You can request an export of your data in a standard format (CSV/PDF) at any time</li>
            <li>→ Correction — You can request correction of inaccurate data</li>
            <li>→ Deletion — You can request deletion of your account and all associated data</li>
            <li>→ Opt-out of aggregated data — You can request that your data be excluded from anonymized benchmarks</li>
          </ul>
          <p>To exercise any of these rights, contact us at hello@getprimeos.com. We will respond within 30 days.</p>
        </Section>

        <Section number="10" title="Data Retention">
          <p>We retain your data for as long as your account is active. If you cancel your subscription:</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Your data is retained for 90 days after cancellation in case you reactivate</li>
            <li>→ After 90 days, your data is permanently deleted unless you request an export before that date</li>
            <li>→ Anonymized, aggregated data that has already been incorporated into benchmarks is not deleted, as it cannot be traced back to you</li>
          </ul>
        </Section>

        <Section number="11" title="Children&apos;s Privacy">
          <p>
            PrimeOS is designed for business operators and is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we discover that we have collected data from a minor, we will delete it immediately.
          </p>
        </Section>

        <Section number="12" title="California Residents (CCPA)">
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Right to know what personal information is collected and how it is used</li>
            <li>→ Right to delete personal information</li>
            <li>→ Right to opt-out of the sale of personal information (we do not sell your data)</li>
            <li>→ Right to non-discrimination for exercising your privacy rights</li>
          </ul>
          <p>To exercise your CCPA rights, contact us at hello@getprimeos.com.</p>
        </Section>

        <Section number="13" title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of PrimeOS after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section number="14" title="Contact Us">
          <p>If you have questions about this Privacy Policy or your data, contact us:</p>
          <p className="mt-2">Ambition & Legacy LLC</p>
          <p>Kent, Ohio 44240</p>
          <p>Email: hello@getprimeos.com</p>
        </Section>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">© 2026 Ambition & Legacy LLC. All rights reserved.</p>
        <p className="text-xs text-slate-500 text-center mt-1">PrimeOS — The Operating System for Pizza</p>
      </div>
    </div>
  );
}
