# Security Policy

## Supported Versions

We currently provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 4.x.x   | :white_check_mark: |
| < 4.0.0 | :x:                |

## Reporting a Vulnerability

We take the security of our project seriously. If you find a security vulnerability, please do **not** open a public issue. Instead, please report it to us privately.

### How to Report

Please send an email to **security@sisyphuslabs.ai** with the following information:

1. **Description of the vulnerability**: Clear and concise details of the issue.
2. **Steps to reproduce**: A minimal proof-of-concept or clear instructions on how to trigger the vulnerability.
3. **Potential impact**: What could an attacker achieve by exploiting this?
4. **Suggested fix** (optional): If you have an idea for a solution, feel free to include it.

### What to Expect

- You will receive an acknowledgment of your report within 48 hours.
- We will investigate the issue and provide updates as we work toward a resolution.
- Once fixed, we will coordinate a disclosure date with you.
- We may credit you for the discovery in our changelog or security advisories (with your permission).

## Privacy and Data Security

- **Telemetry**: We collect anonymous telemetry by default to improve the project. This data is hashed and does not contain personal information. You can disable it by setting `OMO_SEND_ANONYMOUS_TELEMETRY=0`.
- **Sensitive Data**: Our agents are instructed to avoid logging or committing secrets. However, users are responsible for ensuring their `.env` files and other sensitive configurations are properly ignored by git and other tools.

Thank you for helping us keep Oh My OpenCode secure!
