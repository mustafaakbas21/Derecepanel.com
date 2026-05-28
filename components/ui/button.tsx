import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8956a]/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#5c4a3a] text-white shadow-md shadow-[#5c4a3a]/20 hover:bg-[#3e2c1f]",
        accent:
          "bg-[#b8956a] text-[#2d2520] shadow-sm hover:bg-[#c9a67a]",
        outline:
          "border border-[#e8ded2] bg-white text-[#5c4a3a] hover:bg-[#f5f1ed]",
        ghost: "text-[#5c4a3a] hover:bg-[#f5f1ed]",
        secondary: "bg-[#ebe4da] text-[#2d2520] hover:bg-[#e8ded2]",
      },
      size: {
        default: "h-12 px-5 py-2.5 text-[15px]",
        sm: "h-10 rounded-xl px-4 text-[14px]",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
