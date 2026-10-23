---
name: Project Development Rules
description: Core rules for development, package management, and building.
---

# Package Management

- **ALWAYS** use `pnpm` for all package management tasks (`install`, `add`, `remove`, etc.).
- **NEVER** use `npm` or `yarn`.
- If you see `package-lock.json` or `yarn.lock`, remove them and generate a `pnpm-lock.yaml`.

# Versioning System (SemVer Starting at 1.0.0)

- **EVERY** code update, bug fix, or feature change MUST increment the sub-sub (patch) version (`1.0.0` -> `1.0.1` -> `1.0.2`, etc.) using:
  ```bash
  node scripts/version.cjs patch "Brief description of the update"
  ```
- This automatically updates `package.json` (which propagates to Vite's `__APP_VERSION__`, the Settings modal `Versions` badge, the Electron System Tray, and `electron-builder` installer filenames) and records the release entry in `CHANGELOG.md`.

# Building and Deployment

- **ALWAYS** perform a thorough codebase review and run all available tests (e.g., `pnpm run lint`, `pnpm run test`) before executing any build command (`pnpm run build` or `pnpm run dist`).
- Do not build a production artifact if failing tests or unhandled lint errors are present.
