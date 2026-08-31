"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <ProgressPrimitive.Root
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-black/5", className)}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-accent transition-transform duration-150"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
