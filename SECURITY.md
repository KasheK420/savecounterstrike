# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`master`) | ✅ Active |
| Older releases | ❌ Not supported |

We only maintain the latest version deployed at [savecounterstrike.com](https://savecounterstrike.com).

## Reporting a Vulnerability

If you discover a security vulnerability, **do NOT open a public issue.**

### How to Report

1. **Email:** [security@savecounterstrike.com](mailto:security@savecounterstrike.com)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within **48 hours** |
| Initial triage | Within **7 days** |
| Fix deployed | Within **30 days** (critical: 72 hours) |

We will keep you informed of our progress throughout.

## Scope

### In Scope

- Authentication and session management (Steam OpenID, JWT)
- Authorization bypass (role escalation, admin access)
- Data exposure or unauthorized access (API leaking private data)
- Cross-site scripting (XSS)
- SQL injection / Prisma query injection
- Server-side request forgery (SSRF)
- Insecure direct object references (IDOR)
- Rate limiting bypass

### Out of Scope

- Denial of service (DoS/DDoS) attacks
- Social engineering / phishing
- Issues in third-party dependencies (report upstream, but let us know)
- Self-XSS or issues requiring physical access
- Missing security headers on non-sensitive pages
- Brute force attacks against rate-limited endpoints

## Disclosure Policy

- We follow **coordinated disclosure** — please give us reasonable time to fix before publishing.
- We will credit reporters in our Hall of Fame (below) unless you prefer to remain anonymous.

## Hall of Fame

Thanks to the following security researchers:

*No reports yet — be the first!*

## Security Measures

This project implements:

- **JWT-only sessions** — no database session storage, signed & encrypted tokens
- **Steam OpenID 2.0** — no passwords stored, identity-only verification
- **Server-side data masking** — sensitive fields (steamId, names) masked before API responses
- **Rate limiting** — IP-based limits on all mutation endpoints
- **Input validation** — Zod schemas on all API inputs
- **HTML sanitization** — DOMPurify + sanitize-html double pass on user content
- **CSP headers** — Content Security Policy configured via Next.js
- **RBAC** — Role-based access control (USER → MODERATOR → ADMIN)
- **Automated scanning** — CodeQL analysis + Dependabot dependency updates
