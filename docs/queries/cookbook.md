# CVR API Query Cookbook

This cookbook provides 30+ practical, tested query examples for the Danish CVR Registry Elasticsearch API. Each example includes business use cases, complete working queries, expected responses, and performance notes.

## Table of Contents

- [Business Intelligence Queries](#business-intelligence-queries)
- [Compliance and Research Queries](#compliance-and-research-queries)
- [Data Mining Queries](#data-mining-queries)
- [Advanced Query Patterns](#advanced-query-patterns)
- [Performance Best Practices](#performance-best-practices)

---

## Authentication and Base URL

All queries require Basic Authentication:

```bash
Username: YOUR_CVR_USERNAME
Password: YOUR_CVR_PASSWORD
Base URL: http://distribution.virk.dk/cvr-permanent
```

---

## Business Intelligence Queries

### 1. Find Companies by Industry and Location

**Use Case**: Market research - identify all IT companies in Copenhagen for competitive analysis.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        },
        {
          "terms": {
            "Vrvirksomhed.hovedbranche.branchekode": ["620100", "620200", "620900"]
          }
        }
      ],
      "filter": [
        {
          "nested": {
            "path": "Vrvirksomhed.beliggenhedsadresse",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode": 101
                    }
                  },
                  {
                    "bool": {
                      "must_not": {
                        "exists": {
                          "field": "Vrvirksomhed.beliggenhedsadresse.periode.gyldigTil"
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.hovedbranche",
    "Vrvirksomhed.beliggenhedsadresse"
  ],
  "size": 100
}
```

**Expected Response Structure**:
```json
{
  "hits": {
    "total": 1250,
    "hits": [
      {
        "_source": {
          "Vrvirksomhed": {
            "cvrNummer": 12345678,
            "navne": [{"navn": "Tech Company ApS"}],
            "hovedbranche": [{"branchekode": "620100", "branchetekst": "Computerprogrammering"}]
          }
        }
      }
    ]
  }
}
```

**Performance Notes**:
- Use `terms` query for multiple industry codes instead of multiple `term` queries
- Filter by current address using nested query with validity period check
- Limit `_source` fields to reduce response size

**Variations**:
- Replace municipality code 101 (Copenhagen) with other codes (see documentation for full list)
- Add company form filter: `{"term": {"Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80}}`
- Include secondary industries: add `Vrvirksomhed.bibranche1.branchekode` to the search

---

### 2. Analyze Company Growth Trends Over Time

**Use Case**: Market analysis - track new business registrations in specific sectors by month/year.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
              "gte": "2020-01-01",
              "lte": "2023-12-31"
            }
          }
        },
        {
          "term": {
            "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80
          }
        }
      ]
    }
  },
  "size": 0,
  "aggs": {
    "establishment_by_month": {
      "date_histogram": {
        "field": "Vrvirksomhed.livsforloeb.periode.gyldigFra",
        "interval": "month",
        "format": "yyyy-MM",
        "min_doc_count": 1
      },
      "aggs": {
        "by_industry": {
          "terms": {
            "field": "Vrvirksomhed.hovedbranche.branchekode",
            "size": 10
          }
        }
      }
    }
  }
}
```

**Expected Response Structure**:
```json
{
  "aggregations": {
    "establishment_by_month": {
      "buckets": [
        {
          "key_as_string": "2020-01",
          "doc_count": 1250,
          "by_industry": {
            "buckets": [
              {"key": "620100", "doc_count": 150},
              {"key": "702200", "doc_count": 120}
            ]
          }
        }
      ]
    }
  }
}
```

**Performance Notes**:
- Set `size: 0` to skip document retrieval, focusing on aggregations
- Use `min_doc_count: 1` to exclude empty time periods
- Limit industry aggregation size to prevent memory issues

**Common Pitfalls**:
- Don't use too granular intervals (daily) for large date ranges - causes memory pressure
- Always set date range limits to avoid processing entire dataset

---

### 3. Identify Investment Opportunities

**Use Case**: Investment analysis - find young, growing ApS companies with significant capital.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80
          }
        },
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        },
        {
          "range": {
            "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
              "gte": "2018-01-01"
            }
          }
        }
      ],
      "filter": [
        {
          "nested": {
            "path": "Vrvirksomhed.attributter",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "Vrvirksomhed.attributter.type": "KAPITAL"
                    }
                  },
                  {
                    "range": {
                      "Vrvirksomhed.attributter.vaerdier.vaerdi": {
                        "gte": "1000000.00"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
        "order": "desc"
      }
    }
  ],
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.attributter",
    "Vrvirksomhed.livsforloeb",
    "Vrvirksomhed.hovedbranche"
  ],
  "size": 50
}
```

**Performance Notes**:
- Nested query on attributes is expensive - use filter context when possible
- Sort by establishment date to prioritize recent companies
- String-based range queries on capital amounts work due to zero-padding

**Variations**:
- Add employment growth filter using production units
- Include website requirement: `{"exists": {"field": "Vrvirksomhed.hjemmeside"}}`
- Filter by specific regions or exclude certain industries

---

### 4. Track Ownership Changes

**Use Case**: Corporate intelligence - monitor when companies change directors or ownership structure.

**Query**:
```json
POST /cvr-permanent/deltager/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "Vrdeltager.navne.navn": "Jensen"
          }
        },
        {
          "exists": {
            "field": "Vrdeltager.organisationer"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "Vrdeltager.organisationer.medlemsData.attributter.vaerdier.periode.gyldigFra": {
              "gte": "2023-01-01"
            }
          }
        }
      ]
    }
  },
  "_source": [
    "Vrdeltager.navne",
    "Vrdeltager.organisationer",
    "Vrdeltager.enhedsNummer"
  ],
  "size": 100
}
```

**Performance Notes**:
- Participant searches are complex due to nested organizational structures
- Use broad name matches and post-filter results in application
- Consider caching frequent participant lookups

**Common Pitfalls**:
- Participant data structure varies significantly between records
- Historical data may be incomplete for older appointments

---

### 5. Employment Analysis by Region

**Use Case**: Regional economic analysis - understand employment distribution across Danish municipalities.

**Query**:
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus": "Aktiv"
          }
        },
        {
          "range": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {
              "gte": 2024
            }
          }
        }
      ]
    }
  },
  "size": 0,
  "aggs": {
    "by_municipality": {
      "terms": {
        "field": "VrproduktionsEnhed.beliggenhedsadresse.kommune.kommuneNavn",
        "size": 20,
        "order": {
          "total_employees": "desc"
        }
      },
      "aggs": {
        "total_employees": {
          "sum": {
            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte"
          }
        },
        "avg_employees_per_unit": {
          "avg": {
            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte"
          }
        },
        "by_industry": {
          "terms": {
            "field": "VrproduktionsEnhed.hovedbranche.branchekode",
            "size": 5
          }
        }
      }
    }
  }
}
```

**Expected Response Structure**:
```json
{
  "aggregations": {
    "by_municipality": {
      "buckets": [
        {
          "key": "KØBENHAVN",
          "doc_count": 25000,
          "total_employees": {"value": 150000},
          "avg_employees_per_unit": {"value": 6.0},
          "by_industry": {
            "buckets": [{"key": "620100", "doc_count": 1200}]
          }
        }
      ]
    }
  }
}
```

**Performance Notes**:
- Production unit queries scale better than company queries for employment data
- Use latest employment data (`erstMaanedsbeskaeftigelse`) for most current figures
- Order aggregations by calculated metrics to show economic centers first

---

## Compliance and Research Queries

### 6. Find All Companies Owned by Specific Person

**Use Case**: Due diligence - identify all business interests of an individual.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.deltagerRelation",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "Vrvirksomhed.deltagerRelation.deltager.navne.navn": "Mads Christensen"
              }
            },
            {
              "terms": {
                "Vrvirksomhed.deltagerRelation.organisationer.medlemsData.attributter.vaerdier.vaerdi": [
                  "DIREKTION", 
                  "BESTYRELSESMEDLEM", 
                  "EJER"
                ]
              }
            }
          ]
        }
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsform",
    "Vrvirksomhed.deltagerRelation"
  ],
  "size": 50,
  "sort": [
    {
      "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
        "order": "desc"
      }
    }
  ]
}
```

