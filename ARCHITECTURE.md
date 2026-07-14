# VLSM Calculator Architecture

## 1. Overview

The VLSM Calculator is a browser-based IPv4 subnet-planning application that generates Variable Length Subnet Masking (VLSM) allocation tables from a parent network and a set of host requirements.

The application is designed as a lightweight static web application:

- No application server
- No database
- No user authentication
- No persistent backend state
- No runtime package dependency requirement
- All calculations performed locally in the browser

The project prioritises:

- Correct IPv4 subnet allocation
- Simple deployment to static hosting
- Portability between hosting platforms
- Spreadsheet-friendly output
- Clear separation between calculation logic and presentation
- Automated testing and deployment

---

## 2. Key User Workflows

### 2.1 Generate a VLSM allocation plan

A user provides:

1. A parent IPv4 network and prefix
2. One or more subnet names
3. The number of required hosts for each subnet
4. The output columns to display

The calculator then:

1. Validates the parent network and host requirements
2. Sorts subnet requests from largest to smallest
3. Calculates the smallest valid subnet for each request
4. Allocates each subnet on a valid network boundary
5. Confirms that all allocations remain inside the parent network
6. Displays the completed allocation table

### 2.2 Copy output into a spreadsheet

The generated table must remain directly selectable and copyable so that users can paste it into spreadsheet software without losing the tabular structure.

This is an existing strength of the application and must be preserved during refactoring.

The rendered table should therefore:

- Use semantic HTML table elements
- Avoid decorative characters inside data cells
- Keep one value per table cell
- Avoid merged cells in the data body
- Preserve predictable column ordering
- Remain copy-and-paste friendly in Excel, LibreOffice Calc and Google Sheets

### 2.3 Download the allocation as a spreadsheet

The application will provide a **Download Spreadsheet** button.

The initial implementation should export a standards-compatible spreadsheet file generated entirely in the browser.

Preferred formats:

1. `.xlsx` for the primary download experience
2. `.csv` as an optional lightweight export

The exported workbook should contain:

- Parent network details
- Allocation summary
- Generated subnet table
- Generation timestamp
- Application version

Suggested workbook structure:

| Worksheet | Purpose |
|---|---|
| `VLSM Plan` | Main subnet allocation table |
| `Summary` | Parent network, totals and capacity information |

The export feature must not replace the existing copy-and-paste workflow. Both should remain available.

---

## 3. Current Architecture

The current application is a static HTML, CSS and JavaScript project.

```text
Repository root
├── index.html
├── styles/
├── scripts/
├── CIDR-TABLE.md
├── README.md
└── other static assets
```

### 3.1 Runtime model

```text
User browser
    ↓
Static HTML/CSS/JavaScript
    ↓
Client-side IPv4 calculations
    ↓
Rendered HTML table
```

All application logic executes within the user's browser.

### 3.2 Current JavaScript organisation

The current code separates concerns across multiple JavaScript files, including:

- Input validation
- IPv4 address operations
- VLSM allocation
- Form value extraction
- Button event handling
- Table templates

The scripts communicate through a shared global namespace.

This approach is functional for a small application, but the target design will move towards ES modules and pure, independently testable functions.

### 3.3 Current architectural limitations

Known limitations include:

- The supplied parent prefix is not fully enforced during allocation
- Parent-network overflow is not reliably detected
- A starting host address may not be normalised to the parent network boundary
- Validation is not consistently integrated into the main workflow
- Calculation logic is coupled to browser DOM operations
- Automated unit tests are absent
- No CI validation pipeline currently protects the main branch
- Static deployment is not yet represented as an automated workflow
- Spreadsheet download is not currently available

---

## 4. Target Repository Structure

