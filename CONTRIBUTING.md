# Contributing to CVR API Documentation

Thank you for your interest in improving the Danish CVR Registry API documentation! This guide will help you contribute effectively and safely.

## 🚨 Security First

**CRITICAL**: This documentation covers a restricted API. Before contributing, please read our [Security Policy](SECURITY.md).

### Never Commit Real Credentials

- ❌ Never commit actual API usernames/passwords
- ❌ Never commit `.env` files with real credentials  
- ❌ Never hardcode credentials in examples
- ✅ Always use placeholders like `YOUR_USERNAME` and `YOUR_PASSWORD`
- ✅ Always use environment variables in code examples

## 📋 Types of Contributions

We welcome several types of contributions:

### 📚 Documentation Improvements
- Fix typos, grammar, or formatting issues
- Improve explanations and add clarity
- Add missing information or examples
- Translate content to other languages

### 💻 Code Examples
- Add new query examples for common use cases
- Improve existing code samples
- Add implementations in new programming languages
- Fix bugs in example code

### 🐛 Bug Reports
- Report errors in documentation or examples
- Identify security issues (see [Security Policy](SECURITY.md))
- Point out outdated information

### 💡 Feature Requests
- Suggest new sections or topics
- Propose better organization of content
- Request examples for specific use cases

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Git
- A text editor or IDE
- Basic understanding of MkDocs and Markdown

### Setting Up Development Environment

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cvr-api-docs.git
   cd cvr-api-docs
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start development server**:
   ```bash
   mkdocs serve
   ```

5. **Open in browser**: http://127.0.0.1:8000

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Edit files in the `docs/` directory
   - Test locally with `mkdocs serve`
   - Ensure all links work correctly

3. **Test your changes**:
   ```bash
   # Test build
   mkdocs build --clean --strict
   
   # Check for broken links (optional)
   # Install: pip install mkdocs-linkcheck
   mkdocs build -p linkcheck
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: Clear description of changes"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Writing Guidelines

### Content Standards

#### Clear and Concise
- Use simple language and short sentences
- Explain Danish business concepts for international developers
- Provide context for technical decisions

#### Practical Examples
- Include working code examples
- Use realistic but safe data (public CVR numbers)
- Show complete, runnable examples
- Include error handling

#### Consistent Style
- Use present tense ("returns" not "will return")
- Use active voice ("The API returns" not "Data is returned")
- Use standard terminology consistently

### Markdown Conventions

#### Headers
```markdown
# Main Page Title (H1 - only one per page)
## Major Sections (H2)
### Subsections (H3)
#### Details (H4 - use sparingly)
```

#### Code Blocks
Use language-specific syntax highlighting:

```markdown
```python
import requests

response = requests.get(url)
```

```bash
curl -X POST "https://api.example.com"
```

```json
{
  "query": {
    "match_all": {}
  }
}
```
````

#### Admonitions
Use Material theme admonitions for important information:

```markdown
!!! warning "Important Security Notice"
    Never commit real credentials to version control.

!!! tip "Performance Tip"
    Use field filtering to reduce response size.

!!! info "Background Information"
    CVR stands for Central Virksomhedsregister.
```

#### Links
- Use descriptive link text: `[CVR Support](mailto:cvrselvbetjening@erst.dk)`
- Use relative links for internal pages: `[Quick Start](../getting-started/quick-start.md)`
- Always test links before submitting

### Code Example Guidelines

#### Safe Example Data
Use publicly known companies for examples:

```python
# ✅ Good - Public companies
cvr_numbers = ["10103940", "10150817", "25052943"]  # Statsministeriet, Novo Nordisk, Carlsberg

# ❌ Bad - Random or made-up numbers
cvr_numbers = ["12345678", "87654321"]
```

#### Environment Variables
Always use environment variables for credentials:

```python
# ✅ Good
username = os.getenv("CVR_USERNAME")
if not username:
    raise ValueError("CVR_USERNAME environment variable not set")

# ❌ Bad
username = "hardcoded_username"
```

#### Error Handling
Include proper error handling in examples:

```python
try:
    response = requests.post(url, json=query, auth=(username, password))
    response.raise_for_status()
    return response.json()
except requests.exceptions.HTTPError as e:
    if response.status_code == 401:
        raise AuthenticationError("Invalid credentials")
    raise
except requests.exceptions.RequestException as e:
    logger.error(f"Request failed: {e}")
    raise
```

## 🔍 Review Process

### What We Look For

#### Content Quality
- ✅ Accurate information
- ✅ Clear explanations  
- ✅ Working code examples
- ✅ Proper security practices

#### Technical Quality
- ✅ Valid Markdown syntax
- ✅ Working internal links
- ✅ Consistent formatting
- ✅ No hardcoded credentials

#### Security Review
- ✅ No real credentials exposed
- ✅ Safe example data used
- ✅ Security best practices followed

### PR Checklist

Before submitting your PR, ensure:

- [ ] No real credentials in code or documentation
- [ ] All code examples use environment variables
- [ ] Links work correctly (both internal and external)
- [ ] Markdown syntax is valid
- [ ] Build passes locally (`mkdocs build --strict`)
- [ ] Changes are tested in development server
- [ ] Commit messages are clear and descriptive

## 🤝 Communication

### Where to Discuss

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussion
- **Pull Request Comments**: Specific feedback on changes

### Communication Guidelines

- Be respectful and constructive
- Focus on the content, not the person
- Provide specific, actionable feedback
- Help newcomers learn and improve

## 📚 Resources

### Documentation Tools
- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material Theme Documentation](https://squidfunk.github.io/mkdocs-material/)
- [Markdown Guide](https://www.markdownguide.org/)

### CVR API Resources
- [Official CVR Portal](https://datacvr.virk.dk/data/)
- [CVR Support Email](mailto:cvrselvbetjening@erst.dk)
- [Alternative CVR.dev API](https://cvr.dev)

### Danish Business Context
- [CVR System Overview (Danish)](https://datacvr.virk.dk/artikel/cvr-systemet)
- [Danish Company Forms](https://datacvr.virk.dk/artikel/selskabsformer)

## ❓ Getting Help

### Common Issues

**Build Errors**:
```bash
# Clear cache and rebuild
rm -rf site/ .mkdocs_cache/
mkdocs build --clean
```

**Link Errors**:
- Check relative vs absolute paths
- Ensure target files exist
- Test with `mkdocs serve`

**Python Errors**:
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Where to Ask for Help

1. **Check existing issues**: Someone may have had the same problem
2. **GitHub Discussions**: For general questions
3. **GitHub Issues**: For specific bugs or problems
4. **Email**: For security concerns only

## 🏆 Recognition

Contributors will be recognized in:
- GitHub contributor graphs
- Release notes (for significant contributions)
- Documentation credits page (planned)

Thank you for helping make CVR API documentation better for the Danish developer community! 🇩🇰

---

*This document is inspired by other open-source projects and adapted for the specific needs of API documentation. It will evolve as the project grows.*