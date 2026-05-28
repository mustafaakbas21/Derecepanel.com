import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-amber-200/40 bg-white/60 px-5 py-3 text-sm font-medium text-amber-950 shadow-sm backdrop-blur-sm transition-all duration-300 placeholder:text-amber-800/40 focus-visible:outline-none focus-visible:border-amber-400/60 focus-visible:shadow-lg focus-visible:shadow-amber-900/10 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
