"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export const RadioGroup = RadioGroupPrimitive.Root;

export function RadioItem({
  value,
  id,
  className,
}: {
  value: string;
  id: string;
  className?: string;
}) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      id={id}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-card-border data-[state=checked]:border-accent",
        className
      )}
    >
      <RadioGroupPrimitive.Indicator className="h-2.5 w-2.5 rounded-full bg-accent" />
    </RadioGroupPrimitive.Item>
  );
}
