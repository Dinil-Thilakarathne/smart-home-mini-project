# Smart Home Monitoring and Control System

Turborepo monorepo for the SCS 3311 mobile application mini-project.

For complete first-time and daily setup instructions, see [Local Development Setup](./LOCAL_DEVELOPMENT.md).

## Workspace

- `apps/mobile` — Expo mobile application
- `apps/simulator` — Next.js hardware simulator
- `apps/functions` — Firebase Cloud Functions
- `packages/shared` — shared domain contracts
- `docs` — project specification and technical documentation

## Requirements

- Node.js 22
- pnpm 10.24.0
- Firebase CLI (required for emulators and deployment)

## Development

```bash
nvm use
corepack enable
pnpm install
```

Run the mobile app, simulator, and Firebase emulators together:

```bash
pnpm dev
```

Run one application:

```bash
pnpm dev:mobile
pnpm dev:simulator
```

Run Firebase emulators:

```bash
cp .firebaserc.example .firebaserc
pnpm dev:firebase
```

Before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm build
```
