# Security FAQ for organisations evaluating Hajk

This page answers common security questions from organisations that are considering running Hajk. It is written for IT managers, system administrators and others who need to assess Hajk without going through the code.

To report a vulnerability, or to learn exactly which threats Hajk does and does not protect against, see [SECURITY.md](../SECURITY.md).

## The short version

Hajk is open-source software that your organisation installs and runs on its own servers. There is no central Hajk service and no Hajk cloud, and the Hajk project has no access to your installation or your data.

Security is therefore a **shared responsibility**. The Hajk project is responsible for the code. Your organisation is responsible for how it is installed, configured and operated.

| Area                                                                | Hajk project | Your organisation |
| ------------------------------------------------------------------- | :----------: | :---------------: |
| Writing, reviewing and fixing the source code                       |      ✔       |                   |
| Handling reported vulnerabilities and publishing fixed releases     |      ✔       |                   |
| Keeping Hajk's own dependencies up to date                          |      ✔       |                   |
| Documenting security-related settings                               |      ✔       |                   |
| Installing updates in time                                          |              |         ✔         |
| Servers, operating system, Node.js, network, firewall, TLS          |              |         ✔         |
| Configuring Hajk securely (access to Admin, CORS, CSP, rate limits) |              |         ✔         |
| User accounts and login (Active Directory, reverse proxy)           |              |         ✔         |
| Security of the map services Hajk displays (GeoServer, QGIS etc.)   |              |         ✔         |
| Penetration testing and vulnerability scanning of the installation  |              |         ✔         |
| Monitoring, logging, backups, incident response                     |              |         ✔         |
| Data protection (GDPR), information classification                  |              |         ✔         |

## Frequently asked questions

### Does the Hajk project review the code or run penetration tests, for example before each release? Or is that up to each organisation?

Both, but they cover different things.

**What the project does:**

