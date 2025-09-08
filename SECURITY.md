# Security Policy

## Credential Security

### ⚠️ CRITICAL: Never Commit Credentials

This repository documents a **restricted API** that requires credentials from the Danish Business Authority. **Under no circumstances should real credentials be committed to this repository or any other version control system.**

### What NOT to Commit

- ❌ Actual API usernames and passwords
- ❌ `.env` files with real credentials
- ❌ Configuration files with hardcoded credentials
- ❌ Test files with real authentication data
- ❌ Screenshots or logs containing credentials

### Safe Documentation Practices

When contributing to this documentation:

#### ✅ DO Use Placeholders
```bash
# ✅ Good
export CVR_USERNAME="YOUR_USERNAME"
export CVR_PASSWORD="YOUR_PASSWORD"

# ❌ Bad
export CVR_USERNAME="YOUR_CVR_USERNAME"
export CVR_PASSWORD="YOUR_CVR_PASSWORD"
```

#### ✅ DO Use Environment Variables
```python
# ✅ Good
username = os.getenv("CVR_USERNAME")
password = os.getenv("CVR_PASSWORD")

# ❌ Bad
username = "actual_username"
password = "actual_password"
```

#### ✅ DO Use Example CVR Numbers
Use publicly known CVR numbers for examples:
- `10103940` (Statsministeriet - Danish Prime Minister's Office)
- `10150817` (Novo Nordisk A/S)
- `25052943` (Carlsberg A/S)

## Reporting Security Issues

### What to Report

Please report security issues if you find:

1. **Exposed Credentials**: Real API credentials in code, documentation, or commit history
2. **Vulnerability in Examples**: Code examples that could lead to security issues
3. **Insecure Practices**: Documentation promoting unsafe credential handling

### How to Report

**For exposed credentials (URGENT):**
1. **Email**: [maintainer-email@example.com](mailto:maintainer-email@example.com)
2. **Subject**: `[SECURITY] Exposed CVR API Credentials`
3. **Include**: File path, commit hash, and description

**For other security issues:**
1. Use [GitHub Security Advisories](https://github.com/your-username/cvr-api-docs/security/advisories)
2. Provide detailed description and steps to reproduce
3. Suggest fixes if possible

## Response Process

### Credential Exposure Response

If real credentials are found in the repository:

1. **Immediate Actions** (within 1 hour):
   - Repository made private temporarily
   - Affected commits identified
   - CVR API support team notified

2. **Remediation** (within 24 hours):
   - Credentials revoked/changed (with CVR support)
   - Git history cleaned using `git filter-branch` or BFG Repo-Cleaner
   - All contributors notified

3. **Prevention** (within 48 hours):
   - Enhanced CI/CD checks implemented
   - Additional security documentation added
   - Contributor guidelines updated

### General Security Issues

For non-critical security issues:
- **Acknowledgment**: Within 48 hours
- **Investigation**: Within 1 week  
- **Resolution**: Within 2 weeks
- **Public disclosure**: After fix is deployed

## Prevention Measures

### Automated Checks

This repository uses the following automated security measures:

1. **Git Pre-commit Hooks** (recommended for contributors):
   ```bash
   # Install pre-commit
   pip install pre-commit
   pre-commit install
   ```

2. **GitHub Actions Security Scanning**:
   - Scans for exposed secrets
   - Checks for hardcoded credentials
   - Validates example code

3. **Dependabot Security Updates**:
   - Monitors Python dependencies
   - Creates PRs for security updates

### Contributor Guidelines

Before contributing:

1. **Review your changes** for any real credentials
2. **Use the provided `.gitignore`** to exclude sensitive files
3. **Test with fake credentials** only
4. **Follow the security examples** in the documentation

## Credential Management Best Practices

### For Users of This Documentation

When implementing the CVR API in your projects:

#### Development Environment
```bash
# Create .env file (never commit this)
echo "CVR_USERNAME=your_username" > .env
echo "CVR_PASSWORD=your_password" >> .env
echo ".env" >> .gitignore
```

#### Production Environment
Use secure credential management:

- **AWS**: AWS Secrets Manager, Parameter Store
- **Azure**: Azure Key Vault
- **GCP**: Secret Manager
- **Kubernetes**: Sealed Secrets, External Secrets
- **Docker**: Docker Secrets (Swarm mode)

#### Environment Variables
```python
import os
from dataclasses import dataclass

@dataclass
class CVRConfig:
    username: str = os.getenv('CVR_USERNAME')
    password: str = os.getenv('CVR_PASSWORD')
    
    def __post_init__(self):
        if not self.username or not self.password:
            raise ValueError("CVR credentials not found in environment")
```

## Compliance and Legal

### Data Protection
- This API contains personal data of business owners and directors
- Follow GDPR requirements when processing and storing data
- Implement appropriate data retention and deletion policies

### Terms of Use
- Respect the Danish Business Authority's terms of service
- Use the API only for legitimate business purposes
- Don't exceed reasonable usage limits

## Contact

For security concerns:
- **Email**: [security@your-domain.com](mailto:security@your-domain.com)
- **PGP Key**: [Public key link if available]

For CVR API access and official support:
- **Email**: [cvrselvbetjening@erst.dk](mailto:cvrselvbetjening@erst.dk)

---

**Remember**: Security is everyone's responsibility. When in doubt, err on the side of caution and ask for help.