export const STORE_COLORS: Record<string, {
  accent: string;
  dot: string;
  border: string;
  borderActive: string;
  bg: string;
  bgActive: string;
  text: string;
  glow: string;
  ring: string;
}> = {
  kent: {
    accent: "bg-orange-500",
    dot: "bg-orange-500",
    border: "border-orange-500/30",
    borderActive: "border-orange-500/50",
    bg: "bg-orange-500/5",
    bgActive: "bg-orange-500/15",
    text: "text-orange-400",
    glow: "shadow-[0_0_10px_rgba(249,115,22,0.15)]",
    ring: "ring-orange-500/30",
  },
  aurora: {
    accent: "bg-amber-500",
    dot: "bg-amber-500",
    border: "border-amber-500/30",
    borderActive: "border-amber-500/50",
    bg: "bg-amber-500/5",
    bgActive: "bg-amber-500/15",
    text: "text-amber-400",
    glow: "shadow-[0_0_10px_rgba(245,158,11,0.15)]",
    ring: "ring-amber-500/30",
  },
  lindseys: {
    accent: "bg-emerald-500",
    dot: "bg-emerald-500",
    border: "border-emerald-500/30",
    borderActive: "border-emerald-500/50",
    bg: "bg-emerald-500/5",
    bgActive: "bg-emerald-500/15",
    text: "text-emerald-400",
    glow: "shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    ring: "ring-emerald-500/30",
  },
};

export function getStoreColor(slug: string) {
  return STORE_COLORS[slug] || {
    accent: "bg-muted",
    dot: "bg-muted",
    border: "border-border/50",
    borderActive: "border-brand/50",
    bg: "bg-black/20",
    bgActive: "bg-brand/15",
    text: "text-muted",
    glow: "",
    ring: "",
  };
}
