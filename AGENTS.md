<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Canonical data (always use)

| Domain | Files | Module | API |
|--------|--------|--------|-----|
| YKS müfredat | `data/yks-mufredat.json` | `@/lib/mufredat` | `/api/mufredat` |
| Üniversite lisans | `data/yok-atlas-lisans.json` | `@/lib/universities` | `/api/universities?level=lisans` |
| Üniversite önlisans | `data/yok-atlas-onlisans.json` | same | `/api/universities?level=onlisans` |

Do not add parallel müfredat or university constants elsewhere. Details: `.cursor/rules/data-sources.mdc`.
