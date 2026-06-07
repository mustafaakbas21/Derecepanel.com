"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { handleSectionClick } from "@/lib/marketing/smooth-scroll";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

const spring = { type: "spring" as const, stiffness: 420, damping: 28 };

type DemoScrollLinkProps = {
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  playIcon?: React.ReactNode;
  variant?: "button" | "text";
  href?: string;
};

export function DemoScrollLink({
  children,
  className,
  showArrow = false,
  playIcon,
  variant = "button",
  href = "#demo",
}: DemoScrollLinkProps) {
  const isText = variant === "text";

  return (
    <MotionLink
      href={href}
      onClick={(e) => handleSectionClick(e, href)}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98, y: 0 }}
      variants={{
        rest: { scale: 1, y: 0 },
        hover: { scale: isText ? 1.02 : 1.03, y: isText ? 0 : -1 },
      }}
      transition={spring}
      className={cn(
        "group relative inline-flex items-center justify-center",
        !isText && "overflow-hidden",
        className
      )}
    >
      {!isText && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          variants={{
            rest: { x: "-120%" },
            hover: { x: "120%" },
          }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        />
      )}
      {isText && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-1 left-0 h-px w-full origin-left bg-orange-500/60"
          variants={{
            rest: { scaleX: 0.35, opacity: 0.5 },
            hover: { scaleX: 1, opacity: 1 },
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      )}
      {playIcon}
      <span className="relative z-10">{children}</span>
      {showArrow && (
        <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </MotionLink>
  );
}

type PricingDemoButtonProps = {
  highlighted?: boolean;
  label: string;
  delay?: number;
  href?: string;
};

export function PricingDemoButton({
  highlighted,
  label,
  delay = 0,
  href = "#demo",
}: PricingDemoButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: delay + 0.15 }}
      className="w-full"
    >
      <MotionLink
        href={href}
        onClick={(e) => handleSectionClick(e, href)}
        initial="rest"
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.02 },
        }}
        transition={spring}
        className={cn(
          "group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-[14px] font-bold transition-colors",
          highlighted
            ? "bg-white text-slate-900 hover:bg-slate-100"
            : "bg-slate-900 text-white hover:bg-slate-800"
        )}
      >
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-transparent",
            highlighted ? "via-slate-900/10" : "via-white/20"
          )}
          variants={{
            rest: { x: "-120%" },
            hover: { x: "120%" },
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        <span className="relative z-10">{label}</span>
        <ArrowRight className="relative z-10 h-4 w-4 opacity-70 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
      </MotionLink>
    </motion.div>
  );
}
