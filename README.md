<div align="center">

# 🛡️ SaveCounterStrike.com

### The community's open letter to Valve demanding better anti-cheat for CS2.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/KasheK420/savecounterstrike/deploy.yml?branch=master&label=build)](https://github.com/KasheK420/savecounterstrike/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsavecounterstrike.com&label=savecounterstrike.com)](https://savecounterstrike.com)

[**Visit the Site**](https://savecounterstrike.com) · [**Sign the Petition**](https://savecounterstrike.com/petition) · [**Report a Bug**](https://github.com/KasheK420/savecounterstrike/issues/new?template=bug_report.yml) · [**Request a Feature**](https://github.com/KasheK420/savecounterstrike/issues/new?template=feature_request.yml)

</div>

---

## 📋 What is this?

A platform where the CS2 community unites to demand better anti-cheat from Valve. Every signature goes into an **open letter** delivered to Valve on **August 31, 2026**.

### Features

🖊️ **Petition** — Sign via Steam, your account is your signature
🎬 **Media Wall** — Share clips & screenshots of cheaters ruining the game
💬 **Community Opinions** — Discuss issues, vote, comment — Reddit-style
📊 **Statistics** — Track cheating prevalence and VAC ban data
💰 **Revenue Tracker** — Real-time estimate of how much CS2 earns daily
📰 **Blog** — Articles and updates about the movement
📬 **Contact** — Reach the team directly

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) |
| **Auth** | Steam OpenID 2.0 via [NextAuth v5](https://authjs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Editor** | [Tiptap](https://tiptap.dev/) rich text editor |
| **Email** | [Nodemailer](https://nodemailer.com/) (Proton Mail SMTP) |
| **Deployment** | Docker → GitHub Actions → DockerHub → Watchtower |
| **Proxy** | Cloudflare Tunnel → Nginx Proxy Manager |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [PostgreSQL](https://www.postgresql.org/) 15+
- [Steam API Key](https://steamcommunity.com/dev/apikey)

### Setup

```bash
# Clone the repository
git clone https://github.com/KasheK420/savecounterstrike.git
cd savecounterstrike

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (database URL, Steam API key, etc.)

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start the dev server
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (includes type checking) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |

## 🏷️ Versioning

This project uses **automatic semantic versioning** on every push to `master`:

| Commit prefix | Bump | Example |
|--------------|------|---------|
| `BREAKING` / `BREAKING CHANGE` | **Major** | `1.0.0` → `2.0.0` |
| `feat:` | **Minor** | `1.0.0` → `1.1.0` |
| `fix:`, `docs:`, `refactor:`, etc. | **Patch** | `1.0.0` → `1.0.1` |

The current version and git commit SHA are displayed in the site footer.

## 📁 Project Structure

```
src/
├── app/
│   ├── (admin)/        # Admin panel (protected)
│   ├── (public)/       # Public pages (petition, opinions, stats, etc.)
│   └── api/            # API routes
├── components/
│   ├── auth/           # Session provider, Steam login
│   ├── hero/           # Hero sections, counters
│   ├── petition/       # Petition, signatures, notable signers
│   ├── opinions/       # Opinion cards, voting, comments
│   ├── revenue/        # Revenue tracker breakdown
│   └── shared/         # Reusable components
├── lib/
│   ├── auth.ts         # NextAuth config (JWT sessions)
│   ├── db.ts           # Prisma singleton
│   ├── steam.ts        # Steam OpenID 2.0 utilities
│   ├── mask.ts         # Privacy masking (server-only)
│   ├── rate-limit.ts   # IP-based rate limiting
│   └── validations.ts  # Zod schemas
└── proxy.ts            # Edge middleware (security headers)
```

## 🤝 Contributing

We welcome contributions from the community! See [**CONTRIBUTING.md**](CONTRIBUTING.md) for guidelines on:

- Setting up the development environment
- Code style and conventions
- Submitting pull requests
- Reporting bugs

## 🔒 Security

Found a vulnerability? **Do NOT open a public issue.** Please read our [**Security Policy**](SECURITY.md) and report responsibly via email.

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

Created by [**Lukáš Majoros**](https://github.com/KasheK420) ([@KasheK420](https://github.com/KasheK420))

[Website](https://savecounterstrike.com) · [GitHub](https://github.com/KasheK420/savecounterstrike) · [Discord](https://discord.gg/savecounterstrike)

**If you believe CS2 deserves better anti-cheat, [sign the petition](https://savecounterstrike.com/petition).**

</div>
