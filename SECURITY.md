# Security Policy

This document describes how to report security vulnerabilities in Hajk, how we handle them, and which threats Hajk itself is responsible for.

- [Reporting a vulnerability](#reporting-a-vulnerability)
- [Supported versions](#supported-versions)
- [Disclosure policy](#disclosure-policy)
- [The Hajk threat model](#the-hajk-threat-model)
- [Comments on this policy](#comments-on-this-policy)

If you are evaluating Hajk for your organisation and have questions such as "do you do penetration testing?" or "how is the code controlled?", see the [Security FAQ](docs/security-faq.md).

## Reporting a vulnerability

> [!IMPORTANT]
> Before reporting, please read [the Hajk threat model](#the-hajk-threat-model) to check whether the issue is within Hajk's security scope.

**Do not report security vulnerabilities in public issues, discussions or pull requests.**

Report vulnerabilities privately through GitHub:

1. Go to the [Security tab](https://github.com/hajkmap/Hajk/security) of the Hajk repository.
2. Click **Report a vulnerability** and fill in the form ([GitHub's documentation](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)).

This is the only channel we use for security reports. It lets us discuss the issue and prepare a fix without making it public.

A good report includes:

- The affected version (release tag or commit hash).
- The affected application: Client, Admin or Backend.
- Configuration relevant to the issue, such as `.env` settings or parts of the map configuration. Remove secrets first.
- Steps to reproduce, and what an attacker gains.

Hajk is maintained by a small team, partly on volunteer time. We acknowledge and triage reports on a best-effort basis and cannot promise fixed response times. Expect delays during holidays and at the end of the year. Once we have acknowledged your report, we will keep you informed of our progress and may ask for more details.

### Third-party dependencies

If the vulnerability is in a third-party package (for example OpenLayers, Express or React), please report it to that package's maintainers. Once a fix is published upstream, we update the dependency in Hajk. You don't need to tell us about publicly known CVEs in our dependencies: we get them through Dependabot, `npm audit` and CodeQL.

## Supported versions

Only the **latest release** receives security fixes. Releases are listed on the [releases page](https://github.com/hajkmap/Hajk/releases), and versions, downloads and Docker images are described in [Releases](docs/releases.md).

Fixes ship with the next release. For severe vulnerabilities we also publish a patch release of the latest release (for example 4.3.0 → 4.3.1). That way you can stay on a tested release and get the fix, instead of waiting for the next release or running an unreleased build from `develop`.

We do not backport fixes to older releases, such as 4.2.x. If you run an older release, the fix is to upgrade.

## Disclosure policy

When we receive a report, a maintainer takes ownership of it and:

1. Confirms the problem and determines which versions are affected.
2. Looks through the code for similar problems.
3. Prepares a fix and releases it.
4. Publishes a [GitHub Security Advisory](https://github.com/hajkmap/Hajk/security/advisories), with a CVE when warranted, and adds an entry under **Security** in [CHANGELOG.md](CHANGELOG.md).

We credit reporters in the advisory unless they prefer not to be named. Please give us a reasonable amount of time to release a fix before you disclose the issue publicly.

## The Hajk threat model

Hajk is software that you install and run yourself. It is not a hosted service. Each organisation running Hajk (the _operator_) controls the servers, network, configuration and user management around it. The threat model below defines what Hajk trusts and what it does not. A vulnerability must fit within this model: it cannot rely on a trusted element being compromised.

### What Hajk does not trust

1. **Requests to the Backend API** from anyone who has not been authenticated as an admin. This covers the request path, query string, body and headers. The exception is the identity headers described under trusted element 4 below.
2. **Input from end users in the Client**, such as URL parameters and hash, search strings, imported files (for example GeoJSON or KML in Sketch) and feedback messages.

If such input can make Hajk do something beyond its documented behaviour, it is likely a vulnerability. Examples:

- running code on the server
- reading or writing files outside the intended directories
- bypassing admin restrictions or AD group checks
- making the Backend send requests to hosts other than those configured by the operator (SSRF)
- running script in another user's browser (XSS)
- leaking configuration or secrets
- crashing the Backend so it cannot recover

### What Hajk trusts

1. **The operator and the infrastructure Hajk runs on.** This includes the operating system, the Node.js runtime, the reverse proxy, TLS termination and the network.
2. **The Backend's configuration.** This includes `.env`, the files in `App_Data` and any directories exposed as static content.
3. **Admins and everything they create.** Anyone with access to Admin (or the admin API) can change what all users see, including map and layer configuration, infoclick templates and DocumentHandler documents. These may contain HTML, links and embedded content by design.
4. **The identity infrastructure.** This means the Active Directory/LDAP server, and the user and group headers set by a reverse proxy listed in `AD_TRUSTED_PROXY_IPS`.
5. **Services configured by the operator or admins.** This includes WMS/WFS/WMTS servers, GeoServer, QGIS Server, FME, search sources and other proxy targets, and the responses they return.
6. **The code Hajk runs.** This means its npm dependencies, the built Client and Admin bundles, and any custom or community plugins that have been installed.

### Examples of what is not a vulnerability

These are commonly reported, but fall outside Hajk's scope. They are the operator's responsibility or are intended behaviour.

- **Admin is open when Active Directory is not configured.** Without `AD_LOOKUP_ACTIVE` and `RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS`, Hajk cannot know who the user is, so admin endpoints are open, and the Backend logs a warning about it. In production, either configure AD or block access to Admin and the admin API at the network or reverse proxy level.
- **HTML or script written by an admin.** Admins are trusted (see trusted element 3), so content they add to configurations or documents is not cross-site scripting.
- **Malicious responses from configured map services.** These services are trusted (see trusted element 5). If one of them is compromised, the problem is in that service.
- **Insecure settings left unchanged.** Several defaults favour compatibility over strictness: any origin may call the API (`CORS_ALLOWED_ORIGINS`), no Content-Security-Policy is sent (`CSP_MODE`), any site may embed Hajk (`CSP_FRAME_ANCESTORS`), and `SESSION_SECRET` has a placeholder value. These options are documented in `apps/backend/.env.example`, and hardening them is up to the operator. Embedding Hajk in other pages is a feature, so clickjacking reports against a default setup are out of scope.
- **Spoofed identity headers.** With header-based AD, the reverse proxy is trusted to set the user and group headers. If the Backend can be reached without passing through that proxy, or if `AD_TRUSTED_PROXY_IPS` and `EXPRESS_TRUST_PROXY` are set too permissively, headers can be forged. That is a deployment issue.
- **Denial of service through traffic volume.** Hajk has basic, in-memory rate limiting (`RATE_LIMIT_*`), but protecting against volumetric attacks is the job of the infrastructure. A single request that crashes the Backend or uses an unreasonable amount of resources is in scope, though.
- **Scanner or `npm audit` output with no exploit path.** A dependency with a known CVE is a vulnerability in Hajk only if the vulnerable code can be reached in a way an attacker can use. Dependencies that are used only for building or development, including the legacy build tooling of Admin, are updated as regular maintenance and are not treated as vulnerabilities. Show us how it can be exploited in Hajk and we'll treat it as a vulnerability.
- **Vulnerabilities in Node.js, the operating system or unsupported versions.** This includes running Hajk on an end-of-life Node.js release or on a Hajk version older than the latest release.
- **Self-XSS**, where a user has to paste code into their own browser console or address bar.
- **Third-party plugins, community extensions and forks.** Report these to their maintainers. See [community extensions](docs/community-extensions.md).

## Comments on this policy

If you have suggestions on how this policy could be improved, please open a pull request or start a [discussion](https://github.com/hajkmap/Hajk/discussions).
