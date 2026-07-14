# Contributing

Thanks for helping improve Vercel Analytics Digest. Bug reports, documentation
fixes, and focused pull requests are welcome.

## Before you start

- Search the existing issues and pull requests before opening a duplicate.
- For a substantial feature or behavior change, open an issue first so the
  approach can be discussed before implementation.
- Report security issues privately as described in [SECURITY.md](SECURITY.md).

## Local development

This project uses Node.js 24 and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The homepage can run without secrets. To exercise the report endpoint, fill in
the required values in `.env.local`. Never commit credentials or a file pulled
from Vercel.

Before submitting a change, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Pull requests

Keep changes focused, explain the user-visible effect, and include screenshots
for visual changes. Update the README or `.env.example` when configuration or
deployment behavior changes.

By contributing, you agree that your contributions will be licensed under the
project's [GNU General Public License v3.0](LICENSE).
