# Quick Start Guide

Get up and running with the Danish CVR Registry API in minutes.

## Prerequisites

- ✅ Valid CVR API credentials ([How to get them](authentication.md))
- ✅ Environment variables set up
- ✅ Network access to `http://distribution.virk.dk`

## Your First API Call

Let's start with the simplest possible query - getting one company record:

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{"size": 1}'
```

!!! success "Expected Result"
    You should see a JSON response with one company record and metadata about the total number of companies (~2.2 million).

## Basic Company Lookup

### Search by CVR Number

Every Danish company has a unique CVR number. Here's how to look up a specific company:

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "Vrvirksomhed.cvrNummer": "10103940"
      }
    }
  }'
```

This searches for the Danish Prime Minister's Office (Statsministeriet).

### Search by Company Name

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "Vrvirksomhed.navne.navn": "Novo Nordisk"
      }
    },
    "size": 5
  }'
```

This finds companies with "Novo Nordisk" in their name.

## Understanding the Response

A typical response looks like this:

```json
{
  "took": 16,                          // Query execution time (ms)
  "timed_out": false,                  // Whether query timed out
  "_shards": {                         // Elasticsearch shard info
    "total": 6,
    "successful": 6,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 1,                        // Number of matching documents
    "max_score": 1.0,                  // Relevance score
    "hits": [                          // Array of results
      {
        "_index": "cvr-v-20220630",    // Physical index name
        "_type": "_doc",               // Document type
        "_id": "4004315821",           // Internal document ID
        "_score": 1.0,                 // Relevance score for this doc
        "_source": {                   // The actual company data
          "Vrvirksomhed": {
            "cvrNummer": 10103940,
            "navne": [
              {
                "navn": "Statsministeriet",
                "periode": {
                  "gyldigFra": "2001-01-01",
                  "gyldigTil": null        // null = currently valid
                }
              }
            ]
            // ... more fields
          }
        }
      }
    ]
  }
}
```

### Key Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| `cvrNummer` | Unique company identifier | `10103940` |
| `navne` | Company names (with validity periods) | Array of name objects |
| `virksomhedsstatus` | Company status | `"NORMAL"`, `"UNDER KONKURS"` |
| `beliggenhedsadresse` | Physical address | Array of address objects |
| `virksomhedsform` | Company type | `80` (ApS), `60` (A/S) |

## Filtering Results

### Get Only Specific Fields

To reduce response size and get only the data you need:

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "Vrvirksomhed.navne.navn": "Novo Nordisk"
      }
    },
    "_source": [
      "Vrvirksomhed.cvrNummer",
      "Vrvirksomhed.navne",
      "Vrvirksomhed.virksomhedsstatus"
    ],
    "size": 5
  }'
```

### Filter by Company Status

Get only active companies:

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
      }
    },
    "size": 10
  }'
```

## Working with Other Indices

The CVR API has three main indices:

### Participants (People and Organizations)

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/deltager/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "Vrdeltagerperson.navne.navn": "Peter Schmidt"
      }
    },
    "size": 5
  }'
```

### Production Units (Branch Offices)

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/produktionsenhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "VrproduktionsEnhed.virksomhedsrelation.cvrNummer": "10103940"
      }
    },
    "size": 5
  }'
```

## Common Patterns

### Fuzzy Search for Typos

Handle typos in company names:

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "Vrvirksomhed.navne.navn": {
          "query": "Novo Nordysk",
          "fuzziness": "AUTO"
        }
      }
    }
  }'
```

### Combine Multiple Criteria

Find active ApS companies in Copenhagen:

```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "bool": {
        "must": [
          {
            "term": {
              "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
            }
          },
          {
            "term": {
              "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80
            }
          },
          {
            "term": {
              "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode": 101
            }
          }
        ]
      }
    },
    "size": 10
  }'
```

## Error Handling

### Result Limit (3000 Documents)

If you request more than 3000 documents, you'll get an error:

```json
{
  "error": {
    "type": "search_phase_execution_exception",
    "reason": "Result window is too large, from + size must be less than or equal to: [3000]"
  },
  "status": 500
}
```

**Solution**: Use the scroll API for large datasets (see [Advanced Queries](../queries/advanced-queries.md)).

### Authentication Issues

If you see a 401 error, check your credentials:

```bash
# Verify environment variables are set
echo "Username: $CVR_USERNAME"
echo "Password: $CVR_PASSWORD"

# Test with explicit credentials (for debugging only)
curl -u "your_actual_username:your_actual_password" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -d '{"size": 1}'
```

## Next Steps

Now that you have basic queries working:

### Learn More Query Types
- [Basic Queries](../queries/basic-queries.md) - Text search, filtering, sorting
- [Advanced Queries](../queries/advanced-queries.md) - Complex boolean logic, nested queries  
- [Query Cookbook](../queries/cookbook.md) - 30+ real-world examples

### Understand the Data
- [Field Reference](../api-reference/field-reference.md) - Complete field documentation
- [Data Models](../api-reference/data-models.md) - Structure and relationships
- [Enum Reference](../api-reference/enum-reference.md) - Codes and their meanings

### Production Implementation
- [Python Implementation](../implementation/python.md) - Full Python client
- [JavaScript Implementation](../implementation/javascript.md) - Node.js examples
- [Best Practices](../implementation/best-practices.md) - Error handling, caching, monitoring

## Quick Reference

### Essential Endpoints

| Purpose | Endpoint | Example Query |
|---------|----------|---------------|
| Companies | `/virksomhed/_search` | Find by CVR number or name |
| Participants | `/deltager/_search` | Find owners, directors |
| Production Units | `/produktionsenhed/_search` | Find branch offices |

### Key Field Paths

| Data | Field Path | Description |
|------|------------|-------------|
| CVR Number | `Vrvirksomhed.cvrNummer` | Unique company ID |
| Company Name | `Vrvirksomhed.navne.navn` | Current/historical names |
| Status | `Vrvirksomhed.virksomhedsstatus.status` | Active/dissolved/etc |
| Company Type | `Vrvirksomhed.virksomhedsform.virksomhedsformkode` | ApS=80, A/S=60, etc |
| Municipality | `Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode` | Location code |

### Common Status Values

| Status | Meaning |
|--------|---------|
| `NORMAL` | Active company |
| `UNDER KONKURS` | Under bankruptcy |
| `TVANGSOPLØST` | Forcibly dissolved |
| `OPLØST EFTER KONKURS` | Dissolved after bankruptcy |