The repository will be restructured so that deployable web content is contained within `/public`.

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── public/
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   ├── icons/
│   │   ├── images/
│   │   └── js/
│   │       ├── app.js
│   │       ├── core/
│   │       │   ├── ipv4.js
│   │       │   ├── cidr.js
│   │       │   ├── allocator.js
│   │       │   └── validation.js
│   │       ├── export/
│   │       │   ├── csv-export.js
│   │       │   └── spreadsheet-export.js
│   │       └── ui/
│   │           ├── form.js
│   │           ├── table.js
│   │           ├── messages.js
│   │           └── controls.js
│
├── tests/
│   ├── unit/
│   │   ├── ipv4.test.js
│   │   ├── cidr.test.js
│   │   ├── allocator.test.js
│   │   └── validation.test.js
│   └── integration/
│       └── application.test.js
│
├── scripts/
│   └── validate-static-site.sh
│
├── ARCHITECTURE.md
├── README.md
├── LICENSE
├── package.json
└── package-lock.json
```

### 4.1 Directory responsibilities

| Path                      | Responsibility                          |
|---------------------------|-----------------------------------------|
| `/public`                 | Deployable static application |
| `/public/assets/js/core`  | Pure calculation and validation logic |
| `/public/assets/js/ui`    | DOM rendering and user interaction |
| `/public/assets/js/export` | CSV and spreadsheet generation |
| `/tests/unit`             | Deterministic tests for calculation functions |
| `/tests/integration`      | Browser or DOM-level workflow tests |
| `/.github/workflows`      | CI and deployment automation |
| `/scripts`                | Repository validation and maintenance scripts |

---

## 5. Target Application Architecture

The target design separates the application into four logical layers.

```text
┌──────────────────────────────────────────────┐
│ Presentation Layer                           │
│ Forms, controls, messages and HTML tables    │
├──────────────────────────────────────────────┤
│ Application Layer                            │
│ Workflow orchestration and user actions      │
├──────────────────────────────────────────────┤
│ Domain Layer                                 │
│ IPv4, CIDR and VLSM allocation logic         │
├──────────────────────────────────────────────┤
│ Export Layer                                 │
│ Clipboard, CSV and spreadsheet generation    │
└──────────────────────────────────────────────┘
```

### 5.1 Presentation layer

Responsibilities:

- Read user input
- Display validation messages
- Render the allocation table
- Preserve spreadsheet-friendly table structure
- Trigger copy and download actions
- Provide accessible status updates

The presentation layer must not contain subnet-calculation rules.

### 5.2 Application layer

Responsibilities:

- Coordinate form submission
- Call validation functions
- Pass validated values to the allocation engine
- Pass allocation results to the table renderer
- Coordinate spreadsheet and CSV downloads

Example workflow:

```text
Submit form
    ↓
Parse input
    ↓
Validate request
    ↓
Allocate subnets
    ↓
Render results
    ↓