**Performance Notes**:
- Nested queries on participant relations are computationally expensive
- Use specific role terms to filter results effectively
- Consider fuzzy matching for name variations: `"fuzziness": 1`

**Variations**:
- Add current role filter: `{"bool": {"must_not": {"exists": {"field": "...periode.gyldigTil"}}}}`
- Filter by active companies only
- Include ownership percentage if available in attributes

---

### 7. Identify Companies in Liquidation

**Use Case**: Risk assessment - find companies entering liquidation processes.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "UNDER FRIVILLIG LIKVIDATION"
          }
        },
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "UNDER TVANGSOPLØSNING"
          }
        },
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "UNDER KONKURS"
          }
        }
      ],
      "minimum_should_match": 1
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsstatus",
    "Vrvirksomhed.virksomhedsform",
    "Vrvirksomhed.beliggenhedsadresse"
  ],
  "sort": [
    {
      "Vrvirksomhed.virksomhedsstatus.periode.gyldigFra": {
        "order": "desc"
      }
    }
  ],
  "size": 100
}
```

**Expected Response Structure**:
```json
{
  "hits": {
    "hits": [
      {
        "_source": {
          "Vrvirksomhed": {
            "cvrNummer": 12345678,
            "navne": [{"navn": "Company in Liquidation ApS"}],
            "virksomhedsstatus": [{
              "status": "UNDER FRIVILLIG LIKVIDATION",
              "periode": {"gyldigFra": "2024-03-15"}
            }]
          }
        }
      }
    ]
  }
}
```

**Performance Notes**:
- Multiple status checks are efficient using `should` clause
- Sort by status change date to prioritize recent developments
- Consider adding date range filter for recent liquidations only

---

### 8. Track Director Appointments

**Use Case**: Corporate governance - monitor new director appointments across industries.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.deltagerRelation",
      "query": {
        "nested": {
          "path": "Vrvirksomhed.deltagerRelation.organisationer",
          "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "Vrvirksomhed.deltagerRelation.organisationer.organisationsNavn.navn": "Direktion"
                  }
                },
                {
                  "range": {
                    "Vrvirksomhed.deltagerRelation.organisationer.medlemsData.attributter.vaerdier.periode.gyldigFra": {
                      "gte": "2024-01-01"
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.deltagerRelation",
    "Vrvirksomhed.hovedbranche"
  ],
  "size": 100
}
```

**Performance Notes**:
- Double-nested query structure requires careful indexing
- Use date ranges to limit search scope and improve performance
- Consider creating application-level caches for frequent director searches

**Common Pitfalls**:
- Nested paths can be confusing - test queries carefully
- Historical data completeness varies by company age and type

---

### 9. Find Foreign-Owned Companies

**Use Case**: International business analysis - identify companies with foreign ownership or management.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "nested": {
            "path": "Vrvirksomhed.beliggenhedsadresse",
            "query": {
              "bool": {
                "must_not": {
                  "term": {
                    "Vrvirksomhed.beliggenhedsadresse.landekode": "DK"
                  }
                }
              }
            }
          }
        },
        {
          "terms": {
            "Vrvirksomhed.virksomhedsform.virksomhedsformkode": [170, 180, 190, 210, 520]
          }
        }
      ],
      "minimum_should_match": 1,
      "filter": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        }
      ]
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsform",
    "Vrvirksomhed.beliggenhedsadresse"
  ],
  "size": 100
}
```

**Performance Notes**:
- Use company form codes to efficiently identify foreign entities
- Combine with address-based detection for comprehensive results
- Form codes 170, 180, 190 are branches of foreign companies

**Variations**:
- Add specific country filters: `{"term": {"...landekode": "DE"}}`
- Include participant nationality checks for deeper analysis
- Filter by industry to focus on specific sectors

---

### 10. Audit Company Relationships

**Use Case**: Corporate structure analysis - map complex ownership and subsidiary relationships.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "Vrvirksomhed.cvrNummer": "12345678"
          }
        }
      ]
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.deltagerRelation",
    "Vrvirksomhed.penheder"
  ]
}
```

