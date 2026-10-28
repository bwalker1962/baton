# Baton

Human judgment at scale. Baton is RidgeFront's app for running marketing across many client companies, with a sign-off gate nothing gets past and AI skills that learn from your decisions.

This is the **clickable prototype**: a working Next.js app on sample data. Nothing connects to real services yet.

- What exists and what's next: [docs/SPEC.md](docs/SPEC.md) (progressive spec, updated with every build)
- Full product rationale: [Baton product spec](https://claude.ai/artifact/27uECpZbob18PojSbdTx9E)

## Run it

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Where things are

| Path | What it is |
| --- | --- |
| `src/app/` | Screens (one folder per route) |
| `src/components/` | App shell, icons, badges and chips |
| `src/lib/data.ts` | Sample clients, departments, tasks, sign-off items, skills |
| `src/lib/templates.ts` | Project templates and their suggested checklists |
| `src/lib/store.tsx` | Prototype state: appearance, sign-off decisions, undo, projects |
| `src/app/globals.css` | Design tokens for the three modes |

## License

© 2026 RidgeFront. All rights reserved. Proprietary; see [LICENSE](LICENSE).
