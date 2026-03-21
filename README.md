# SaveCounterStrike.com

Community-driven petition against Valve's poor anti-cheat in Counter-Strike 2.

## What is this?

A platform where the CS2 community can unite to demand better anti-cheat from Valve:

- **Petition** — Sign via Steam to add your voice
- **Video Wall** — Share clips of cheaters ruining the game
- **Community Opinions** — Discuss and vote on issues
- **Statistics** — Track cheating prevalence and VAC ban data
- **Revenue Tracker** — See how much CS2 earns while cheaters go unpunished

## Tech Stack

- Next.js 16 (App Router)
- PostgreSQL + Prisma
- Steam OpenID Authentication
- Tailwind CSS v4 + shadcn/ui
- Docker (multi-stage production build)

## Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

## Deployment

Automated via GitHub Actions → DockerHub → Watchtower.

```bash
# Production build
docker compose -f docker-compose.prod.yml up -d
```

## Contributing

This is a community project. Feel free to open issues and pull requests.

## License

MIT — see [LICENSE](LICENSE)
