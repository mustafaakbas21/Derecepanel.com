import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-amber-200/50 bg-amber-50/70 text-amber-900",
        high: "border-red-200/50 bg-red-100/70 text-red-900",
        medium: "border-amber-300/50 bg-amber-100/70 text-amber-900",
        low: "border-emerald-200/50 bg-emerald-100/70 text-emerald-900",
        accent: "border-amber-300/50 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-950",
        blue: "border-blue-200/50 bg-blue-100/70 text-blue-900",
        teal: "border-teal-200/50 bg-teal-100/70 text-teal-900",
        purple: "border-violet-200/50 bg-violet-100/70 text-violet-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
