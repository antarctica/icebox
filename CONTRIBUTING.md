# Contributing to IceBox

Thank you for your interest in contributing to IceBox! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone git@github.com:<your-username>/icebox.git
   cd icebox
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run the linter and type checker before committing:
   ```bash
   npm run lint
   npm run build
   ```
4. Run tests:
   ```bash
   npm run test:run
   ```
5. Commit your changes with a clear, descriptive message
6. Push to your fork and open a pull request

## Pull Request Guidelines

- Keep pull requests focused — one feature or fix per PR
- Describe what your change does and why in the PR description
- Reference any related issues (e.g. `Closes #123`)
- Ensure all lint and type checks pass before requesting review
- New functionality should include appropriate tests

## Reporting Issues

When filing an issue, please include:

- A clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behaviour
- Browser and OS version

## Project Structure

```
src/
  components/   # Shared UI components
  db/           # IndexedDB schema and API layer (Dexie.js)
  pages/        # Route-level page components
  services/     # Import/export logic
  test/         # Test setup and utilities
```

## Coding Standards

- TypeScript strict mode is enabled — avoid `any`
- Follow existing code style; ESLint will flag violations
- Use Tailwind CSS utility classes for styling
- Keep components focused and composable

## Contact

For questions or discussions, please open a GitHub issue or contact the maintainers at the British Antarctic Survey.
