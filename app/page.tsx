import { Flame, LineChart, ClipboardList, Shield } from "lucide-react";
import { Card, CardHeader, CardHeading, CardIcon, CardHeaderText, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const items = [
  {
    icon: ClipboardList,
    title: "Daily KPI Entry",
    desc: "Manual entry, PRIME-first hierarchy, SLPH core metric.",
  },
  {
    icon: LineChart,
    title: "Weekly Rollups",
    desc: "Mon–Sun with 4AM cutoff, trends + charts.",
  },
  {
    icon: Shield,
    title: "RBAC + Audit",
    desc: "Admin / Manager / Viewer, audit log, controlled access.",
  },
  {
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
          <h1 className="text-2xl font-semibold">UI Foundation is live</h1>
          <p className="mt-1 text-sm text-muted">
            Next: component kit + page structure (Daily Entry, Weekly, Targets).
          </p>
        </div>
        <div className="rounded-2xl bg-brand/10 px-3 py-2 text-sm text-brand ring-1 ring-brand/20">
          PRIME-first
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardHeading>
              <CardIcon>
                <ClipboardList className="h-5 w-5" />
              </CardIcon>
              <CardHeaderText>
                <CardTitle>Daily KPI Entry</CardTitle>
                <CardDescription>
                  Manual entry, PRIME-first hierarchy, SLPH core metric.
                </CardDescription>
              </CardHeaderText>
            </CardHeading>
          </CardHeader>
          <CardContent>
            Foundation primitive test.
          </CardContent>
        </Card>
        {items.slice(1).map((it) => (
          <Card key={it.title}>
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
          </Card>
        ))}
      </div>

      <div className="rounded-2xl bg-panel/35 ring-1 ring-border/25 p-4">
        <div className="text-sm text-muted">
          Phase 4 checkpoint: Theme tokens, app shell, icon set, and a consistent glass dark surface.
        </div>
      </div>
    </div>
  );
}
