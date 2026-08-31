import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-[var(--radius)] border border-card-border bg-background px-4 py-3 text-base leading-relaxed outline-none focus:border-accent",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
