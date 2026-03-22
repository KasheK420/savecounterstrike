# Contributing to SaveCounterStrike

Thanks for your interest in contributing! This project is community-driven and every contribution helps.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/savecounterstrike.git`
3. **Install** dependencies: `npm install`
4. **Set up** environment: `cp .env.example .env` and fill in values
5. **Run migrations**: `npx prisma migrate dev`
6. **Start dev server**: `npm run dev`

See [README.md](README.md) for detailed setup instructions.

## Development Workflow

1. Create a branch from `master`: `git checkout -b feat/your-feature`
2. Make your changes
3. Run checks:
   ```bash
   npm run lint     # ESLint
   npm run build    # Type checking + build
   npm test         # Tests
   ```
4. Commit with a clear message (see below)
5. Push and open a Pull Request

## Branch Naming

| Prefix | Use |
|--------|-----|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | Code refactoring |
| `ci/` | CI/CD changes |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add dark mode toggle
fix: prevent duplicate petition signatures
docs: update API documentation
refactor: simplify vote counting logic
```

- Use present tense ("add feature" not "added feature")
- Keep the subject line under 72 characters
- Reference issues when applicable: `fix: resolve XSS in comments (#42)`

**Note:** Commit prefixes drive automatic versioning — `feat:` bumps minor, `fix:` bumps patch, `BREAKING` bumps major. See [README](README.md#️-versioning).

## Code Style

- **TypeScript** — strict mode, no `any` where avoidable
- **ESLint** — run `npm run lint` before committing
- **Tailwind CSS v4** — utility-first, use existing `cs-*` custom classes
- **Components** — prefer server components, use `"use client"` only when needed
- **API routes** — validate input with Zod, check auth, rate-limit mutations
- **Prisma** — use the singleton from `src/lib/db.ts`

## Pull Request Guidelines

- Fill out the PR template
- Keep PRs focused — one feature or fix per PR
- Include screenshots for UI changes
- Make sure all checks pass (lint, build, tests)
- Link related issues

## Reporting Bugs

Use the [Bug Report](https://github.com/KasheK420/savecounterstrike/issues/new?template=bug_report.yml) template. Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS info
- Screenshots if applicable

## Requesting Features

Use the [Feature Request](https://github.com/KasheK420/savecounterstrike/issues/new?template=feature_request.yml) template.

## Security Issues

**Do NOT open public issues for security vulnerabilities.** See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