**Follow-up Query for Subsidiaries**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.deltagerRelation",
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "Vrvirksomhed.deltagerRelation.deltager.enhedsNummer": "FOUND_ENTITY_NUMBER"
              }
            }
          ]
        }
      }
    }
  }
}
```

**Performance Notes**:
- Relationship mapping requires multiple queries
- Cache intermediate results to avoid repeated API calls
- Consider using application-level graph databases for complex relationship analysis

---

## Data Mining Queries

### 11. Companies with Specific Attributes

**Use Case**: Specialized search - find companies with specific characteristics like audit waivers or capital classes.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.attributter",
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "Vrvirksomhed.attributter.type": "REVISION_FRAVALGT"
              }
            },
            {
              "term": {
                "Vrvirksomhed.attributter.vaerdier.vaerdi": "true"
              }
            }
          ]
        }
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.attributter",
    "Vrvirksomhed.virksomhedsform"
  ],
  "size": 100
}
```

**Expected Response Structure**:
```json
{
  "hits": {
    "hits": [
      {
        "_source": {
          "Vrvirksomhed": {
            "cvrNummer": 12345678,
            "navne": [{"navn": "Small Company ApS"}],
            "attributter": [{
              "type": "REVISION_FRAVALGT",
              "vaerdier": [{"vaerdi": "true"}]
            }]
          }
        }
      }
    ]
  }
}
```

**Performance Notes**:
- Attribute searches are powerful but can be slow on large datasets
- Use multiple attribute filters to narrow results effectively
- Consider aggregations to understand attribute distributions first

**Common Attribute Types to Search**:
- `REVISION_FRAVALGT`: Audit waiver (boolean)
- `KAPITALKLASSER`: Capital classes (string)
- `SOCIAL_ØKONOMISK_VIRKSOMHED`: Social enterprise (boolean)
- `OMFATTET_AF_LOV_OM_HVIDVASK_OG_TERRORFINANSIERING`: AML compliance (boolean)

---

### 12. Geographic Business Distribution

**Use Case**: Market research - analyze business density and types across Denmark's regions.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "term": {
      "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
    }
  },
  "size": 0,
  "aggs": {
    "by_region": {
      "nested": {
        "path": "Vrvirksomhed.beliggenhedsadresse"
      },
      "aggs": {
        "current_addresses": {
          "filter": {
            "bool": {
              "must_not": {
                "exists": {
                  "field": "Vrvirksomhed.beliggenhedsadresse.periode.gyldigTil"
                }
              }
            }
          },
          "aggs": {
            "municipalities": {
              "terms": {
                "field": "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneNavn",
                "size": 50
              },
              "aggs": {
                "postal_districts": {
                  "terms": {
                    "field": "Vrvirksomhed.beliggenhedsadresse.postdistrikt",
                    "size": 10
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**Expected Response Structure**:
```json
{
  "aggregations": {
    "by_region": {
      "current_addresses": {
        "municipalities": {
          "buckets": [
            {
              "key": "KØBENHAVN",
              "doc_count": 45000,
              "postal_districts": {
                "buckets": [
                  {"key": "København K", "doc_count": 8500},
                  {"key": "København Ø", "doc_count": 6200}
                ]
              }
            }
          ]
        }
      }
    }
  }
}
```

**Performance Notes**:
- Nested aggregations on addresses can be memory-intensive
- Filter for current addresses to avoid counting historical locations
- Use reasonable `size` limits on aggregations to control response size

---

### 13. Industry Sector Analysis

**Use Case**: Economic research - understand industry composition and trends in the Danish economy.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        },
        {
          "exists": {
            "field": "Vrvirksomhed.hovedbranche"
          }
        }
      ]
    }
  },
  "size": 0,
  "aggs": {
    "by_main_industry": {
      "terms": {
        "field": "Vrvirksomhed.hovedbranche.branchekode",
        "size": 100
      },
      "aggs": {
        "by_company_form": {
          "terms": {
            "field": "Vrvirksomhed.virksomhedsform.virksomhedsformkode",
            "size": 10
          }
        },
        "establishment_years": {
          "date_histogram": {
            "field": "Vrvirksomhed.livsforloeb.periode.gyldigFra",
            "interval": "year",
            "format": "yyyy",
            "min_doc_count": 1
          }
        }
      }
    }
  }
}
```

**Performance Notes**:
- Industry code analysis provides valuable economic insights
- Combine with establishment dates to track industry growth
- Use sub-aggregations to understand company type distribution per industry

**Variations**:
- Focus on specific industry sectors: `{"prefix": {"...branchekode": "62"}}`
- Add geographic breakdown within industries
- Include employment data from production units

---

### 14. Company Size Analysis

**Use Case**: Business demographics - analyze the distribution of company sizes across different sectors.

**Query**:
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus": "Aktiv"
          }
        },
        {
          "range": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {
              "gte": 2024
            }
          }
        }
      ]
    }
  },
  "size": 0,
  "aggs": {
    "by_employee_range": {
      "terms": {
        "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.intervalKodeAntalAnsatte",
        "size": 20
      },
      "aggs": {
        "by_industry": {
          "terms": {
            "field": "VrproduktionsEnhed.hovedbranche.branchekode",
            "size": 10
          }
        },
        "avg_full_time_equivalent": {
          "avg": {
            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAarsvaerk"
          }
        }
      }
    }
  }
}
```

**Expected Response Structure**:
```json
{
  "aggregations": {
    "by_employee_range": {
      "buckets": [
        {
          "key": "ANTAL_1_1",
          "doc_count": 45000,
          "by_industry": {
            "buckets": [{"key": "620100", "doc_count": 2500}]
          },
          "avg_full_time_equivalent": {"value": 1.0}
        },
        {
          "key": "ANTAL_2_4",
          "doc_count": 25000,
          "avg_full_time_equivalent": {"value": 2.8}
        }
      ]
    }
  }
}
```

**Performance Notes**:
- Employee interval codes provide efficient size categorization
- Use latest employment data for current business landscape
- Combine with industry analysis for sector-specific insights

---

### 15. Historical Trend Analysis

**Use Case**: Economic research - track business formation, dissolution, and industry shifts over time.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "range": {
      "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
        "gte": "2015-01-01",
        "lte": "2024-12-31"
      }
    }
  },
  "size": 0,
  "aggs": {
    "formations_by_year": {
      "date_histogram": {
        "field": "Vrvirksomhed.livsforloeb.periode.gyldigFra",
        "interval": "year",
        "format": "yyyy"
      },
      "aggs": {
        "by_status": {
          "terms": {
            "field": "Vrvirksomhed.virksomhedsform.virksomhedsformkode"
          }
        },
        "by_industry_category": {
          "terms": {
            "script": {
              "source": "doc['Vrvirksomhed.hovedbranche.branchekode'].value.substring(0,2)"
            }
          }
        }
      }
    }
  }
}
```

**Performance Notes**:
- Use script-based aggregation to group industry codes by sector (first 2 digits)
- Date histogram aggregations are efficient for temporal analysis
- Consider memory usage when aggregating across long time periods

**Common Pitfalls**:
- Scripts can be disabled on some Elasticsearch versions - test first
- Large date ranges may require scrolling through results
- Ensure date format consistency in queries

---

## Advanced Query Patterns

### 16. Multi-Index Relationship Queries

**Use Case**: Complete business analysis - combine company, production unit, and participant data for comprehensive view.

**Step 1: Get Company Information**
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "term": {
      "Vrvirksomhed.cvrNummer": "12345678"
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsform",
    "Vrvirksomhed.deltagerRelation"
  ]
}
```

**Step 2: Get Production Units**
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "term": {
      "VrproduktionsEnhed.virksomhedsrelation.cvrNummer": "12345678"
    }
  },
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.navne",
    "VrproduktionsEnhed.beliggenhedsadresse",
    "VrproduktionsEnhed.erstMaanedsbeskaeftigelse"
  ]
}
```

**Step 3: Get Participant Details** (if needed)
```json
POST /cvr-permanent/deltager/_search
{
  "query": {
    "term": {
      "Vrdeltager.enhedsNummer": "PARTICIPANT_ID_FROM_STEP_1"
    }
  }
}
```

**Performance Notes**:
- Multi-index queries require application-level coordination
- Cache intermediate results to avoid repeated API calls
- Consider batch processing for multiple company analyses

**Implementation Pattern**:
```python
def get_complete_company_info(cvr_number):
    # Step 1: Company data
    company_data = search_companies(cvr_number)
    
    # Step 2: Production units
    production_units = search_production_units(cvr_number)
    
    # Step 3: Participant details (if needed)
    participants = []
    for relation in company_data.get('deltagerRelation', []):
        participant_id = relation['deltager']['enhedsNummer']
        participant_data = search_participants(participant_id)
        participants.append(participant_data)
    
    return {
        'company': company_data,
        'production_units': production_units,
        'participants': participants
    }