- Every change is reviewed and approved by a maintainer before it is merged (see [How is the code controlled?](#how-is-the-code-controlled)).
- GitHub's CodeQL automatically scans the code for common security weaknesses, both on pull requests and continuously. Dependabot reports dependencies with known vulnerabilities.
- Each release is preceded by a release candidate that organisations running Hajk test before the final version is published.

**What the project does not do:**

- The project does not commission independent code audits or penetration tests, neither before each release nor on a regular schedule.

**What is up to your organisation:**

- **Penetration testing.** A penetration test examines a running installation, and the result depends mostly on that environment: the server, network, reverse proxy, login solution, configuration and the map services that are connected. These differ between every Hajk installation, so a test of one installation says little about yours. Include your Hajk installation in your organisation's own penetration tests and vulnerability scans.
- **Independent code review.** If your organisation requires an independent review of the source code, you can commission one. All code is public, so any reviewer can access it without involving the project.

If a test or review finds a problem in Hajk itself, please report it as described in [SECURITY.md](../SECURITY.md) so that it can be fixed for everyone who runs Hajk. Read the threat model there first: many findings, such as an unprotected Admin or a missing Content-Security-Policy, concern configuration rather than Hajk's code. Organisations that want to coordinate a review, and perhaps share its cost, can reach each other through [GitHub Discussions](https://github.com/hajkmap/Hajk/discussions).

### How is the code controlled?

- **Open source.** All code is public on [GitHub](https://github.com/hajkmap/Hajk) under the MIT license, so anyone, including your own staff or consultants, can review it.
- **Protected branches.** Changes to the main branches (`develop` and `master`) go through pull requests that need approval from a reviewer, and commits must be signed. The history of these branches cannot be rewritten. Maintainers can push small changes, such as dependency updates, directly.
- **Automated code analysis.** GitHub's CodeQL scans the code for common security weaknesses, and Dependabot alerts the maintainers when a dependency has a known vulnerability.
- **Contribution rules.** All contributions follow [CONTRIBUTING.md](../CONTRIBUTING.md). Contributions written with AI tools follow a stricter [AI policy](../AI_POLICY.md).
- **Traceable releases.** Every release is tagged in Git and published on the [releases page](https://github.com/hajkmap/Hajk/releases). All changes, including security fixes, are listed in the [CHANGELOG](../CHANGELOG.md).

### How are security vulnerabilities handled?

Vulnerabilities are reported privately through GitHub. The maintainers confirm the problem, fix it and publish a new release, along with a [security advisory](https://github.com/hajkmap/Hajk/security/advisories) and an entry in the CHANGELOG. Only the latest release receives fixes, so plan to keep your installation up to date. The full process is described in [SECURITY.md](../SECURITY.md).

To get notified about new releases and security advisories, click **Watch** on the [GitHub repository](https://github.com/hajkmap/Hajk), choose **Custom**, then select **Releases** and **Security alerts**.

### How are third-party dependencies managed?

Hajk is built on widely used open-source libraries such as React, OpenLayers, Material UI and Express. The maintainers update them regularly and check them with `npm audit` and Dependabot. Known vulnerabilities are fixed by updating the affected package. The official Docker image is based on a slim Node.js image to reduce the number of packages it contains.

Note that a vulnerability scanner will sometimes report issues in packages that are only used to build Hajk and never run on your server or in the browser. See the threat model in [SECURITY.md](../SECURITY.md) for how we assess such findings.

### How do users log in? How is access controlled?

Hajk has no user database of its own. Access is based on your organisation's existing identity solution:

- The Backend can look up users and groups in **Active Directory/LDAP**. Access to maps, layers, tools and Admin can then be limited to specific AD groups.
- Alternatively, a **reverse proxy** in front of Hajk handles login (for example Windows authentication, Kerberos or SAML) and passes the user's name and groups to Hajk in trusted headers.

> [!WARNING]
> If neither is configured, Hajk cannot tell who a user is, and **anyone who can reach the server can use Admin** and change the maps. In production, configure Active Directory, or block access to Admin at the network or reverse proxy level.

### What data does Hajk store?

By default, very little:

- **Configuration**: maps, layers, tools and documents, stored as JSON files in the Backend's `App_Data` directory.
- **Log files**: the Backend writes application and access logs, which contain IP addresses and, if Active Directory is enabled, user names. Log levels and retention are configured in `.env`.
- **User feedback** (only if the Feedback tool is enabled): messages from users, stored as files in `App_Data/feedback`. The user's name is stored only if `FEEDBACK_STORE_AUTH_USER` is enabled.
- **In the user's browser**: some tools keep settings and drawings in the browser's local storage. These never leave the user's computer unless the user exports them.

Hajk has no database and does not send data to the Hajk project or any other third party. The map services you connect to, and any external background maps you enable, will of course receive requests from users' browsers.

### How do we harden our installation?

All security-related settings are documented in `apps/backend/.env.example`. The most important ones are:

- **Protect Admin**: set `AD_LOOKUP_ACTIVE` and `RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS`, or block Admin at the network level.
- **Use HTTPS** in front of Hajk, and keep `HSTS_ENABLED` on.
- **Set `SESSION_SECRET`** to a long random value, and `CAPTCHA_HMAC_KEY` if you use the Feedback tool.
- **Restrict which websites can use the API** with `CORS_ALLOWED_ORIGINS`, and which pages can embed your map with `CSP_FRAME_ANCESTORS`.
- **Enable a Content-Security-Policy** with `CSP_MODE`. Start with `report-only`, then switch to `enforce`.
- **Configure the reverse proxy correctly**: set `EXPRESS_TRUST_PROXY` to the number of proxies or their addresses (not `true`), and set `AD_TRUSTED_PROXY_IPS` if you use header-based login.
- **Keep rate limiting enabled** (`RATE_LIMIT_ENABLED`, on by default).
- **Only expose what you need**: review the proxies (`PROXY_*`) and statically exposed directories (`EXPOSE_*`).
- **Run Hajk on a supported Node.js version** as a non-privileged user, and keep Hajk updated to the latest release.

### Do you offer certifications, SLAs or support contracts?

No. Hajk is an open-source project run by its users, so the project itself offers no certifications (such as ISO 27001), guaranteed response times or support contracts. Organisations that need guaranteed support arrange it themselves, with their own staff or a supplier of their choice. You can also ask the community in [GitHub Discussions](https://github.com/hajkmap/Hajk/discussions).

### Who develops Hajk?

Hajk is governed by a cooperation of Swedish municipalities and other organisations that use it, and is developed by a subset of them and by other contributors. A small group of maintainers reviews and merges changes. See the [project website](https://hajkmap.github.io/Hajk/) for the organisations involved. The project's direction is described in the [roadmap](../ROADMAP.md).
