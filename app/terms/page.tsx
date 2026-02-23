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

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-1">Terms of Service</h1>
      <p className="text-sm text-slate-400 mb-2">PrimeOS — The Operating System for Pizza</p>
      <p className="text-xs text-slate-500 mb-8">Effective Date: February 23, 2026 · Version 1.0</p>

      {/* Sections */}
      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        <Section number="1" title="Agreement to Terms">
          <p>
            By accessing or using PrimeOS, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use PrimeOS. PrimeOS is operated by Ambition & Legacy LLC, located at 4463 Ridge View Dr, Kent, OH 44240.
          </p>
          <p>Contact: leeangelos.cao@gmail.com | (330) 310-6014</p>
        </Section>

        <Section number="2" title="Nature of Service">
          <p>
            PrimeOS is a data visualization, education, and operational tracking platform designed for independent pizzeria operators. PrimeOS displays your business data, calculates key performance indicators, provides educational content, and generates AI-powered summaries.
          </p>
          <p className="font-semibold text-white mt-3">PrimeOS is an educational tool, not a professional advisor.</p>
          <p>
            PrimeOS does not provide financial advice, legal advice, tax advice, accounting advice, or business consulting. All KPI grades, benchmarks, playbooks, and AI-generated content are educational in nature and are intended to help operators understand their business data.
          </p>
          <p>
            All business decisions — including but not limited to staffing decisions, vendor selection, pricing changes, menu changes, marketing spend, lease negotiations, and financial planning — are solely the responsibility of the operator. Ambition & Legacy LLC is not liable for any business decisions made based on data, grades, benchmarks, playbooks, or AI content displayed in PrimeOS.
          </p>
        </Section>

        <Section number="3" title="AI-Generated Content">
          <p>
            PrimeOS uses artificial intelligence (Anthropic Claude) to generate Morning Briefs, invoice OCR results, and educational content. AI-generated content may contain inaccuracies, errors, or hallucinations.
          </p>
          <p>
            You may want to independently verify any AI-generated content before taking action based on it. Ambition & Legacy LLC does not guarantee the accuracy, completeness, or reliability of AI-generated content.
          </p>
          <p>AI-generated content does not constitute professional advice of any kind.</p>
        </Section>

        <Section number="4" title="KPI Benchmarks and Grades">
          <p>
            PrimeOS displays KPI benchmarks, target ranges, and letter/color grades based on industry data and operator experience. These benchmarks are general guidelines and may not reflect the specific circumstances of your business, market, lease terms, or operational model.
          </p>
          <p>
            Benchmark targets (e.g., Food Cost 28–31%, Labor 19–21%, Occupancy ≤6%) are educational reference points. Your actual targets may differ based on your business model, location, menu mix, and financial obligations.
          </p>
          <p>
            PrimeOS grades (green, yellow, red) indicate where your numbers fall relative to general industry benchmarks. A red grade is an educational indicator, not a directive to take specific action.
          </p>
        </Section>

        <Section number="5" title="Playbooks and Education Content">
          <p>
            PrimeOS provides operational playbooks and educational content written by experienced pizzeria operators. This content represents common practices and approaches observed in the industry.
          </p>
          <p>
            Playbooks are educational resources, not directives. Phrases like &quot;consider checking,&quot; &quot;operators typically find,&quot; and &quot;common solutions include&quot; reflect the educational nature of this content. Operators should evaluate any suggested approach in the context of their specific business circumstances.
          </p>
          <p>Ambition & Legacy LLC is not responsible for outcomes resulting from following playbook suggestions.</p>
        </Section>

        <Section number="6" title="User Accounts and Data">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account.
          </p>
          <p>
            You retain ownership of all business data you enter into PrimeOS. By using PrimeOS, you grant Ambition & Legacy LLC a license to process, display, and store your data for the purpose of operating the service.
          </p>
          <p>
            You also grant Ambition & Legacy LLC permission to use anonymized, aggregated versions of your data for industry benchmarking purposes, as described in our Privacy Policy. You may opt out of aggregated data usage by contacting us.
          </p>
        </Section>

        <Section number="7" title="Subscription and Billing">
          <p>
            PrimeOS offers a free tier and paid subscription tiers. Paid subscriptions are billed monthly through Stripe. You may cancel your subscription at any time.
          </p>
          <p>
            Upon cancellation, your data is retained for 90 days. After 90 days, your data is permanently deleted unless you request an export.
          </p>
          <p>
            Ambition & Legacy LLC reserves the right to change subscription pricing with 30 days notice to existing subscribers.
          </p>
        </Section>

        <Section number="8" title="Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-none space-y-1 ml-4">
            <li>→ Use PrimeOS for any unlawful purpose</li>
            <li>→ Attempt to access data belonging to other operators</li>
            <li>→ Reverse engineer, decompile, or disassemble any part of PrimeOS</li>
            <li>→ Share your account credentials with unauthorized users</li>
            <li>→ Use PrimeOS to harass, harm, or discriminate against employees or any individuals</li>
            <li>→ Scrape, crawl, or extract data from PrimeOS through automated means</li>
          </ul>
        </Section>

        <Section number="9" title="Intellectual Property">
          <p>
            PrimeOS, including its name, logo, design, code, educational content, playbooks, benchmarks, and AI prompts, is the intellectual property of Ambition & Legacy LLC.
          </p>
          <p className="mt-2">Trademark: PrimeOS — U.S. Patent and Trademark Office, Serial Number 99664363.</p>
          <p>Copyright registrations: Case Numbers 1-15105047301 and 1-15105047497, U.S. Copyright Office.</p>
          <p>
            You may not copy, reproduce, distribute, or create derivative works from PrimeOS content without written permission from Ambition & Legacy LLC.
          </p>
        </Section>

        <Section number="10" title="Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Ambition & Legacy LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill, arising from your use of PrimeOS.
          </p>
          <p>
            Ambition & Legacy LLC&apos;s total liability to you for any claims arising from your use of PrimeOS shall not exceed the amount you paid to Ambition & Legacy LLC in the twelve (12) months preceding the claim.
          </p>
          <p>
            PrimeOS is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </Section>

        <Section number="11" title="Indemnification">
          <p>
            You agree to indemnify and hold harmless Ambition & Legacy LLC, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorney&apos;s fees) arising from your use of PrimeOS, your violation of these Terms, or your violation of any rights of a third party.
          </p>
        </Section>

        <Section number="12" title="Termination">
          <p>
            Ambition & Legacy LLC may suspend or terminate your access to PrimeOS at any time, with or without cause, with or without notice. Upon termination, your right to use PrimeOS ceases immediately.
          </p>
          <p>
            You may terminate your account at any time by contacting us. Data retention after termination is governed by our Privacy Policy.
          </p>
        </Section>

        <Section number="13" title="Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Ohio, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of PrimeOS shall be resolved in the courts of Portage County, Ohio.
          </p>
        </Section>

        <Section number="14" title="Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes via email or in-app notification at least 30 days before the changes take effect. Continued use of PrimeOS after the effective date of changes constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section number="15" title="Severability">
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
          </p>
        </Section>

        <Section number="16" title="Contact">
          <p>If you have questions about these Terms of Service, contact us:</p>
          <p className="mt-2">Ambition & Legacy LLC</p>
          <p>4463 Ridge View Dr, Kent, OH 44240</p>
          <p>Email: leeangelos.cao@gmail.com</p>
          <p>Phone: (330) 310-6014</p>
        </Section>
      </div>

      {/* Bottom */}
      <div className="mt-12 pt-6 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">© 2026 Ambition & Legacy LLC. All rights reserved.</p>
        <p className="text-xs text-slate-500 text-center mt-1">PrimeOS — The Operating System for Pizza</p>
      </div>
    </div>
  );
}