Enable copy/download actions
```

### 5.3 Domain layer

The domain layer contains pure functions for:

- IPv4 string-to-integer conversion
- Integer-to-IPv4 conversion
- Prefix and subnet-mask conversion
- Parent network calculation
- Broadcast address calculation
- Usable host calculations
- Subnet size calculation
- Network-boundary alignment
- VLSM allocation
- Overlap detection
- Parent-range enforcement

The domain layer should not reference:

- `document`
- `window`
- HTML elements
- Browser events
- File download APIs

This separation allows the calculation engine to be unit tested independently from the UI.

### 5.4 Export layer

Responsibilities:

- Convert allocation results into tabular export data
- Generate `.xlsx` workbooks
- Generate optional `.csv` files
- Apply safe spreadsheet formatting
- Preserve exact IPv4 values as text where appropriate

The export layer should consume the same structured allocation result used by the HTML renderer.

This avoids maintaining separate calculation paths for the web table and downloaded spreadsheet.

---

## 6. Domain Model

### 6.1 Allocation request

```javascript
{
  parentCidr: "172.16.0.0/24",
  subnets: [
    {
      name: "Management",
      requiredHosts: 50
    },
    {
      name: "Servers",
      requiredHosts: 30
    }
  ]
}
```

### 6.2 Allocation result

```javascript
{
  parent: {
    cidr: "172.16.0.0/24",
    network: "172.16.0.0",
    broadcast: "172.16.0.255",
    totalAddresses: 256
  },
  summary: {
    requestedHosts: 80,
    allocatedAddresses: 96,
    remainingAddresses: 160
  },
  allocations: [
    {
      name: "Management",
      requiredHosts: 50,
      cidr: "172.16.0.0/26",
      network: "172.16.0.0",
      firstHost: "172.16.0.1",
      lastHost: "172.16.0.62",
      broadcast: "172.16.0.63",
      subnetMask: "255.255.255.192",
      prefix: 26,
      usableHosts: 62,
      totalAddresses: 64
    }
  ]
}
```

Structured results provide a single source of truth for:

- HTML rendering
- Clipboard copying
- Spreadsheet download
- CSV export
- Unit testing
- Future API or CLI integrations

---

## 7. Allocation Rules

The allocation engine should implement the following rules.

### 7.1 Largest-first allocation

Subnet requests are sorted from largest to smallest before allocation.

This reduces fragmentation and improves the likelihood that all requested networks fit within the parent CIDR block.

### 7.2 Parent-network enforcement

Every generated subnet must satisfy:

```text
subnet network >= parent network
subnet broadcast <= parent broadcast
```

The application must stop and return an actionable error if the requested allocations exceed the parent network.

### 7.3 Valid subnet boundaries

Every subnet must begin on a boundary appropriate to its calculated prefix.

For example, `/26` networks inside `192.168.1.0/24` begin at:

```text
192.168.1.0
192.168.1.64
192.168.1.128
192.168.1.192
```

### 7.4 Parent address normalisation

The preferred user input format is CIDR notation:

```text
172.16.10.0/24
```

Where a host address is entered instead of a network address, the application should either:

1. Normalise it to the correct network address and inform the user, or
2. Reject it with a clear validation message

The selected behaviour should be consistent and covered by tests.

### 7.5 `/31` and `/32` handling

The application should explicitly define its treatment of:

- `/31` point-to-point networks
- `/32` host routes

The initial implementation may use traditional subnet semantics and restrict generated user subnets to `/30` or larger. Future support for `/31` and `/32` should be an explicit feature rather than accidental behaviour.

---

## 8. Spreadsheet Export Architecture

### 8.1 Design goals

The spreadsheet export must:

- Be generated locally in the browser
- Require no server-side processing
- Contain no macros
- Preserve IPv4 values accurately
- Use predictable worksheet and column names
- Match the visible table data
- Be safe to open in common spreadsheet applications

### 8.2 Data flow

```text
Allocation result object
          ├──→ HTML table renderer
          ├──→ Clipboard-friendly table
          ├──→ CSV exporter
          └──→ XLSX workbook generator
```

### 8.3 Implementation options

Two implementation approaches are available.

#### Option A: Lightweight spreadsheet library

Use a maintained browser-compatible library to generate `.xlsx` files.

Advantages:

- Native workbook output
- Multiple worksheets
- Column widths and basic formatting
- Broad spreadsheet compatibility

Considerations:

- Dependency and supply-chain review required
- Version pinning required
- Software composition analysis should run in CI
- The library should be bundled or served from the same origin rather than loaded from an uncontrolled CDN

#### Option B: CSV-only initial implementation

Generate CSV using browser-native APIs.

Advantages:

- No third-party dependency
- Simple implementation
- Easy to audit

Limitations:

- No multiple worksheets
- Limited formatting
- Less polished user experience

The target feature is a **Download Spreadsheet** button with `.xlsx` output. CSV may also be retained as a secondary export option.

### 8.4 Spreadsheet injection protection

User-provided subnet names must be treated as untrusted input.

Values beginning with spreadsheet formula markers may be interpreted as formulas by spreadsheet software:

```text
=
+
-
@
```

Before writing user-controlled values to CSV or XLSX cells, the exporter should neutralise formula-like content, for example by prefixing it with an apostrophe or explicitly storing it as text.

This protects against CSV or spreadsheet formula injection.

---

## 9. CI Architecture

A CI workflow will be stored under:

```text
.github/workflows/ci.yml
```

### 9.1 CI objectives

The CI pipeline should verify:

- Dependency integrity
- JavaScript syntax and linting
- Unit tests
- Integration tests
- Static HTML validity
- Accessibility smoke checks
- Security scanning
- Successful static-site packaging

### 9.2 Recommended CI stages

```text
Checkout
   ↓
