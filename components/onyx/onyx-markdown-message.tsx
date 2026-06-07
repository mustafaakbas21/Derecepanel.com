"use client";

import { Children, cloneElement, isValidElement, memo, useMemo } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { OnyxMathSpan, renderPlainTextWithMath } from "@/components/onyx/onyx-math-span";
import { normalizeOnyxMarkdownMath } from "@/lib/onyx/markdown-math-normalize";
import { cn } from "@/lib/utils";

export type OnyxMarkdownVariant = "default" | "dark" | "emerald" | "orange" | "compact";

const VARIANT_CLASS: Record<OnyxMarkdownVariant, string> = {
  default:
    "prose-slate prose-p:text-slate-800 prose-strong:text-slate-900 prose-li:text-slate-800",
  dark: "onyx-markdown--dark prose-invert prose-p:text-white prose-strong:text-white prose-li:text-white prose-headings:text-white prose-headings:border-white/20",
  emerald:
    "onyx-markdown--emerald prose-p:text-emerald-950 prose-strong:text-emerald-950 prose-li:text-emerald-950",
  orange:
    "onyx-markdown--orange prose-p:text-orange-950 prose-strong:text-orange-950 prose-li:text-orange-950",
  compact: "prose-sm prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1",
};

const BASE_CLASS =
  "onyx-markdown prose max-w-none w-full text-sm md:text-base prose-p:leading-relaxed prose-headings:font-semibold prose-headings:border-b prose-headings:border-slate-200 prose-headings:pb-2 prose-h1:text-slate-900 prose-h2:text-slate-800 prose-li:marker:text-amber-600 prose-a:text-slate-700 prose-a:underline prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-table:overflow-x-auto prose-table:rounded-lg prose-table:border prose-table:border-slate-200 prose-thead:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:uppercase prose-th:tracking-wide prose-th:text-slate-600 prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2.5 prose-td:text-slate-700 [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto";

function withInlineMath(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderPlainTextWithMath(child);
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      return cloneElement(child, {
        ...child.props,
        children: withInlineMath(child.props.children),
      });
    }
    return child;
  });
}

function makeMarkdownComponents(variant: OnyxMarkdownVariant) {
  const wrapText = (Tag: "p" | "li" | "span" | "strong") =>
    function Wrapped({ children, ...props }: { children?: ReactNode }) {
      return <Tag {...props}>{withInlineMath(children)}</Tag>;
    };

  return {
    p: wrapText("p"),
    li: wrapText("li"),
    strong: wrapText("strong"),
    code: ({
      className,
      children,
      ...props
    }: {
      className?: string;
      children?: ReactNode;
    }) => {
      const classes = className ?? "";
      const isMath =
        classes.includes("math-inline") ||
        classes.includes("math-display") ||
        classes.includes("language-math");

      if (isMath) {
        const latex = String(children ?? "").replace(/\n$/, "");
        return (
          <OnyxMathSpan
            latex={latex}
            display={classes.includes("math-display")}
            className={variant === "dark" ? "text-white" : undefined}
          />
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };
}

export const OnyxMarkdownMessage = memo(function OnyxMarkdownMessage({
  content,
  variant = "default",
  className,
}: {
  content: string;
  variant?: OnyxMarkdownVariant;
  className?: string;
}) {
  const normalized = useMemo(
    () => normalizeOnyxMarkdownMath(content),
    [content]
  );
  const components = useMemo(() => makeMarkdownComponents(variant), [variant]);

  return (
    <div className={cn(BASE_CLASS, VARIANT_CLASS[variant], className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
});

/** Düz metin + `$...$` — liste maddeleri ve kısa açıklamalar için. */
export const OnyxMathText = memo(function OnyxMathText({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <span className={cn("leading-relaxed", className)}>
      {renderPlainTextWithMath(normalizeOnyxMarkdownMath(content))}
    </span>
  );
});
