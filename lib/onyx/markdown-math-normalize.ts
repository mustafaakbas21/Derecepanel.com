/** AI çıktısındaki LaTeX sınırlayıcılarını remark-math / KaTeX ile uyumlu hale getirir. */
export function normalizeOnyxMarkdownMath(content: string): string {
  if (!content.trim()) return content;

  let s = content.replace(/\uFF04/g, "$");
  s = s.replace(/\\\$/g, "$");
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner.trim()}$`);
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$\n${inner.trim()}\n$$`);
  s = s.replace(/\$([^$\n]+?)\$/g, (_, inner) => `$${inner.trim()}$`);
  return s;
}
