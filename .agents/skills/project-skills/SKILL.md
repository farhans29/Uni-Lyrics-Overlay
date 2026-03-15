---
name: Project Development Rules
description: Core rules for development, package management, and building.
---

# Package Management

- **ALWAYS** use `pnpm` for all package management tasks (`install`, `add`, `remove`, etc.).
- **NEVER** use `npm` or `yarn`.
- If you see `package-lock.json` or `yarn.lock`, remove them and generate a `pnpm-lock.yaml`.

# Building and Deployment

- **ALWAYS** perform a thorough codebase review and run all available tests (e.g., `pnpm run lint`, `pnpm run test`) before executing any build command (`pnpm run build`).
- Do not build a production artifact if failing tests or unhandled lint errors are present.
