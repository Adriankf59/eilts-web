import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-card-border bg-background shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}