Set up Node.js
   ↓
Install locked dependencies
   ↓
Lint source files
   ↓
Run unit tests
   ↓
Run integration tests
   ↓
Validate HTML/static assets
   ↓
Run dependency/security checks
   ↓
Package /public as deployment artefact
```

### 9.3 Suggested quality gates

The main branch should reject changes where:

- Unit tests fail
- Linting fails
- The static site cannot be packaged
- A high-severity dependency vulnerability is introduced without an approved exception
- Required files are missing from `/public`

### 9.4 Initial test tooling

A lightweight JavaScript test stack is sufficient.

Suggested options:

- Node.js native test runner or Vitest for unit tests
- jsdom for DOM-level integration tests
- Playwright for a minimal browser smoke test
- ESLint or Biome for code quality

The project should avoid unnecessary framework adoption where simple modules and tests are sufficient.

---

## 10. Deployment Architecture

A deployment workflow will publish the contents of `/public` to a static web server.

```text
Developer commit
      ↓
GitHub pull request
      ↓
CI validation
      ↓
Merge to main
      ↓
Deployment workflow
      ↓
Versioned deployment artefact
      ↓
Static web server
      ↓
https://vlsm.git.safesploit.com/
```

### 10.1 Deployment requirements

The deployment process should:

- Deploy only files from `/public`
- Run only after CI succeeds
- Use least-privilege credentials
- Avoid exposing server-management credentials to untrusted pull requests
- Produce an auditable deployment history
- Support rollback to a previous known-good artefact
- Keep build and deployment responsibilities separate

### 10.2 Static server model

The production server serves static files only:

```text
/public/index.html
/public/assets/**
/public/assets/js/**
```

No application runtime is required beyond the web server.

Suitable static web servers include:

- NGINX
- Apache HTTP Server
- Caddy
- GitHub Pages, where deployment constraints permit

### 10.3 Deployment security

Recommended controls:

- Dedicated deployment account
- Scoped SSH key or deployment token
- Restricted deployment directory permissions
- No interactive shell where unnecessary
- Server-side verification of the deployment path
- Atomic release or symlink-based deployment where practical
- HTTPS enforced
- Security headers applied by the web server

---

## 11. Security Architecture

Although the application is static, browser-side and supply-chain risks still apply.

### 11.1 Client-side rendering

User-controlled values, including subnet names, must be rendered using safe DOM operations such as:

```javascript
cell.textContent = value;
```

User input must not be inserted into the page using uncontrolled `innerHTML`.

### 11.2 Content Security Policy

The application should be compatible with a restrictive Content Security Policy.

Example target policy:

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
object-src 'none';
base-uri 'none';
frame-ancestors 'none';
form-action 'self';
```

Inline scripts and uncontrolled third-party CDNs should be avoided.

### 11.3 Recommended HTTP headers

The static server should provide:

```text
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
Strict-Transport-Security
```

### 11.4 Dependency controls

Where a spreadsheet library or test dependencies are introduced:

- Pin dependency versions
- Commit the lock file
- Use reproducible CI installation
- Run dependency auditing
- Review transitive dependencies
- Avoid runtime CDN dependencies
- Keep production dependencies minimal

### 11.5 Data privacy

The application should continue to process calculations locally.

No subnet plans should be transmitted to an external service unless a future feature explicitly requires it and the user is informed.

---

## 12. Testing Strategy

### 12.1 Unit tests

Unit tests should cover all pure domain functions.

Essential cases include:

| Test case | Expected behaviour |
|---|---|
| Valid IPv4 parsing | Convert correctly to a 32-bit value |
| Invalid octet | Reject values above 255 |
| Prefix-to-mask conversion | Return the correct subnet mask |
| Parent network calculation | Return the correct network boundary |
| Largest-first sorting | Allocate larger requirements first |
| Exact-fit allocation | Use all available parent addresses without overflow |
| Insufficient parent network | Return a clear allocation error |
| Non-network input address | Normalise or reject consistently |
| Equal-sized requests | Produce stable non-overlapping allocations |
| IPv4 maximum boundary | Prevent overflow beyond `255.255.255.255` |
| Malicious subnet name | Preserve as text, not executable markup |
| Spreadsheet formula input | Export as text, not a formula |

### 12.2 Integration tests

Integration tests should verify:

- Form submission produces a table
- Validation errors are visible and accessible
- Column-selection controls affect displayed output
- The table remains copyable into a spreadsheet
- The Download Spreadsheet button produces a file
- Downloaded workbook data matches the visible table

### 12.3 Browser smoke tests

A minimal browser test should:

1. Open the application
2. Enter a known parent CIDR
3. Add multiple subnet requirements
4. Generate the allocation
5. Verify table output
6. Trigger the spreadsheet download

---

## 13. Accessibility and Usability

The target application should meet basic WCAG-oriented practices.

Requirements include:

- Correct `<label for>` associations
- Keyboard-accessible controls
- Visible focus states
- Semantic table headings
- Accessible validation messages
- `aria-live` status region for calculation results and errors
- Sufficient colour contrast
- Responsive handling for wide result tables

The application should not sacrifice spreadsheet copyability for visual styling.

---

## 14. Observability and Diagnostics

As a static application, operational observability is intentionally limited.

Recommended diagnostics include:

- Human-readable validation messages
- Optional development-mode console diagnostics
- Application version displayed in the footer or About section
- CI and deployment status badges in the repository README
- Web-server access and error logs on the hosting platform

No subnet inputs or generated plans should be logged by default.

---

## 15. Architectural Principles

### 15.1 Static by default

The project should remain a static application unless a future requirement clearly justifies a backend.

### 15.2 Pure calculation engine

IPv4 and VLSM logic should remain independent of the DOM and hosting platform.

### 15.3 One allocation result, multiple outputs

The HTML table, clipboard flow, CSV export and spreadsheet export must all consume the same structured allocation result.

### 15.4 Preserve operational simplicity

The project should use the least abstraction required to remain safe, testable and maintainable.

### 15.5 Correctness before presentation

Subnet calculations and boundary enforcement take precedence over cosmetic improvements.

### 15.6 Secure by design

User input must be treated as untrusted in both the browser and downloaded spreadsheet.

---

## 16. Roadmap

### Phase 1: Repository restructuring

**Objective:** Establish a predictable project and deployment layout.

- [x] Move deployable web application files into `/public`
- [x] Create `.github/workflows/`
- [ ] Add `/tests/unit` and `/tests/integration`
- [x] Add `package.json` and lock file for development tooling
- [x] Update relative asset paths
- [x] Update README deployment and development instructions
- [x] Keep `ARCHITECTURE.md` at the repository root

### Phase 2: Calculation-engine refactor

**Objective:** Make the VLSM logic correct, reusable and testable.

- [x] Replace the shared global namespace with ES modules
- [x] Separate calculation logic from DOM operations
- [x] Parse the parent network as CIDR
- [x] Calculate and enforce parent network boundaries
- [x] Normalise or reject non-network starting addresses
- [x] Detect insufficient address space
- [x] Prevent overlapping allocations
- [x] Prevent IPv4 integer overflow
- [x] Define `/31` and `/32` behaviour
- [x] Return structured allocation results

### Phase 3: Validation and error handling

**Objective:** Prevent plausible-looking but invalid network plans.

- [x] Validate IPv4 addresses and prefixes
- [x] Validate required host counts
- [x] Reject empty or duplicate subnet names where appropriate
- [x] Provide actionable error messages
- [ ] Add capacity summary before allocation
- [x] Show required, allocated and remaining address counts
- [x] Add accessible status and error regions

### Phase 4: Automated testing

**Objective:** Protect network-calculation correctness.

- [x] Add unit tests for IPv4 conversion
- [x] Add unit tests for prefix and mask conversion
- [x] Add unit tests for subnet sizing
- [x] Add unit tests for alignment and allocation
- [x] Add overflow and boundary tests
- [ ] Add DOM integration tests
- [x] Add spreadsheet export tests
- [ ] Add a browser smoke test
- [x] Define an acceptable coverage threshold

### Phase 5: Continuous integration

**Objective:** Enforce repository quality before merge.

- [x] Add `.github/workflows/ci.yml`
- [x] Install dependencies using the lock file
- [x] Run linting
- [x] Run unit tests
- [ ] Run integration tests
- [x] Validate static HTML and assets
- [x] Run dependency audit
- [x] Package `/public` as a deployment artefact
- [ ] Require CI checks on the main branch

### Phase 6: Static deployment

**Objective:** Automatically publish validated builds.

- [x] Add `.github/workflows/deploy.yml`
  - deploy a static web (depends on ci.yml)
- [x] Trigger deployment only after successful CI
- [x] Deploy `/public` to the static web server
- [x] Use least-privilege deployment credentials
- [x] Add deployment concurrency controls
- [x] Retain versioned deployment artefacts
- [x] Document rollback procedure
- [x] Verify the production URL after deployment

### Phase 7: Spreadsheet and export features

**Objective:** Improve operational use without removing existing workflows.

- [x] Preserve direct copy-and-paste into spreadsheet software
- [x] Add a **Download Spreadsheet** button
- [x] Generate `.xlsx` locally in the browser
- [x] Add a `Summary` worksheet
- [x] Add optional CSV export
- [x] Preserve user-selected column ordering
- [x] Protect exports against spreadsheet formula injection
- [x] Add file-name conventions such as `vlsm-plan-YYYY-MM-DD.xlsx`
- [ ] Verify compatibility with Excel, LibreOffice Calc and Google Sheets

### Phase 8: Security hardening

**Objective:** Reduce browser and supply-chain risk.

- [x] Remove unsafe user-controlled `innerHTML`
- [x] Apply a restrictive Content Security Policy
- [ ] Add security headers on the static server
- [x] Pin production and development dependencies
- [x] Add automated dependency scanning
- [ ] Add secret scanning to CI
- [ ] Document the application's local-processing privacy model

### Phase 9: User-experience improvements

**Objective:** Make the calculator easier to use for real network planning.

- [x] Add example subnet plans
- [x] Add a reset button
- [x] Add duplicate-row functionality
- [x] Add responsive table behaviour
- [x] Add copy-to-clipboard feedback
- [x] Add remaining-capacity visualisation
- [x] Preserve form state locally where appropriate
- [ ] Add light and dark appearance support

### Phase 10: Advanced networking features

**Objective:** Evolve the calculator into a broader addressing-planning tool.

Potential features:

- [ ] AWS VPC reserved-address mode
- [ ] Azure virtual network reserved-address mode
- [ ] `/31` point-to-point mode
- [ ] VLAN ID and gateway columns
- [ ] Route summarisation
- [ ] CIDR overlap detection
- [ ] Import/export using JSON or YAML
- [ ] Homelab addressing-plan templates
- [ ] IPv6 prefix-planning support
- [ ] Printable network-design report

---

## 17. Out of Scope

The following are not currently required:

- User accounts
- Central database storage
- Server-side subnet calculation
- Multi-user collaboration
- Cloud-hosted persistence
- Authentication or authorisation
- A large frontend framework
- A microservice architecture

These should only be introduced where a clear requirement justifies the added operational and security complexity.

---

## 18. Success Criteria

The modernised architecture will be considered successful when:

- The application is served entirely from `/public`
- CI automatically validates every proposed change
- Unit tests cover the calculation engine and boundary conditions
- Deployment to the static web server is automated and auditable
- The parent CIDR is fully enforced
- Invalid or oversized plans fail clearly
- The HTML table remains directly copyable into spreadsheets
- Users can download the same results as a spreadsheet
- Browser rendering and spreadsheet exports safely handle untrusted input
- The application remains lightweight, portable and easy to operate
