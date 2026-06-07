"use client";

import katex from "katex";
import { memo, useMemo, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  latex: string;
  display?: boolean;
  className?: string;
};

export const OnyxMathSpan = memo(function OnyxMathSpan({
  latex,
  display = false,
  className,
}: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex.trim(), {
        throwOnError: false,
        displayMode: display,
        strict: "ignore",
        trust: false,
      });
    } catch {
      return latex;
    }
  }, [display, latex]);

  if (!html.includes("katex")) {
    return <span className={className}>{latex}</span>;
  }

  return (
    <span
      className={cn(
        display ? "onyx-katex-block my-2 block overflow-x-auto" : "onyx-katex-inline",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

/** Düz metindeki `$...$` ve `$$...$$` parçalarını KaTeX ile render eder. */
export function renderPlainTextWithMath(text: string): ReactNode[] {
  if (!text.includes("$")) return [text];

  const nodes: ReactNode[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const display = Boolean(match[1]);
    const latex = (match[1] ?? match[2] ?? "").trim();
    if (latex) {
      nodes.push(
        <OnyxMathSpan key={`math-${key++}`} latex={latex} display={display} />
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : [text];
}
