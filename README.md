# VLSM Calculator

[![CI](https://github.com/safesploitOrg/vlsm-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/safesploitOrg/vlsm-calculator/actions/workflows/ci.yml)
[![Deploy static content to Pages](https://github.com/safesploitOrg/vlsm-calculator/actions/workflows/deploy.yml/badge.svg)](https://github.com/safesploitOrg/vlsm-calculator/actions/workflows/deploy.yml)

A static, browser-based IPv4 subnet planner. Provide a parent CIDR block and host requirements; the calculator creates a largest-first VLSM allocation without overlaps or parent-network overflow.

## Current features

- Parent CIDR parsing and network-boundary normalisation
- Largest-first allocation using traditional IPv4 subnet semantics (`/30` minimum)
- Parent-range and IPv4 overflow protection
- Accessible validation and allocation feedback
- Selectable output columns and spreadsheet-friendly semantic tables
- Allocation totals and address-space utilisation
- Clipboard, CSV and native two-worksheet `.xlsx` exports
- Browser storage that retains form content for 90 days
- Confirmed reset that clears the current form and saved browser data
- Spreadsheet-formula injection protection for exported user input
- Pure ES-module calculation code with Node unit tests

All calculations and exports are created locally in the browser. No plan data is transmitted anywhere.

## Run locally

The deployable site lives in `public/`. Serve the repository root and open the forwarded root page:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000/>.

No runtime installation or build step is required. Opening `public/index.html` directly also works in browsers that permit local ES modules; a local HTTP server is more reliable.

## Test

Node.js 24 LTS is required for development tooling. The browser application has no runtime dependencies; ESLint is installed as a locked development dependency.

```bash
nvm use
npm ci
npm run check
```

The individual quality gates are:

```bash
npm run lint
npm run test:coverage
npm run check:static
```

Coverage must remain at or above 90% of lines, 80% of branches, and 90% of functions.

## Continuous integration and deployment

The `CI` workflow runs for pull requests and pushes targeting `main`. It installs the lock file with lifecycle scripts disabled, lints JavaScript, runs unit tests with coverage thresholds, validates static assets and module references, audits dependencies, and retains the validated `public/` directory for 30 days.

After a successful `CI` push run on `main`, the Pages workflow checks out that exact commit, repeats the quality and audit gates, packages only `public/`, deploys through the protected `github-pages` environment, and verifies the published URL. Manual deployment is permitted only when the workflow is dispatched from `main`.

Repository setup required in GitHub:

1. In **Settings → Pages**, set the source to **GitHub Actions** and configure the custom domain if required.
2. Protect `main` with a ruleset or branch-protection rule requiring the **Lint, test, and validate** status check.
3. Optionally add required reviewers to the `github-pages` environment for deployment approval.

For rollback, revert the unwanted commit on `main`. The revert must pass CI before it is automatically redeployed. Validated site artifacts are retained for 30 days for comparison and recovery analysis.

## Project layout

```text
public/
├── index.html
└── assets/
    ├── css/
    └── js/
        ├── core/       # Pure IPv4, CIDR, validation and allocation logic
        ├── export/     # CSV and spreadsheet generation
        ├── ui/         # Form, message and table rendering
        └── app.js      # Browser workflow orchestration
tests/unit/             # Node unit tests
.github/workflows/      # CI and GitHub Pages deployment
_legacy/                # Unused pre-refactor scripts and styles
ARCHITECTURE.md         # Target design and roadmap
```

Spreadsheet downloads are generated as native OOXML `.xlsx` workbooks with `VLSM Plan` and `Summary` worksheets. The small ZIP and worksheet writer is included in the application, so export still requires no runtime dependency.

## Credits

Maintained by [safesploitOrg](https://github.com/safesploitOrg). Based on the original table generator by [JCPedroza](https://github.com/JCPedroza/vlsm-table-generator).
