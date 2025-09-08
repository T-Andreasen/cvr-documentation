# Danish CVR Registry API Documentation

[![Documentation](https://img.shields.io/badge/docs-available-brightgreen)](https://brokk-sindre.github.io/cvr-documentation/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MkDocs](https://img.shields.io/badge/built%20with-MkDocs-brightgreen)](https://www.mkdocs.org/)

> **Comprehensive documentation for the Danish Central Business Register (CVR) Elasticsearch API**

This repository contains complete documentation for Denmark's official business registry API, including field references, query examples, and production-ready implementation guides.

## 🚀 Quick Links

- **📚 [Live Documentation](https://brokk-sindre.github.io/cvr-documentation/)** - Complete API documentation
- **🔐 [Authentication Guide](https://brokk-sindre.github.io/cvr-documentation/getting-started/authentication/)** - How to get API access
- **⚡ [Quick Start](https://brokk-sindre.github.io/cvr-documentation/getting-started/quick-start/)** - Get up and running in minutes
- **📖 [Query Cookbook](https://brokk-sindre.github.io/cvr-documentation/queries/cookbook/)** - 30+ real-world examples

## 📊 What's Included

### Complete API Coverage
- **2.2M+ Companies** (Virksomhed) - Complete business profiles
- **1.7M+ Participants** (Deltager) - Owners, directors, board members
- **2.8M+ Production Units** (Produktionsenhed) - Branch offices and facilities
- **200+ Documented Fields** - Types, structures, and examples

### Production-Ready Implementation
- **Code samples** in Python, JavaScript, Bash, Java, Go, and PHP
- **Error handling** patterns and retry logic
- **Rate limiting** and caching strategies
- **Docker & Kubernetes** deployment examples
- **Monitoring** and testing approaches

### Advanced Query Capabilities
- Complex Elasticsearch queries with boolean logic
- Fuzzy search for handling typos and variations
- Nested queries for hierarchical data structures
- Aggregations for business intelligence and analytics

## 🏗️ Repository Structure

```
cvr-api-docs/
├── docs/                          # MkDocs documentation source
│   ├── getting-started/           # Authentication, quick start
│   ├── api-reference/             # Endpoints, data models, fields
│   ├── queries/                   # Query examples and cookbook
│   ├── implementation/            # Production code samples
│   └── resources/                 # Alternative APIs, support
├── mkdocs.yml                     # MkDocs configuration
├── requirements.txt               # Python dependencies
├── .github/workflows/             # GitHub Actions for deployment
└── README.md                      # This file
```

## 🛠️ Local Development

### Prerequisites

- Python 3.8+
- pip

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Brokk-Sindre/cvr-documentation.git
   cd cvr-documentation
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Serve locally**:
   ```bash
   mkdocs serve
   ```

4. **Open in browser**:
   ```
   http://127.0.0.1:8000
   ```

### Building

```bash
mkdocs build
```

The built site will be in the `site/` directory.

## 🔐 CVR API Access

!!! warning \"Credentials Required\"
    This documentation covers a **restricted API** that requires credentials from the Danish Business Authority.

### How to Get Access

1. **Email**: `cvrselvbetjening@erst.dk`
2. **Include**: Organization name, use case, expected volume
3. **Wait**: Processing may take several business days

### Security Notice

- **Never commit credentials** to version control
- Use environment variables for authentication
- Follow the [security best practices](https://your-username.github.io/cvr-api-docs/getting-started/authentication/#security-best-practices) in the documentation

## 📄 Documentation Features

### 🎯 Beginner-Friendly
- Step-by-step authentication setup
- Clear explanations of Danish business concepts
- Error handling with solutions
- Copy-paste code examples

### 🔍 Comprehensive Reference
- Complete field mappings for all indices
- Enum reference with frequencies and meanings  
- Cross-index relationship documentation
- Performance optimization guidelines

### 💻 Production-Ready
- Multi-language implementation examples
- Docker and Kubernetes configurations
- Monitoring and alerting setup
- Testing and validation patterns

## 🤝 Contributing

We welcome contributions to improve this documentation!

### Ways to Contribute

- **Report issues** with the documentation or examples
- **Suggest improvements** to code samples or explanations
- **Add new query examples** for common use cases
- **Translate content** to other languages
- **Fix typos** and improve clarity

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test locally: `mkdocs serve`
5. Submit a pull request

### Code of Conduct

Please be respectful and professional in all interactions. This is a community resource for developers working with Danish business data.

## 📝 License

This documentation is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## ⚠️ Disclaimer

This documentation is **community-maintained** and not officially endorsed by:
- The Danish Business Authority (Erhvervsstyrelsen)
- The Danish Agency for Digital Government (Digitaliseringsstyrelsen)
- Any other Danish government entity

While based on extensive testing and real-world usage, please verify critical information with official sources.

## 🔗 Related Resources

### Official Resources
- [Official CVR Portal](https://datacvr.virk.dk/data/) - Web interface for manual lookups
- [CVR Support](mailto:cvrselvbetjening@erst.dk) - Official API support

### Alternative APIs
- [CVR.dev](https://cvr.dev) - Modern REST API alternative
- [Virk.dk Python Package](https://github.com/magenta-aps/virk.dk) - High-level Python wrapper

### Community
- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Community Q&A and usage patterns

---

**Made with ❤️ for the Danish developer community**

*Help us improve this documentation by contributing examples, fixes, and feedback!*