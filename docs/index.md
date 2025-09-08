# Danish CVR Registry API Documentation

Welcome to the comprehensive documentation for the **Danish Central Business Register (CVR) API**. This documentation provides everything you need to integrate with Denmark's official business registry through its Elasticsearch-based REST API.

!!! info "Official Business Registry"
    The CVR (Central Virksomhedsregister) contains official information about all businesses registered in Denmark, including companies, sole proprietorships, associations, and production units.

## What's Covered

### 📚 Complete API Reference
- **2.2M+ Companies** (Virksomhed) with full business data
- **1.7M+ Participants** (Deltager) including owners, directors, and board members  
- **2.8M+ Production Units** (Produktionsenhed) for branch offices and facilities
- **200+ documented fields** with types, structures, and examples

### 🔍 Advanced Query Capabilities
- Complex Elasticsearch queries with boolean logic
- Fuzzy search for handling typos and variations
- Nested queries for hierarchical data structures
- Aggregations for business intelligence and analytics
- **30+ practical query examples** for real-world scenarios

### 💻 Production-Ready Implementation
- Code samples in **Python, JavaScript, Bash, Java, Go, and PHP**
- Error handling and retry logic patterns
- Rate limiting and caching strategies
- Docker and Kubernetes deployment examples
- Monitoring and testing approaches

## Quick Start

=== "Get Credentials"

    Contact the Danish Business Authority to obtain API access:
    
    ```bash
    Email: cvrselvbetjening@erst.dk
    Subject: CVR API Access Request
    ```

=== "Set Environment Variables"

    ```bash
    export CVR_USERNAME="your_username"
    export CVR_PASSWORD="your_password"
    ```

=== "Test Connection"

    ```bash
    curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
      -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
      -H 'Content-Type: application/json' \
      -d '{"size": 1}'
    ```

## Data Overview

| Index | Content | Records | Use Cases |
|-------|---------|---------|-----------|
| **Virksomhed** | Companies | 2,194,982 | Business lookup, compliance, market research |
| **Deltager** | Participants | 1,772,344 | Ownership analysis, governance, due diligence |
| **Produktionsenhed** | Production Units | 2,787,126 | Location analysis, employment data, operations |

## Key Features

### 🎯 **Comprehensive Business Data**
- Complete company profiles with historical changes
- Ownership structures and corporate governance
- Financial information and company status
- Address and contact information
- Industry classifications (NACE codes)

### ⚡ **Powerful Search & Analytics**
- Real-time data access via Elasticsearch
- Complex queries with multiple criteria
- Aggregation capabilities for trend analysis
- Fuzzy matching for user-friendly searches
- Temporal queries for historical analysis

### 🛠️ **Developer-Friendly**
- RESTful JSON API
- Comprehensive field documentation
- Production-ready code examples
- Error handling best practices
- Performance optimization guidelines

## Getting Started

Choose your path based on your needs:

<div class="grid cards" markdown>

-   :material-rocket-launch: **Quick Start Guide**

    ---

    Get up and running in minutes with basic queries and authentication setup.

    [:octicons-arrow-right-24: Quick Start](getting-started/quick-start.md)

-   :material-book-open: **API Reference**

    ---

    Comprehensive reference for all endpoints, data models, and field specifications.

    [:octicons-arrow-right-24: API Reference](api-reference/endpoints.md)

-   :material-code-braces: **Implementation Guide**

    ---

    Production-ready code samples and best practices for your preferred language.

    [:octicons-arrow-right-24: Implementation](implementation/python.md)

-   :material-database-search: **Query Cookbook**

    ---

    30+ real-world examples for business intelligence and data analysis.

    [:octicons-arrow-right-24: Query Examples](queries/cookbook.md)

</div>

## Recent Updates

!!! tip "Documentation Updates"
    This documentation is regularly updated based on API testing and user feedback. Last updated: **September 2024**

- ✅ Complete field mappings for all three indices
- ✅ Advanced Elasticsearch query patterns documented  
- ✅ Error handling catalog with solutions
- ✅ Production deployment examples
- ✅ Security best practices

## Support & Community

- **Official Support**: [cvrselvbetjening@erst.dk](mailto:cvrselvbetjening@erst.dk)
- **Official Portal**: [datacvr.virk.dk](https://datacvr.virk.dk/data/)
- **GitHub**: Report issues and contribute improvements
- **Alternative API**: [cvr.dev](https://cvr.dev) for modern REST interface

---

*This documentation is community-maintained and provides comprehensive coverage of the Danish CVR Registry API. While not officially endorsed by the Danish Business Authority, it's based on extensive testing and real-world usage.*