import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Eye,
  Search,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";

const CTA_HREF =
  "mailto:hello@getprimeos.com?subject=PrimeOS%20Access%20Request";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white scroll-smooth">
      <header className="border-b border-zinc-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <span className="text-sm font-semibold tracking-tight text-white">
            PrimeOS
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Log In
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 md:pt-14 md:pb-24 space-y-20 md:space-y-24">
        {/* SECTION 1 — HERO */}
        <section className="space-y-8">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              You&apos;re Leaving Money on the Table. Every. Single. Day.
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto md:mx-0">
              And you don&apos;t even know how much.
            </p>
          </div>
          <div className="flex justify-center md:justify-start">
            <a
              href={CTA_HREF}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#E65100] px-8 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#F57C00]"
            >
              Request Access
            </a>
          </div>
        </section>

        {/* SECTION 2 — THE PAIN */}
        <section className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Sound Familiar?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PainCard
              icon={<Search className="h-5 w-5 text-[#E65100]" />}
              title="You check 10 places for one answer."
              body="POS for sales. A spreadsheet for labor. A folder for invoices. Your head for everything else. By the time you find the number, the moment's gone."
            />
            <PainCard
              icon={<TrendingDown className="h-5 w-5 text-[#E65100]" />}
              title="You don't know your real food cost."
              body="You think it's 30%. It might be 37%. You won't know until the end of the month — and by then you've been bleeding for 30 days."
            />
            <PainCard
              icon={<Eye className="h-5 w-5 text-[#E65100]" />}
              title="You're invisible online."
              body="The chain down the street has 847 Google reviews. You have 43. They show up first. You don't show up at all. And you didn't even know it was a problem."
            />
            <PainCard
              icon={<User className="h-5 w-5 text-[#E65100]" />}
              title="You're figuring it out alone."
              body="No one teaches you how to read your own numbers. No one shows you where the leaks are. You're inside your four walls guessing — and guessing is expensive."
            />
          </div>
        </section>

        {/* SECTION 3 — THE COST */}
        <section className="rounded-3xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-6 py-16 text-center space-y-4">
          <p className="text-lg text-zinc-300">
            The average independent operator is bleeding
          </p>
          <p className="text-5xl md:text-6xl font-bold text-[#E65100] tracking-tight">
            $4,000 – $8,000
          </p>
          <p className="text-lg text-zinc-300">
            per month in leaks they can&apos;t see.
          </p>
          <p className="mt-4 text-sm md:text-base text-zinc-500 max-w-2xl mx-auto">
            Menu pricing gaps. Overtime that shouldn&apos;t exist. Delivery
            fees eating your margins. Vendors creeping up 2% and hoping you
            won&apos;t notice.
          </p>
        </section>

        {/* SECTION 4 — THE SOLUTION */}
        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              One Platform. Complete Picture. 90 Seconds a Day.
            </h2>
            <p className="text-lg text-zinc-400">
              PrimeOS gives independent pizzeria operators complete visibility
              into their business. Inside and outside. Every day it makes you a
              little smarter than yesterday.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-[#E65100]" />}
              title="See Everything"
              body="Sales, labor, food cost, vendors, delivery economics, competitor intel, online reputation — one place."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6 text-[#E65100]" />}
              title="Understand Everything"
              body="Every number has an education layer. What it means. Why it matters. What to consider. PrimeOS teaches you to read your own business."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6 text-[#E65100]" />}
              title="Act on Everything"
              body="Daily scoops pulled from your actual data. Different insights every day because your numbers change every day. No advice. Just your math."
            />
          </div>
        </section>

        {/* SECTION 5 — RISK REVERSAL */}
        <section className="space-y-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            It&apos;s free.
          </h2>
          <p className="text-lg text-zinc-300">
            Not freemium. Not a trial. Not &quot;free for 14 days then we
            charge you.&quot;
          </p>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto">
            PrimeOS is provided free through your food distributor. No credit
            card. No catch. Your distributor invests in your success because
            when you win, they win.
          </p>
        </section>

        {/* SECTION 6 — CTA REPEAT */}
        <section className="space-y-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Stop Running Blind.
          </h2>
          <div className="flex justify-center">
            <a
              href={CTA_HREF}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#E65100] px-8 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-[#F57C00]"
            >
              Request Access
            </a>
          </div>
          <p className="text-sm text-zinc-500 mt-3">
            Built by a pizzeria operator who got tired of guessing.
          </p>
        </section>

        {/* SECTION 7 — FOOTER */}
        <section className="border-t border-zinc-800 pt-10 space-y-4 text-center text-sm text-zinc-500">
          <p>
            Driven by gratitude. Give without expectation. Community above
            competition.
          </p>
          <p>© 2026 Ambition &amp; Legacy LLC · Kent, Ohio</p>
          <div className="flex justify-center gap-4 text-xs">
            <Link
              href="/terms"
              className="text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              Terms
            </Link>
            <span>·</span>
            <Link
              href="/privacy"
              className="text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

type PainCardProps = {
  icon: React.ReactNode;
  title: string;
  body: string;
};

function PainCard({ icon, title, body }: PainCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900 border border-zinc-800 px-5 py-5">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950/60">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  body: string;
};

function FeatureCard({ icon, title, body }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900 border border-zinc-800 px-5 py-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950/60">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

