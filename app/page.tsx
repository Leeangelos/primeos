import Link from "next/link";
import { Flame, LineChart, ClipboardList, Shield } from "lucide-react";
import { Card, CardHeader, CardHeading, CardIcon, CardHeaderText, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const items = [
  {
    href: "/daily",
    icon: ClipboardList,
    title: "Daily KPI Entry",
    desc: "Manual entry, PRIME-first hierarchy, SLPH core metric.",
  },
  {
    href: "/weekly",
    icon: LineChart,
    title: "Weekly Rollups",
    desc: "Mon–Sun with 4AM cutoff, trends + charts.",
  },
  {
    href: "/rbac",
    icon: Shield,
    title: "RBAC + Audit",
    desc: "Admin / Manager / Viewer, audit log, controlled access.",
  },
  {
    href: "/targets",
    icon: Flame,
    title: "Targets",
    desc: "Effective date ranges, store-level target history.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">PrimeOS</h1>
          <p className="mt-1 text-sm text-muted">
            Daily entry, weekly rollups, targets, and access control.
          </p>
        </div>
        <div className="rounded-2xl bg-brand/10 px-3 py-2 text-sm text-brand ring-1 ring-brand/20">
          PRIME-first
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((it) => (
          <Link key={it.title} href={it.href} className="block transition-opacity hover:opacity-95 active:opacity-90">
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardIcon>
                    <it.icon className="h-5 w-5" />
                  </CardIcon>
                  <CardHeaderText>
                    <CardTitle>{it.title}</CardTitle>
                    <CardDescription>
                      {it.desc}
                    </CardDescription>
                  </CardHeaderText>
                </CardHeading>
              </CardHeader>
              {it.href === "/daily" ? (
                <CardContent>
                  Enter and save the day’s numbers. Store-aware, live scoreboard.
                </CardContent>
              ) : null}
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-panel/35 ring-1 ring-border/25 p-4">
        <div className="text-sm text-muted">
          Business cutoff: 4:00 AM America/New_York
        </div>
      </div>
    </div>
  );
}
