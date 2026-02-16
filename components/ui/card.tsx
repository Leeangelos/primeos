import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 ring-1 ring-brand/20 transition-all duration-200",
        "shadow-[0_0_0_1px_rgba(51,65,85,0.2),0_4px_24px_rgba(0,0,0,0.18),0_0_40px_rgba(249,115,22,0.06)]",
        "hover:ring-brand/40 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.2),0_4px_24px_rgba(0,0,0,0.18),0_0_48px_rgba(249,115,22,0.12)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function CardIcon({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "h-9 w-9 shrink-0 rounded-2xl bg-brand/10 ring-1 ring-brand/20 grid place-items-center text-brand",
        className
      )}
      {...props}
    />
  );
}

export function CardHeading({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start gap-3", className)} {...props} />;
}

export function CardHeaderText({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-base font-semibold", className)} {...props} />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-muted", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm", className)} {...props} />;
}