```

---

### 17. Complex Aggregations

**Use Case**: Advanced analytics - multi-dimensional analysis combining geography, industry, size, and time.

**Query**:
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus": "Aktiv"
          }
        },
        {
          "range": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {
              "gte": 2023
            }
          }
        }
      ]
    }
  },
  "size": 0,
  "aggs": {
    "by_region": {
      "nested": {
        "path": "VrproduktionsEnhed.beliggenhedsadresse"
      },
      "aggs": {
        "current_addresses": {
          "filter": {
            "bool": {
              "must_not": {
                "exists": {
                  "field": "VrproduktionsEnhed.beliggenhedsadresse.periode.gyldigTil"
                }
              }
            }
          },
          "aggs": {
            "municipalities": {
              "terms": {
                "field": "VrproduktionsEnhed.beliggenhedsadresse.kommune.kommuneNavn",
                "size": 20
              },
              "aggs": {
                "by_industry_sector": {
                  "terms": {
                    "script": {
                      "source": "doc['VrproduktionsEnhed.hovedbranche.branchekode'].value.substring(0,2)"
                    },
                    "size": 10
                  },
                  "aggs": {
                    "by_size_category": {
                      "terms": {
                        "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.intervalKodeAntalAnsatte"
                      },
                      "aggs": {
                        "total_employment": {
                          "sum": {
                            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte"
                          }
                        },
                        "monthly_trend": {
                          "terms": {
                            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.maaned",
                            "order": {"_key": "asc"}
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**Expected Response Structure**:
```json
{
  "aggregations": {
    "by_region": {
      "current_addresses": {
        "municipalities": {
          "buckets": [
            {
              "key": "KØBENHAVN",
              "doc_count": 25000,
              "by_industry_sector": {
                "buckets": [
                  {
                    "key": "62",
                    "doc_count": 3500,
                    "by_size_category": {
                      "buckets": [
                        {
                          "key": "ANTAL_1_1",
                          "doc_count": 2000,
                          "total_employment": {"value": 2000},
                          "monthly_trend": {
                            "buckets": [
                              {"key": 1, "doc_count": 180},
                              {"key": 2, "doc_count": 175}
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
}
```

**Performance Notes**:
- Complex nested aggregations require significant memory
- Use appropriate `size` limits at each aggregation level
- Monitor query execution time and consider breaking into smaller queries

---

### 18. Temporal Data Analysis

**Use Case**: Business lifecycle analysis - track companies through their entire operational history.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "term": {
      "Vrvirksomhed.cvrNummer": "12345678"
    }
  },
  "_source": [
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsstatus",
    "Vrvirksomhed.beliggenhedsadresse",
    "Vrvirksomhed.hovedbranche",
    "Vrvirksomhed.deltagerRelation",
    "Vrvirksomhed.attributter"
  ]
}
```

**Python Processing Example**:
```python
def analyze_company_timeline(cvr_data):
    timeline = []
    
    # Extract all temporal events
    events = []
    
    # Name changes
    for name_record in cvr_data.get('navne', []):
        events.append({
            'date': name_record['periode']['gyldigFra'],
            'type': 'name_change',
            'value': name_record['navn'],
            'end_date': name_record['periode'].get('gyldigTil')
        })
    
    # Status changes
    for status_record in cvr_data.get('virksomhedsstatus', []):
        events.append({
            'date': status_record['periode']['gyldigFra'],
            'type': 'status_change',
            'value': status_record['status'],
            'end_date': status_record['periode'].get('gyldigTil')
        })
    
    # Address changes
    for addr_record in cvr_data.get('beliggenhedsadresse', []):
        events.append({
            'date': addr_record['periode']['gyldigFra'],
            'type': 'address_change',
            'value': f"{addr_record['vejnavn']} {addr_record['husnummerFra']}, {addr_record['postdistrikt']}",
            'end_date': addr_record['periode'].get('gyldigTil')
        })
    
    # Sort by date
    events.sort(key=lambda x: x['date'])
    
    return events
```

**Performance Notes**:
- Single company temporal analysis is efficient
- For bulk analysis, consider batch processing
- Use application-level caching for frequently accessed timelines

---

### 19. Nested Object Filtering

**Use Case**: Precise data extraction - find specific attributes within complex nested structures.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.attributter",
      "query": {
        "nested": {
          "path": "Vrvirksomhed.attributter.vaerdier",
          "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "Vrvirksomhed.attributter.type": "KAPITAL"
                  }
                },
                {
                  "range": {
                    "Vrvirksomhed.attributter.vaerdier.vaerdi": {
                      "gte": "5000000.00"
                    }
                  }
                },
                {
                  "bool": {
                    "must_not": {
                      "exists": {
                        "field": "Vrvirksomhed.attributter.vaerdier.periode.gyldigTil"
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.attributter"
  ],
  "size": 50
}
```

**Performance Notes**:
- Double-nested queries are expensive but precise
- Use current validity filters to focus on active data
- Consider denormalizing frequently accessed nested data

**Common Pitfalls**:
- Nested path specifications must match the exact field structure
- Forgetting validity period checks can return historical data
- Deep nesting levels can impact query performance significantly

---

### 20. Performance-Optimized Queries

**Use Case**: High-volume applications - efficient queries for applications processing large datasets.

**Optimized Query Pattern**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "filter": [
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
          "range": {
            "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
              "gte": "2020-01-01"
            }
          }
        }
      ]
    }
  },
  "_source": {
    "includes": [
      "Vrvirksomhed.cvrNummer",
      "Vrvirksomhed.navne.navn",
      "Vrvirksomhed.beliggenhedsadresse.postdistrikt"
    ],
    "excludes": [
      "Vrvirksomhed.deltagerRelation",
      "Vrvirksomhed.attributter"
    ]
  },
  "size": 100,
  "sort": [
    {
      "Vrvirksomhed.cvrNummer": {
        "order": "asc"
      }
    }
  ]
}
```

**Performance Optimization Techniques**:

1. **Use Filter Context**: Filters are cached and don't affect scoring
2. **Limit Source Fields**: Specify exactly which fields you need
3. **Appropriate Size Limits**: Don't retrieve more data than necessary
4. **Simple Sort Fields**: Use numeric or keyword fields for sorting
5. **Avoid Deep Nesting**: When possible, use flatter query structures

**Scroll API for Large Datasets**:
```bash
# Initial request
curl -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search?scroll=5m" \
  -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 1000,
    "query": {"match_all": {}},
    "_source": ["Vrvirksomhed.cvrNummer", "Vrvirksomhed.navne"]
  }'

# Subsequent requests
curl -X POST "http://distribution.virk.dk/cvr-permanent/_search/scroll" \
  -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -H 'Content-Type: application/json' \
  -d '{
    "scroll": "5m",
    "scroll_id": "YOUR_SCROLL_ID_HERE"
  }'
```

---

## Advanced Search Patterns

### 21. Fuzzy Company Name Search

**Use Case**: User-friendly search - handle typos and variations in company names.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "Vrvirksomhed.navne.navn": {
              "query": "Novo Nordisk",
              "fuzziness": "AUTO",
              "boost": 3.0
            }
          }
        },
        {
          "fuzzy": {
            "Vrvirksomhed.navne.navn": {
              "value": "Novo Nordisk",
              "fuzziness": 2,
              "boost": 1.0
            }
          }
        },
        {
          "wildcard": {
            "Vrvirksomhed.navne.navn": {
              "value": "novo*",
              "boost": 2.0
            }
          }
        }
      ]
    }
  },
  "highlight": {
    "fields": {
      "Vrvirksomhed.navne.navn": {
        "fragment_size": 100,
        "number_of_fragments": 1
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsform"
  ],
  "size": 20
}
```

**Expected Response Structure**:
```json
{
  "hits": {
    "hits": [
      {
        "_score": 8.5,
        "_source": {
          "Vrvirksomhed": {
            "cvrNummer": 24256790,
            "navne": [{"navn": "Novo Nordisk A/S"}]
          }
        },
        "highlight": {
          "Vrvirksomhed.navne.navn": ["<em>Novo Nordisk</em> A/S"]
        }
      }
    ]
  }
}
```

**Performance Notes**:
- Combine multiple fuzzy techniques with different boost values
- Use highlighting to show users why results matched
- Fuzzy queries are slower than exact matches - use appropriate size limits

---

### 22. Advanced Employment Analysis

**Use Case**: HR and recruitment - identify companies with specific employment characteristics and growth patterns.

**Query**:
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus": "Aktiv"
          }
        },
        {
          "range": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {
              "gte": 2023
            }
          }
        },
        {
          "terms": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.intervalKodeAntalAnsatte": [
              "ANTAL_10_19",
              "ANTAL_20_49",
              "ANTAL_50_99"
            ]
          }
        }
      ],
      "filter": [
        {
          "nested": {
            "path": "VrproduktionsEnhed.beliggenhedsadresse",
            "query": {
              "bool": {
                "must": [
                  {
                    "terms": {
                      "VrproduktionsEnhed.beliggenhedsadresse.kommune.kommuneKode": [101, 147, 151, 153, 157, 159, 161, 163, 165, 167, 169, 173, 175, 183, 185, 187, 190, 201, 210, 217, 219, 223, 230, 240, 250, 253, 259, 270]
                    }
                  },
                  {
                    "bool": {
                      "must_not": {
                        "exists": {
                          "field": "VrproduktionsEnhed.beliggenhedsadresse.periode.gyldigTil"
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte": {
        "order": "desc"
      }
    }
  ],
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.navne",
    "VrproduktionsEnhed.virksomhedsrelation.cvrNummer",
    "VrproduktionsEnhed.beliggenhedsadresse",
    "VrproduktionsEnhed.erstMaanedsbeskaeftigelse",
    "VrproduktionsEnhed.hovedbranche"
  ],
  "size": 100
}
```

**Performance Notes**:
- Filter by Greater Copenhagen area municipality codes for geographic focus
- Use employee size intervals for efficient filtering
- Sort by employment count to prioritize larger employers

**Municipality Codes for Greater Copenhagen Area**:
- 101: København
- 147: Frederiksberg  
- 151: Ballerup
- 157: Gentofte
- And others in the Capital Region

---

### 23. Industry Transition Analysis

**Use Case**: Economic research - identify companies that have changed their primary industry over time.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "script": {
            "script": {
              "source": "doc['Vrvirksomhed.hovedbranche.branchekode'].values.length > 1"
            }
          }
        }
      ]
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.hovedbranche",
    "Vrvirksomhed.livsforloeb"
  ],
  "size": 100
}
```

**Alternative Approach (if scripts disabled)**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "size": 0,
  "aggs": {
    "companies_with_industry_changes": {
      "terms": {
        "field": "Vrvirksomhed.cvrNummer",
        "min_doc_count": 1
      },
      "aggs": {
        "unique_industries": {
          "cardinality": {
            "field": "Vrvirksomhed.hovedbranche.branchekode"
          }
        },
        "industry_list": {
          "terms": {
            "field": "Vrvirksomhed.hovedbranche.branchekode"
          }
        }
      }
    }
  }
}
```

**Performance Notes**:
- Script queries may be disabled for security reasons
- Use aggregation-based approach as alternative
- Industry changes indicate business pivots or diversification

---

### 24. Compliance Risk Assessment

**Use Case**: Risk management - identify companies with potential compliance issues or business risks.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "terms": {
            "Vrvirksomhed.virksomhedsstatus.status": [
              "UNDER FRIVILLIG LIKVIDATION",
              "UNDER TVANGSOPLØSNING",
              "UNDER KONKURS"
            ]
          }
        },
        {
          "nested": {
            "path": "Vrvirksomhed.attributter",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "Vrvirksomhed.attributter.type": "REVISION_FRAVALGT"
                    }
                  },
                  {
                    "term": {
                      "Vrvirksomhed.attributter.vaerdier.vaerdi": "true"
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "bool": {
            "must_not": {
              "nested": {
                "path": "Vrvirksomhed.attributter",
                "query": {
                  "term": {
                    "Vrvirksomhed.attributter.type": "OMFATTET_AF_LOV_OM_HVIDVASK_OG_TERRORFINANSIERING"
                  }
                }
              }
            }
          }
        }
      ],
      "minimum_should_match": 1,
      "filter": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80
          }
        }
      ]
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsstatus",
    "Vrvirksomhed.attributter"
  ],
  "size": 100,
  "sort": [
    {
      "Vrvirksomhed.virksomhedsstatus.periode.gyldigFra": {
        "order": "desc"
      }
    }
  ]
}
```

**Risk Indicators Checked**:
1. Companies in liquidation or bankruptcy proceedings
2. Companies that have waived audit requirements
3. Companies not subject to anti-money laundering requirements (when expected)

**Performance Notes**:
- Multiple risk indicators provide comprehensive assessment
- Sort by status change date to prioritize recent developments
- Consider combining with external risk databases

---

### 25. Market Entry Analysis

**Use Case**: Business development - identify new market entrants and expansion opportunities.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
              "gte": "2023-01-01"
            }
          }
        },
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        },
        {
          "terms": {
            "Vrvirksomhed.hovedbranche.branchekode": ["620100", "620200", "702200", "741200"]
          }
        }
      ],
      "filter": [
        {
          "nested": {
            "path": "Vrvirksomhed.attributter",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "Vrvirksomhed.attributter.type": "KAPITAL"
                    }
                  },
                  {
                    "range": {
                      "Vrvirksomhed.attributter.vaerdier.vaerdi": {
                        "gte": "500000.00"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "by_establishment_month": {
      "date_histogram": {
        "field": "Vrvirksomhed.livsforloeb.periode.gyldigFra",
        "interval": "month",
        "format": "yyyy-MM"
      }
    },
    "by_industry": {
      "terms": {
        "field": "Vrvirksomhed.hovedbranche.branchekode"
      }
    },
    "by_location": {
      "nested": {
        "path": "Vrvirksomhed.beliggenhedsadresse"
      },
      "aggs": {
        "current_addresses": {
          "filter": {
            "bool": {
              "must_not": {
                "exists": {
                  "field": "Vrvirksomhed.beliggenhedsadresse.periode.gyldigTil"
                }
              }
            }
          },
          "aggs": {
            "municipalities": {
              "terms": {
                "field": "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneNavn",
                "size": 10
              }
            }
          }
        }
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.hovedbranche",
    "Vrvirksomhed.attributter",
    "Vrvirksomhed.livsforloeb"
  ],
  "size": 100
}
```

**Expected Response Structure**:
```json
{
  "hits": {
    "total": 450,
    "hits": [
      {
        "_source": {
          "Vrvirksomhed": {
            "cvrNummer": 43210987,
            "navne": [{"navn": "New Tech Startup ApS"}],
            "livsforloeb": [{"periode": {"gyldigFra": "2023-06-15"}}]
          }
        }
      }
    ]
  },
  "aggregations": {
    "by_establishment_month": {
      "buckets": [
        {"key_as_string": "2023-01", "doc_count": 45},
        {"key_as_string": "2023-02", "doc_count": 38}
      ]
    }
  }
}
```

**Performance Notes**:
- Focus on recent establishments with significant capital
- Target high-growth industries (IT, consulting, analysis)
- Use aggregations to identify trends and patterns

---

### 26. Supply Chain Analysis

**Use Case**: Business relationships - identify potential suppliers, customers, and partners based on industry and location proximity.

**Query**:
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus": "Aktiv"
          }
        },
        {
          "terms": {
            "VrproduktionsEnhed.hovedbranche.branchekode": [
              "259200",
              "281200", 
              "282500",
              "291000",
              "293100"
            ]
          }
        }
      ],
      "filter": [
        {
          "geo_distance": {
            "distance": "50km",
            "VrproduktionsEnhed.beliggenhedsadresse.coordinates": {
              "lat": 55.6761,
              "lon": 12.5683
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "by_industry": {
      "terms": {
        "field": "VrproduktionsEnhed.hovedbranche.branchekode"
      },
      "aggs": {
        "by_size": {
          "terms": {
            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.intervalKodeAntalAnsatte"
          }
        }
      }
    }
  },
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.navne",
    "VrproduktionsEnhed.virksomhedsrelation.cvrNummer",
    "VrproduktionsEnhed.beliggenhedsadresse",
    "VrproduktionsEnhed.hovedbranche",
    "VrproduktionsEnhed.telefonNummer",
    "VrproduktionsEnhed.elektroniskPost"
  ],
  "size": 200
}
```

**Note**: Geo-distance queries require coordinate data which may not be available in all records. Alternative approach using postal code ranges:

**Alternative Geographic Filter**:
```json
{
  "nested": {
    "path": "VrproduktionsEnhed.beliggenhedsadresse",
    "query": {
      "range": {
        "VrproduktionsEnhed.beliggenhedsadresse.postnummer": {
          "gte": 1000,
          "lte": 2999
        }
      }
    }
  }
}
```

**Performance Notes**:
- Use industry codes for manufacturing and industrial services
- Geographic filtering helps identify local suppliers
- Include contact information for business development follow-up

---

### 27. Executive Network Analysis

**Use Case**: Business intelligence - track professional networks and board interlocks among Danish companies.

**Step 1: Find Companies with Shared Directors**
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.deltagerRelation",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "Vrvirksomhed.deltagerRelation.deltager.navne.navn": "Lars Nielsen"
              }
            },
            {
              "terms": {
                "Vrvirksomhed.deltagerRelation.organisationer.medlemsData.attributter.vaerdier.vaerdi": [
                  "DIREKTION",
                  "BESTYRELSESMEDLEM",
                  "BESTYRELSESFORMAND"
                ]
              }
            }
          ]
        }
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.virksomhedsform",
    "Vrvirksomhed.deltagerRelation"
  ],
  "size": 50
}
```

**Step 2: Network Analysis Query**
```json
POST /cvr-permanent/virksomhed/_search
{
  "size": 0,
  "aggs": {
    "executive_connections": {
      "nested": {
        "path": "Vrvirksomhed.deltagerRelation"
      },
      "aggs": {
        "active_executives": {
          "filter": {
            "bool": {
              "must": [
                {
                  "terms": {
                    "Vrvirksomhed.deltagerRelation.organisationer.medlemsData.attributter.vaerdier.vaerdi": [
                      "DIREKTION",
                      "BESTYRELSESMEDLEM"
                    ]
                  }
                },
                {
                  "bool": {
                    "must_not": {
                      "exists": {
                        "field": "Vrvirksomhed.deltagerRelation.organisationer.medlemsData.attributter.vaerdier.periode.gyldigTil"
                      }
                    }
                  }
                }
              ]
            }
          },
          "aggs": {
            "by_person": {
              "terms": {
                "field": "Vrvirksomhed.deltagerRelation.deltager.navne.navn",
                "size": 100,
                "min_doc_count": 2
              }
            }
          }
        }
      }
    }
  }
}
```

**Expected Response Structure**:
```json
{
  "aggregations": {
    "executive_connections": {
      "active_executives": {
        "by_person": {
          "buckets": [
            {
              "key": "Lars Nielsen",
              "doc_count": 3
            },
            {
              "key": "Mette Andersen", 
              "doc_count": 2
            }
          ]
        }
      }
    }
  }
}
```

**Performance Notes**:
- Network analysis requires multiple queries and post-processing
- Use `min_doc_count: 2` to find people with multiple appointments
- Consider building application-level graphs for complex network analysis

---

### 28. Regulatory Compliance Monitoring

**Use Case**: Compliance management - monitor companies for regulatory changes and compliance requirements.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        },
        {
          "terms": {
            "Vrvirksomhed.hovedbranche.branchekode": [
              "641100",
              "641910", 
              "642000",
              "649100",
              "649200",
              "651100",
              "659100"
            ]
          }
        }
      ]
    }
  },
  "aggs": {
    "aml_compliance": {
      "nested": {
        "path": "Vrvirksomhed.attributter"
      },
      "aggs": {
        "aml_required": {
          "filter": {
            "term": {
              "Vrvirksomhed.attributter.type": "OMFATTET_AF_LOV_OM_HVIDVASK_OG_TERRORFINANSIERING"
            }
          }
        },
        "aml_not_required": {
          "filter": {
            "bool": {
              "must_not": {
                "term": {
                  "Vrvirksomhed.attributter.type": "OMFATTET_AF_LOV_OM_HVIDVASK_OG_TERRORFINANSIERING"
                }
              }
            }
          }
        }
      }
    },
    "audit_status": {
      "nested": {
        "path": "Vrvirksomhed.attributter"
      },
      "aggs": {
        "audit_waived": {
          "filter": {
            "bool": {
              "must": [
                {
                  "term": {
                    "Vrvirksomhed.attributter.type": "REVISION_FRAVALGT"
                  }
                },
                {
                  "term": {
                    "Vrvirksomhed.attributter.vaerdier.vaerdi": "true"
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.hovedbranche",
    "Vrvirksomhed.attributter"
  ],
  "size": 200
}
```

**Financial Industry Codes**:
- 641100: Central banking
- 641910: Other monetary intermediation
- 642000: Activities of holding companies
- 649100: Financial leasing
- 659100: Other financial service activities

**Performance Notes**:
- Focus on financial services industries with specific compliance requirements
- Use nested aggregations to analyze compliance attribute distribution
- Regular monitoring helps ensure regulatory compliance

---

### 29. Innovation and R&D Company Identification

**Use Case**: Innovation ecosystem mapping - identify companies likely engaged in research and development activities.

**Query**:
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "terms": {
            "Vrvirksomhed.hovedbranche.branchekode": [
              "721100",
              "721900", 
              "620100",
              "620200",
              "620900",
              "631100",
              "631200"
            ]
          }
        },
        {
          "bool": {
            "must": [
              {
                "wildcard": {
                  "Vrvirksomhed.navne.navn": "*research*"
                }
              }
            ]
          }
        },
        {
          "bool": {
            "must": [
              {
                "wildcard": {
                  "Vrvirksomhed.navne.navn": "*innovation*"
                }
              }
            ]
          }
        },
        {
          "bool": {
            "must": [
              {
                "wildcard": {
                  "Vrvirksomhed.navne.navn": "*tech*"
                }
              }
            ]
          }
        }
      ],
      "minimum_should_match": 1,
      "filter": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        },
        {
          "range": {
            "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
              "gte": "2015-01-01"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "by_establishment_year": {
      "date_histogram": {
        "field": "Vrvirksomhed.livsforloeb.periode.gyldigFra",
        "interval": "year",
        "format": "yyyy"
      }
    },
    "by_location": {
      "nested": {
        "path": "Vrvirksomhed.beliggenhedsadresse"
      },
      "aggs": {
        "current_addresses": {
          "filter": {
            "bool": {
              "must_not": {
                "exists": {
                  "field": "Vrvirksomhed.beliggenhedsadresse.periode.gyldigTil"
                }
              }
            }
          },
          "aggs": {
            "tech_hubs": {
              "terms": {
                "field": "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneNavn",
                "size": 15
              }
            }
          }
        }
      }
    }
  },
  "highlight": {
    "fields": {
      "Vrvirksomhed.navne.navn": {}
    }
  },
  "_source": [
    "Vrvirksomhed.cvrNummer",
    "Vrvirksomhed.navne",
    "Vrvirksomhed.hovedbranche",
    "Vrvirksomhed.beliggenhedsadresse"
  ],
  "size": 200
}
```

**R&D Industry Codes**:
- 721100: Research and experimental development on biotechnology
- 721900: Other research and experimental development on natural sciences and engineering
- 620100: Computer programming
- 631100: Data processing, hosting and related activities

**Performance Notes**:
- Combine industry codes with name-based detection for comprehensive coverage
- Use highlighting to show why companies matched
- Focus on companies established after 2015 for active innovation landscape

---

### 30. Market Concentration Analysis

**Use Case**: Competition analysis - measure market concentration and identify dominant players in specific industries.

**Query**:
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus": "Aktiv"
          }
        },
        {
          "term": {
            "VrproduktionsEnhed.hovedbranche.branchekode": "620100"
          }
        },
        {
          "range": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {
              "gte": 2024
            }
          }
        }
      ]
    }
  },
  "size": 0,
  "aggs": {
    "by_company": {
      "terms": {
        "field": "VrproduktionsEnhed.virksomhedsrelation.cvrNummer",
        "size": 100,
        "order": {
          "total_employees": "desc"
        }
      },
      "aggs": {
        "total_employees": {
          "sum": {
            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte"
          }
        },
        "production_units": {
          "cardinality": {
            "field": "VrproduktionsEnhed.pNummer"
          }
        },
        "geographic_spread": {
          "cardinality": {
            "field": "VrproduktionsEnhed.beliggenhedsadresse.kommune.kommuneKode"
          }
        }
      }
    },
    "industry_statistics": {
      "stats": {
        "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte"
      }
    },
    "employment_distribution": {
      "histogram": {
        "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte",
        "interval": 10,
        "min_doc_count": 1
      }
    }
  }
}
```

**Expected Response Structure**:
```json
{
  "aggregations": {
    "by_company": {
      "buckets": [
        {
          "key": "12345678",
          "doc_count": 15,
          "total_employees": {"value": 850},
          "production_units": {"value": 15},
          "geographic_spread": {"value": 8}
        }
      ]
    },
    "industry_statistics": {
      "count": 2500,
      "min": 1.0,
      "max": 850.0,
      "avg": 12.5,
      "sum": 31250.0
    }
  }
}
```

**Analysis Calculations**:
```python
def calculate_market_concentration(aggregation_results):
    companies = aggregation_results['by_company']['buckets']
    total_employment = aggregation_results['industry_statistics']['sum']
    
    # Calculate market shares
    market_shares = []
    for company in companies:
        share = company['total_employees']['value'] / total_employment
        market_shares.append(share)
    
    # Herfindahl-Hirschman Index (HHI)
    hhi = sum(share ** 2 for share in market_shares) * 10000
    
    # Concentration Ratio (CR4 - top 4 companies)
    cr4 = sum(market_shares[:4]) * 100
    
    return {
        'hhi': hhi,
        'cr4': cr4,
        'total_companies': len(companies),
        'market_leader_share': market_shares[0] * 100 if market_shares else 0
    }
