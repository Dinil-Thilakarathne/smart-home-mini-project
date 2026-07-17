# Local Development Setup

This guide takes a teammate from a fresh clone to running the mobile app, hardware simulator, and Firebase services locally.

## 1. What runs locally

| Workspace | Technology | Purpose | Local address |
| --- | --- | --- | --- |
| `apps/mobile` | Expo / React Native | Smart-home mobile app | Expo development server and QR code |
| `apps/simulator` | Next.js | Simulated smart-home hardware | `http://localhost:3000` |
| `apps/functions` | Firebase Functions | Server-side automation | `http://localhost:5001` |
| Firestore emulator | Firebase Emulator Suite | Local database | `http://localhost:8080` |
| Emulator UI | Firebase Emulator Suite | Inspect local Firebase data and functions | `http://localhost:4000` |
| `packages/shared` | TypeScript | Types shared by all applications | Imported by the apps |

The repository uses Turborepo to coordinate these workspaces and pnpm to install their dependencies from one lockfile.

## 2. Prerequisites

Install the following before cloning the repository:

- Git
- Node.js 22; using [nvm](https://github.com/nvm-sh/nvm) is recommended
- Java JDK 11 or newer for the Firebase emulators
- [Expo Go](https://expo.dev/go) on an Android or iOS phone, or a configured Android/iOS simulator
- Access to the team's Firebase project if you need to use or deploy shared Firebase resources

The repository pins pnpm `10.24.0` through Corepack, so a separate global pnpm installation is unnecessary.

## 3. Clone and install

Replace the placeholder with this repository's Git URL:

```bash
git clone <repository-url>
cd mad-mini-project
nvm install
nvm use
corepack enable
pnpm install --frozen-lockfile
```

Confirm the important tools are available:

```bash
node --version
pnpm --version
java -version
```

Expected Node and pnpm versions are `22.x` and `10.24.0` respectively.

## 4. Select the Firebase project

The Firebase CLI is already included as a development dependency. Do not install another copy globally.

Sign in and select the Firebase project:

```bash
pnpm exec firebase login
pnpm exec firebase use --add
pnpm exec firebase use
```

When `firebase use --add` asks for an alias, use `default`. This creates or updates `.firebaserc` with the selected project ID. The file contains project configuration, not a password, but each teammate still needs to be granted access to the Firebase project by its owner.

For emulator-only work without access to the shared project, create the local configuration from the example:

```bash
cp .firebaserc.example .firebaserc
```

Then replace `your-firebase-project-id` with the agreed development project ID. Never commit service-account JSON files, private keys, or personal credentials.

## 5. Start the project

### Recommended: separate terminals

Separate terminals make logs easier to understand, especially while learning the stack.

Terminal 1 — Firebase emulators:

```bash
pnpm dev:firebase
```

Terminal 2 — hardware simulator:

```bash
pnpm dev:simulator
```

Terminal 3 — mobile app:

```bash
pnpm dev:mobile
```

Open `http://localhost:3000` for the simulator and `http://localhost:4000` for the Firebase Emulator UI. For the mobile app, scan Expo's QR code with Expo Go. Keep the computer and phone on the same Wi-Fi network.

### Alternative: start workspace development tasks together

```bash
pnpm dev
```

This starts each workspace's `dev` task through Turborepo. Running the three commands separately remains the clearest option when debugging.

Press `Ctrl+C` in each terminal to stop the development services.

## 6. Firebase development status

There are two distinct environments:

- **Local emulators:** disposable local data, recommended for development and testing.
- **Shared Firebase project:** real cloud data and deployed functions, used only when the team intentionally needs shared integration testing.

The Firebase emulator configuration exists, but each client must also connect its Firebase SDK to the emulators before its reads and writes become local. Until that integration is present, verify the target environment before creating data.

The current `firestore.rules` intentionally denies all client reads and writes until the authentication and security model is implemented. Firebase Console and trusted Admin SDK operations behave differently from client SDK requests, so a successful Console write does not prove that the mobile or simulator client can write.

Do not deploy rules, indexes, or functions unless the team has agreed to change the shared Firebase project.

## 7. Normal daily workflow

Update your local branch and create a small feature branch:

```bash
git switch main
git pull
git switch -c feature/<short-feature-name>
```

Install dependencies if `pnpm-lock.yaml` changed, then start the services you need:

```bash
pnpm install --frozen-lockfile
pnpm dev:firebase
pnpm dev:simulator
pnpm dev:mobile
```

Commit source changes together with any intentional `package.json` and `pnpm-lock.yaml` changes. Do not commit `.env` files, credentials, generated builds, or emulator data.

## 8. Adding dependencies

Run dependency commands from the repository root and target the correct workspace:

```bash
pnpm --filter @smart-home/mobile add <package>
pnpm --filter @smart-home/simulator add <package>
pnpm --filter @smart-home/functions add <package>
```

Use `-D` after `add` for a development-only dependency. Do not use `npm install` inside an app because the monorepo uses one pnpm lockfile.

## 9. Validate before opening a pull request

From the repository root, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Some workspaces may not have tests yet; Turborepo will report which test tasks exist. A change is ready for review when the relevant apps start, the validation commands pass, and no credentials or unrelated generated files appear in `git status`.

## 10. Troubleshooting

### Firebase emulators require Java

If the emulator command reports that Java is missing, install JDK 11 or newer, reopen the terminal, and confirm `java -version` works.

### A port is already in use

Check which program owns the port:

```bash
lsof -i :3000
lsof -i :4000
lsof -i :5001
lsof -i :8080
```

Stop the older development process, then rerun the relevant command. Avoid changing the shared ports in `firebase.json` without coordinating with the team.

### Expo cannot connect to the phone

First confirm that the phone and computer are on the same Wi-Fi and that no VPN or firewall is blocking the connection. If LAN discovery still fails, try Expo's tunnel mode:

```bash
pnpm --filter @smart-home/mobile exec expo start --tunnel
```

### Firebase uses the wrong project

Inspect the active selection:

```bash
pnpm exec firebase use
```

Then run `pnpm exec firebase use --add` again and select the correct project with the `default` alias.

### Dependency versions differ between teammates

Run `nvm use`, enable Corepack, and reinstall exactly from the committed lockfile:

```bash
nvm use
corepack enable
pnpm install --frozen-lockfile
```

## Setup complete checklist

- [ ] Node reports version 22.x
- [ ] pnpm reports version 10.24.0
- [ ] Java is available
- [ ] `pnpm install --frozen-lockfile` succeeds
- [ ] Firebase Emulator UI opens at `http://localhost:4000`
- [ ] Hardware simulator opens at `http://localhost:3000`
- [ ] Mobile app opens through Expo Go or a device simulator
- [ ] `pnpm lint` and `pnpm typecheck` pass