```

**Performance Notes**:
- Use production unit data for more accurate employment counts
- Calculate multiple concentration metrics (HHI, CR4, CR8)
- Industry-specific analysis provides competitive intelligence

---

## Performance Best Practices

### Query Optimization Guidelines

1. **Use Filter Context When Possible**
   - Filters are cached and don't affect scoring
   - Place non-scoring criteria in `filter` clauses
   - Use `bool.filter` instead of `bool.must` for exact matches

2. **Limit Response Size**
   - Use `_source` filtering to return only needed fields
   - Set appropriate `size` limits based on actual needs
   - Consider pagination for large result sets

3. **Optimize Aggregations**
   - Use `size: 0` when only aggregation results are needed
   - Set reasonable `size` limits on terms aggregations
   - Use `min_doc_count` to exclude sparse buckets

4. **Handle Time-Based Data Efficiently**
   - Always include date range filters to limit search scope
   - Use `date_histogram` with appropriate intervals
   - Consider using `format` parameters for date aggregations

5. **Nested Query Performance**
   - Nested queries are expensive - use judiciously
   - Consider denormalizing frequently accessed nested data
   - Use `include_in_parent` mapping where appropriate

### Common Pitfalls to Avoid

1. **Result Window Limitations**
   - CVR API limits results to 3,000 documents (from + size ≤ 3000)
   - Use scroll API for larger datasets
   - Implement proper pagination in applications

2. **Case Sensitivity**
   - Most text searches are case-sensitive
   - Use lowercase for wildcard and prefix queries
   - Consider using `match` queries instead of `term` for text fields

3. **Validity Periods**
   - Always check `gyldigTil` fields for current data
   - Null `gyldigTil` indicates currently valid records
   - Use proper date range queries for historical analysis

4. **Elasticsearch Version Limitations**
   - CVR API runs Elasticsearch 1.7.4 (from 2015)
   - Some modern query features are not available
   - Script execution may be disabled for security

5. **Data Completeness**
   - Not all companies have complete data for all fields
   - Historical data may be limited for older companies
   - Plan for missing or null values in applications

### Monitoring and Debugging

1. **Query Performance**
   - Monitor query execution times
   - Use `explain` API for query analysis
   - Consider query complexity vs. result requirements

2. **Error Handling**
   - Handle HTTP 500 errors (often indicates result window exceeded)
   - Implement retry logic for temporary failures
   - Log and monitor API response times

3. **Data Validation**
   - Validate CVR numbers (8 digits) before querying
   - Check response structure before processing
   - Handle edge cases in data processing logic

---

## Conclusion

This cookbook provides a comprehensive foundation for working with the Danish CVR Registry API. The examples cover real-world business scenarios from simple lookups to complex analytical queries. Remember to:

- Start with simple queries and build complexity gradually
- Always test queries with small datasets first
- Implement proper error handling and caching in production applications  
- Monitor query performance and optimize based on actual usage patterns
- Stay aware of the API's limitations and work within them

For additional support or advanced use cases, consider using wrapper libraries or the alternative CVR.dev API for more modern query capabilities.

**Last Updated**: 2025-09-08
**API Version**: Elasticsearch 1.7.4
**Total Examples**: 30+ practical queries with variations