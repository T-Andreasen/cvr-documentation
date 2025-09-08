# Danish CVR API - Complete Field Reference

## Table of Contents
1. [Overview](#overview)
2. [Field Conventions](#field-conventions)
3. [Virksomhed (Companies) Fields](#virksomhed-companies-fields)
4. [Deltager (Participants) Fields](#deltager-participants-fields)
5. [Produktionsenhed (Production Units) Fields](#produktionsenhed-production-units-fields)
6. [Cross-Index Relationships](#cross-index-relationships)
7. [Query Path Reference](#query-path-reference)
8. [Data Types and Examples](#data-types-and-examples)
9. [Temporal Data Patterns](#temporal-data-patterns)
10. [Common Field Patterns](#common-field-patterns)

## Overview

This document provides a comprehensive field-by-field reference for all three main indices in the Danish CVR API:
- **Virksomhed** (Companies): 2,194,982 records
- **Deltager** (Participants): 1,772,344 records 
- **Produktionsenhed** (Production Units): 2,787,126 records

All fields include data type specifications, cardinality information, example values, and proper Elasticsearch query paths for the ES 1.7.4 implementation.

## Field Conventions

### Temporal Structure
Most fields follow a historical pattern with validity periods:
```json
{
  "fieldName": [{
    "actualData": "value",
    "periode": {
      "gyldigFra": "2020-01-01",    // Start date
      "gyldigTil": null             // null = currently valid
    },
    "sidstOpdateret": "2020-01-01T10:00:00.000+01:00"
  }]
}
```

### Data Types Legend
- **keyword**: Exact match, not analyzed (IDs, codes)
- **text**: Full-text searchable, analyzed
- **long**: 64-bit integer
- **integer**: 32-bit integer
- **date**: ISO 8601 date
- **boolean**: true/false
- **decimal**: String representation of decimal numbers
- **scaled_float**: Floating-point with scale factor
- **nested**: Object array with include_in_parent: true

### Cardinality Legend
- **Required**: Field always present
- **Optional**: Field may be null or missing
- **Single**: One value only
- **Multiple**: Array of values
- **Historical**: Array with temporal validity

---

## Virksomhed (Companies) Fields

### Root Object: `Vrvirksomhed`

#### Core Identifiers
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `cvrNummer` | keyword | Required, Single | Unique company identifier | `10103940` |
| `enhedsNummer` | long | Required, Single | Internal system unit number | `4000004570` |
| `enhedstype` | keyword | Required, Single | Always "VIRKSOMHED" | `"VIRKSOMHED"` |
| `samtId` | integer | Required, Single | Internal system ID | `12345` |

**Query Paths:**
```
Vrvirksomhed.cvrNummer
Vrvirksomhed.enhedsNummer
Vrvirksomhed.enhedstype
Vrvirksomhed.samtId
```

#### Registration Numbers
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `regNummer` | nested | Optional, Historical | Registration numbers with periods | `[{"regnummer": "REG123", "periode": {...}}]` |

**Nested Structure:**
- `regNummer.regnummer` (keyword)
- `regNummer.periode.gyldigFra` (date)
- `regNummer.periode.gyldigTil` (date)
- `regNummer.sidstOpdateret` (date)

#### Names
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `navne` | nested | Required, Historical | Official company names | `[{"navn": "A.P. Møller-Mærsk A/S", "periode": {...}}]` |
| `binavne` | nested | Optional, Historical | Alternative/secondary names | `[{"navn": "Mærsk", "periode": {...}}]` |

**Nested Structure (navne/binavne):**
- `navn` (text) - Company name
- `periode.gyldigFra` (date) - Valid from
- `periode.gyldigTil` (date) - Valid until (null = current)
- `sidstOpdateret` (date) - Last updated

**Query Paths:**
```
Vrvirksomhed.navne.navn
Vrvirksomhed.binavne.navn
```

#### Addresses
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `beliggenhedsadresse` | nested | Optional, Historical | Physical business address | See address structure below |
| `postadresse` | nested | Optional, Historical | Postal address (if different) | See address structure below |

**Address Nested Structure:**
- `vejnavn` (text) - Street name
- `vejkode` (integer) - Street code
- `husnummerFra` (integer) - House number from
- `husnummerTil` (integer) - House number to (for ranges)
- `bogstavFra` (keyword) - Letter from (e.g., "A")
- `bogstavTil` (keyword) - Letter to
- `etage` (keyword) - Floor
- `sidedoer` (keyword) - Side/door identifier
- `conavn` (text) - Care of name
- `postboks` (keyword) - PO Box
- `postnummer` (integer) - Postal code
- `postdistrikt` (text) - Postal district
- `bynavn` (text) - City name
- `landekode` (keyword) - Country code (DK, GL)
- `kommune.kommuneKode` (integer) - Municipality code
- `kommune.kommuneNavn` (keyword) - Municipality name
- `kommune.periode` (object) - Municipality validity
- `adresseId` (keyword) - Unique address identifier UUID
- `sidstValideret` (date) - Last address validation
- `periode` (object) - Address validity period
- `sidstOpdateret` (date) - Last updated

**Query Paths:**
```
Vrvirksomhed.beliggenhedsadresse.vejnavn
Vrvirksomhed.beliggenhedsadresse.postnummer
Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode
Vrvirksomhed.postadresse.postdistrikt
```

#### Contact Information
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `telefonNummer` | nested | Optional, Historical | Phone numbers | `[{"kontaktoplysning": "33631000", "hemmelig": false, "periode": {...}}]` |
| `telefaxNummer` | nested | Optional, Historical | Fax numbers | Same structure as phone |
| `elektroniskPost` | nested | Optional, Historical | Email addresses | `[{"kontaktoplysning": "info@company.dk", "hemmelig": false, "periode": {...}}]` |
| `hjemmeside` | nested | Optional, Historical | Website URLs | `[{"kontaktoplysning": "https://company.dk", "hemmelig": false, "periode": {...}}]` |

**Contact Nested Structure:**
- `kontaktoplysning` (keyword) - The actual contact info
- `hemmelig` (boolean) - Is contact info secret/protected
- `periode.gyldigFra` (date)
- `periode.gyldigTil` (date)
- `sidstOpdateret` (date)

#### Company Status and Form
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `virksomhedsstatus` | nested | Required, Historical | Company operating status | `[{"status": "NORMAL", "periode": {...}}]` |
| `virksomhedsform` | nested | Required, Historical | Legal company form | `[{"virksomhedsformkode": 80, "kortBeskrivelse": "APS", "periode": {...}}]` |

**Status Values (virksomhedsstatus):**
- `NORMAL` - Normal operation (1,019 sample)
- `UNDER TVANGSOPLØSNING` - Under forced dissolution (527)
- `TVANGSOPLØST` - Forcibly dissolved (396)
- `UNDER KONKURS` - Under bankruptcy (255)
- `OPLØST EFTER KONKURS` - Dissolved after bankruptcy (253)
- `OPLØST EFTER ERKLÆRING` - Dissolved by declaration (215)
- `UNDER FRIVILLIG LIKVIDATION` - Under voluntary liquidation (82)
- `OPLØST EFTER FRIVILLIG LIKVIDATION` - Dissolved after voluntary liquidation (77)
- `OPLØST EFTER FUSION` - Dissolved after merger (37)
- `SLETTET` - Deleted (23)
- `UDEN RETSVIRKNING` - Without legal effect (22)
- `OPLØST EFTER SPALTNING` - Dissolved after split (5)
- `UNDER REKONSTRUKTION` - Under reconstruction (2)
- `UNDER REASSUMERING` - Under reassumption (2)

**Company Form Codes (virksomhedsform) - Top Values:**
- `10` - ENK (Enkeltmandsvirksomhed) - 909,223 companies
- `80` - APS (Anpartsselskab) - 671,891 companies
- `115` - FFO (Frivillig forening) - 165,959 companies
- `15` - PMV (Personligt ejet Mindre Virksomhed) - 136,338 companies
- `30` - I/S (Interessentskab) - 106,271 companies
- `60` - A/S (Aktieselskab) - 95,806 companies
- `110` - FOR (Forening) - 81,902 companies
- `81` - IVS (Iværksætterselskab) - 64,814 companies

**Query Paths:**
```
Vrvirksomhed.virksomhedsstatus.status
Vrvirksomhed.virksomhedsform.virksomhedsformkode
Vrvirksomhed.virksomhedsform.kortBeskrivelse
Vrvirksomhed.virksomhedsform.langBeskrivelse
```

#### Industry Classification
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `hovedbranche` | nested | Optional, Historical | Main industry code (DB07/NACE) | `[{"branchekode": "620100", "branchetekst": "Computerprogrammering", "periode": {...}}]` |
| `bibranche1` | nested | Optional, Historical | Secondary industry 1 | Same structure as hovedbranche |
| `bibranche2` | nested | Optional, Historical | Secondary industry 2 | Same structure as hovedbranche |
| `bibranche3` | nested | Optional, Historical | Secondary industry 3 | Same structure as hovedbranche |

**Industry Nested Structure:**
- `branchekode` (keyword) - 6-digit industry code
- `branchetekst` (text) - Industry description
- `periode.gyldigFra` (date)
- `periode.gyldigTil` (date)
- `sidstOpdateret` (date)

**Top Industry Codes:**
- `949900` - Andre organisationer og foreninger i.a.n. (101 sample)
- `980000` - Uoplyst (73)
- `620100` - Computerprogrammering (21)
- `702200` - Virksomhedsrådgivning (33)

#### Lifecycle
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `livsforloeb` | nested | Required, Historical | Company lifecycle periods | `[{"periode": {"gyldigFra": "2020-01-01", "gyldigTil": null}}]` |

#### Attributes
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `attributter` | nested | Optional, Historical | Company attributes (capital, purpose, etc.) | `[{"type": "KAPITAL", "vaerdier": [{"vaerdi": "125000.00"}], "periode": {...}}]` |

**Attribute Types (Top Values):**
- `TEGNINGSREGEL` - Signing rules (130 sample)
- `PSEUDOCVRNR` - Pseudo CVR number flag (130)
- `REGNSKABSÅR_START` - Financial year start (127)
- `REGNSKABSÅR_SLUT` - Financial year end (127)
- `FORMÅL` - Company purpose (127)
- `VEDTÆGT_SENESTE` - Latest articles of association (123)
- `KAPITALVALUTA` - Capital currency (115)
- `KAPITAL` - Share capital (115)
- `ARKIV_REGISTRERINGSNUMMER` - Archive registration number (110)

**Attributes Nested Structure:**
- `type` (keyword) - Attribute type code
- `vaerdier` (array) - Array of values
- `vaerdier.vaerdi` (keyword) - The actual value
- `vaerditype` (keyword) - Value data type
- `periode.gyldigFra` (date)
- `periode.gyldigTil` (date)
- `sidstOpdateret` (date)

#### Participant Relations
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `deltagerRelation` | nested | Optional, Historical | Relations to participants (owners, directors) | Complex structure - see participant section |

#### System Metadata
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `reklamebeskyttet` | boolean | Required, Single | Marketing protection flag | `true` |
| `fejlRegistreret` | boolean | Required, Single | Registration error flag | `false` |
| `fejlVedIndlaesning` | boolean | Required, Single | Data loading error flag | `false` |
| `fejlBeskrivelse` | text | Optional, Single | Error description | `null` |
| `dataAdgang` | integer | Required, Single | Data access level (0=standard, 1=restricted) | `0` |
| `virkningsAktoer` | keyword | Required, Single | Effect actor code | `"R"` |
| `sidstIndlaest` | date | Required, Single | Last loaded timestamp | `"2025-09-08T17:57:17.199+02:00"` |
| `sidstOpdateret` | date | Required, Single | Last updated timestamp | `"2025-09-08T17:56:31.000+02:00"` |
| `naermesteFremtidigeDato` | date | Optional, Single | Next future date | `null` |

---

## Deltager (Participants) Fields

### Root Object: `Vrdeltager`

#### Core Identifiers
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `enhedsNummer` | long | Required, Single | Participant unit number | `4000123456` |
| `enhedstype` | keyword | Required, Single | Always "PERSON" or "VIRKSOMHED" | `"PERSON"` |
| `samtId` | integer | Required, Single | Internal system ID | `98765` |

#### Personal Information
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `navne` | nested | Required, Historical | Person/entity names | `[{"navn": "John Doe", "periode": {...}}]` |
| `binavne` | nested | Optional, Historical | Alternative names | Same structure as navne |

#### Address Information
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `beliggenhedsadresse` | nested | Optional, Historical | Primary address | Same structure as company addresses |
| `postadresse` | nested | Optional, Historical | Postal address | Same structure as company addresses |

#### Company Relations
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `virksomhedSummariskRelation` | nested | Optional, Multiple | Summary of company relations | `[{"cvrNummer": 12345678, "organisationer": [...]}]` |

**VirksomhedSummariskRelation Structure:**
- `cvrNummer` (keyword) - Related company CVR
- `organisationer` (array) - Organizations within company
- `organisationer.organisationstype` (keyword) - Type (DIREKTION, LIKVIDATOR, etc.)
- `organisationer.medlemsData` (array) - Member data
- `organisationer.medlemsData.rolle` (keyword) - Role (DIREKTØR, BESTYRELSESMEDLEM, etc.)
- `organisationer.medlemsData.titel` (text) - Title

#### System Metadata
Similar system fields as companies (reklamebeskyttet, fejlRegistreret, etc.)

---

## Produktionsenhed (Production Units) Fields

### Root Object: `VrproduktionsEnhed`

#### Core Identifiers
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `pNummer` | keyword | Required, Single | P-number (unique identifier) | `1028076343` |
| `enhedsNummer` | long | Required, Single | Internal unit number | `4009203577` |
| `enhedstype` | keyword | Required, Single | Always "PRODUKTIONSENHED" | `"PRODUKTIONSENHED"` |
| `samtId` | integer | Required, Single | Internal system ID | `31` |

#### Names and Identity
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `navne` | nested | Required, Historical | Production unit names | `[{"navn": "NordEx ApS", "periode": {...}}]` |

#### Address Information
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `beliggenhedsadresse` | nested | Required, Historical | Physical location | Same structure as company addresses |
| `postadresse` | nested | Optional, Historical | Postal address | Same structure as company addresses |

#### Contact Information
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `telefonNummer` | nested | Optional, Historical | Phone numbers | Same structure as company contact |
| `telefaxNummer` | nested | Optional, Historical | Fax numbers | Same structure as company contact |
| `elektroniskPost` | nested | Optional, Historical | Email addresses | Same structure as company contact |

#### Industry Classification
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `hovedbranche` | nested | Optional, Historical | Main industry code | `[{"branchekode": "494100", "branchetekst": "Vejgodstransport", "periode": {...}}]` |
| `bibranche1` | nested | Optional, Historical | Secondary industry 1 | Same structure as hovedbranche |
| `bibranche2` | nested | Optional, Historical | Secondary industry 2 | Same structure as hovedbranche |
| `bibranche3` | nested | Optional, Historical | Secondary industry 3 | Same structure as hovedbranche |
| `brancheAnsvarskode` | keyword | Optional, Single | Industry responsibility code | `null` |

#### Employment Data
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `aarsbeskaeftigelse` | nested | Optional, Multiple | Annual employment data | `[{"aar": 2014, "antalAarsvaerk": 1, "antalAnsatte": 1, "intervalKodeAntalAarsvaerk": "ANTAL_1_1"}]` |
| `kvartalsbeskaeftigelse` | nested | Optional, Multiple | Quarterly employment data | `[{"aar": 2015, "kvartal": 2, "antalAarsvaerk": 1, "antalAnsatte": 0}]` |
| `erstMaanedsbeskaeftigelse` | nested | Optional, Multiple | Monthly employment replacement data | `[{"aar": 2025, "maaned": 6, "antalAarsvaerk": 1.28, "antalAnsatte": 2}]` |

**Employment Nested Structure:**
- `aar` (integer) - Year
- `kvartal` (integer) - Quarter (1-4, quarterly data only)
- `maaned` (integer) - Month (1-12, monthly data only)
- `antalAarsvaerk` (integer/scaled_float) - Full-time equivalent
- `antalAnsatte` (integer) - Number of employees
- `antalInklusivEjere` (integer) - Including owners
- `intervalKodeAntalAarsvaerk` (keyword) - FTE interval code
- `intervalKodeAntalAnsatte` (keyword) - Employee count interval
- `intervalKodeAntalInklusivEjere` (keyword) - Owner-inclusive interval
- `sidstOpdateret` (date)

**Employment Interval Codes:**
- `ANTAL_0_0` - Zero employees
- `ANTAL_1_1` - 1 employee
- `ANTAL_2_4` - 2-4 employees
- `ANTAL_5_9` - 5-9 employees
- `ANTAL_10_19` - 10-19 employees
- `ANTAL_20_49` - 20-49 employees
- `ANTAL_50_99` - 50-99 employees
- `ANTAL_100_199` - 100-199 employees
- `ANTAL_200_499` - 200-499 employees
- `ANTAL_500_999` - 500-999 employees
- `ANTAL_1000_` - 1000+ employees

#### Lifecycle and Relations
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `livsforloeb` | nested | Required, Historical | Unit lifecycle periods | `[{"periode": {"gyldigFra": "2022-03-08", "gyldigTil": null}}]` |
| `virksomhedsrelation` | nested | Required, Historical | Parent company relation | `[{"cvrNummer": 43121774, "periode": {...}}]` |

#### Additional Fields
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `attributter` | nested | Optional, Historical | Additional attributes | `[]` |
| `deltagerRelation` | nested | Optional, Historical | Participant relations (rarely used) | `[]` |

#### Metadata Object
| Field | Type | Cardinality | Description | Example |
|-------|------|-------------|-------------|---------|
| `produktionsEnhedMetadata` | object | Required, Single | Current/latest values for easy querying | See metadata structure below |

**ProductionsEnhedMetadata Structure:**
- `nyesteNavn` (object) - Latest name
- `nyesteBeliggenhedsadresse` (object) - Latest address
- `nyesteHovedbranche` (object) - Latest main industry
- `nyesteBibranche1` (object) - Latest secondary industry 1
- `nyesteBibranche2` (object) - Latest secondary industry 2 (may be null)
- `nyesteBibranche3` (object) - Latest secondary industry 3 (may be null)
- `nyesteKontaktoplysninger` (array) - Latest contact info array
- `nyesteCvrNummerRelation` (long) - Latest parent CVR number
- `nyesteAarsbeskaeftigelse` (object) - Latest annual employment
- `nyesteKvartalsbeskaeftigelse` (object) - Latest quarterly employment
- `nyesteErstMaanedsbeskaeftigelse` (object) - Latest monthly employment
- `sammensatStatus` (keyword) - Combined status ("Aktiv", "Ophørt")

#### System Metadata
Same system fields as companies and participants.

---

## Cross-Index Relationships

### Company → Production Units
**Relationship**: One-to-many via CVR number
```
Vrvirksomhed.cvrNummer → VrproduktionsEnhed.virksomhedsrelation.cvrNummer
```

**Query Pattern:**
```json
// Find production units for company CVR 43121774
{
  "query": {
    "term": {
      "VrproduktionsEnhed.virksomhedsrelation.cvrNummer": "43121774"
    }
  }
}
```

### Company → Participants
**Relationship**: Many-to-many via deltagerRelation
```
Vrvirksomhed.deltagerRelation.deltager.enhedsNummer → Vrdeltager.enhedsNummer
```

### Participant → Companies
**Relationship**: Many-to-many via virksomhedSummariskRelation
```
Vrdeltager.virksomhedSummariskRelation.cvrNummer → Vrvirksomhed.cvrNummer
```

### Address Relationships
All three indices share the same address structure, allowing geographic queries across entities.

---

## Query Path Reference

### Elasticsearch Query Paths for ES 1.7.4

#### Company Fields
```
# Core identifiers
Vrvirksomhed.cvrNummer
Vrvirksomhed.enhedsNummer

# Names (requires nested query)
Vrvirksomhed.navne.navn
Vrvirksomhed.binavne.navn

# Status and form
Vrvirksomhed.virksomhedsstatus.status
Vrvirksomhed.virksomhedsform.virksomhedsformkode

# Industry
Vrvirksomhed.hovedbranche.branchekode
Vrvirksomhed.bibranche1.branchekode

# Address (requires nested query)
Vrvirksomhed.beliggenhedsadresse.vejnavn
Vrvirksomhed.beliggenhedsadresse.postnummer
Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode

# Contact (requires nested query)
Vrvirksomhed.telefonNummer.kontaktoplysning
Vrvirksomhed.elektroniskPost.kontaktoplysning

# Attributes (requires nested query)
Vrvirksomhed.attributter.type
Vrvirksomhed.attributter.vaerdier.vaerdi

# Lifecycle
Vrvirksomhed.livsforloeb.periode.gyldigFra
Vrvirksomhed.livsforloeb.periode.gyldigTil
```

#### Production Unit Fields
```
# Core identifiers
VrproduktionsEnhed.pNummer
VrproduktionsEnhed.enhedsNummer

# Names (requires nested query)
VrproduktionsEnhed.navne.navn

# Company relation
VrproduktionsEnhed.virksomhedsrelation.cvrNummer

# Employment data (requires nested query)
VrproduktionsEnhed.aarsbeskaeftigelse.aar
VrproduktionsEnhed.aarsbeskaeftigelse.antalAnsatte
VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar
VrproduktionsEnhed.erstMaanedsbeskaeftigelse.maaned
VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte

# Metadata (direct access)
VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus
VrproduktionsEnhed.produktionsEnhedMetadata.nyesteCvrNummerRelation

# Industry
VrproduktionsEnhed.hovedbranche.branchekode
VrproduktionsEnhed.hovedbranche.branchetekst
```

#### Participant Fields
```
# Core identifiers
Vrdeltager.enhedsNummer

# Names (requires nested query)
Vrdeltager.navne.navn

# Company relations
Vrdeltager.virksomhedSummariskRelation.cvrNummer
Vrdeltager.virksomhedSummariskRelation.organisationer.organisationstype
```

### Nested Query Requirements

Fields marked as "nested" require nested queries in ES 1.7.4:

```json
// Nested query example
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.navne",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "Vrvirksomhed.navne.navn": "Mærsk"
              }
            },
            {
              "bool": {
                "must_not": {
                  "exists": {
                    "field": "Vrvirksomhed.navne.periode.gyldigTil"
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
```

---

## Data Types and Examples

### Identifiers
```json
// CVR numbers - 8 digits
"cvrNummer": 10103940

// P-numbers - 10 digits  
"pNummer": "1028076343"

// Unit numbers - long integers
"enhedsNummer": 4009203577

// UUIDs for addresses
"adresseId": "7f9e85fa-14e3-4fe8-996e-f57efcc5c378"
```

### Temporal Data
```json
// Date format - ISO 8601
"gyldigFra": "2020-01-01"
"gyldigTil": null  // null means currently valid

// Timestamp format - with timezone
"sidstOpdateret": "2025-09-08T17:56:31.000+02:00"
```

### Address Examples
```json
{
  "vejnavn": "Rådhusstræde",
  "vejkode": 6156,
  "husnummerFra": 15,
  "postnummer": 1466,
  "postdistrikt": "København K",
  "landekode": "DK",
  "kommune": {
    "kommuneKode": 101,
    "kommuneNavn": "KØBENHAVN"
  }
}
```

### Employment Data Examples
```json
// Integer values for annual/quarterly
"antalAarsvaerk": 1,
"antalAnsatte": 2

// Scaled float for monthly (with decimals)
"antalAarsvaerk": 1.28

// Interval codes
"intervalKodeAntalAnsatte": "ANTAL_2_4"
```

### Contact Information Examples
```json
{
  "kontaktoplysning": "28403131",  // Phone
  "hemmelig": false
}

{
  "kontaktoplysning": "info@company.dk",  // Email
  "hemmelig": false  
}

{
  "kontaktoplysning": "https://company.dk",  // Website
  "hemmelig": false
}
```

---

## Temporal Data Patterns

### Current vs Historical Values
Most fields store historical data with validity periods:

```json
// Historical array
"navne": [
  {
    "navn": "Old Company Name",
    "periode": {
      "gyldigFra": "2010-01-01",
      "gyldigTil": "2020-12-31"
    }
  },
  {
    "navn": "Current Company Name", 
    "periode": {
      "gyldigFra": "2021-01-01",
      "gyldigTil": null  // null = currently valid
    }
  }
]
```

### Querying Current Values
```json
// Find companies with current name containing "Mærsk"
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.navne",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "Vrvirksomhed.navne.navn": "Mærsk"
              }
            },
            {
              "bool": {
                "must_not": {
                  "exists": {
                    "field": "Vrvirksomhed.navne.periode.gyldigTil"
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
```

### Querying Historical Values
```json
// Find companies that had specific status on a date
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.virksomhedsstatus",
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
              }
            },
            {
              "range": {
                "Vrvirksomhed.virksomhedsstatus.periode.gyldigFra": {
                  "lte": "2022-01-01"
                }
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "bool": {
                      "must_not": {
                        "exists": {
                          "field": "Vrvirksomhed.virksomhedsstatus.periode.gyldigTil"
                        }
                      }
                    }
                  },
                  {
                    "range": {
                      "Vrvirksomhed.virksomhedsstatus.periode.gyldigTil": {
                        "gte": "2022-01-01"
                      }
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

---

## Common Field Patterns

### Standard Nested Object Pattern
Most temporal fields follow this pattern:
```json
{
  "fieldArray": [{
    "primaryValue": "actual data",
    "additionalField1": "supplementary data",
    "periode": {
      "gyldigFra": "2020-01-01",
      "gyldigTil": null
    },
    "sidstOpdateret": "2020-01-01T10:00:00.000+01:00"
  }]
}
```

### Contact Information Pattern
All contact fields use this structure:
```json
{
  "contactType": [{
    "kontaktoplysning": "the actual contact info",
    "hemmelig": false,
    "periode": {
      "gyldigFra": "2020-01-01", 
      "gyldigTil": null
    },
    "sidstOpdateret": "2020-01-01T10:00:00.000+01:00"
  }]
}
```

### Address Pattern
All address fields share identical structure across all indices:
- Same field names and types
- Same nested kommune structure
- Same validation and ID patterns
- Allows consistent geographic queries

### Employment Data Pattern (Production Units Only)
Three different granularities with similar structure:
- `aarsbeskaeftigelse` - Annual data
- `kvartalsbeskaeftigelse` - Quarterly data  
- `erstMaanedsbeskaeftigelse` - Monthly data (most recent/detailed)

### Industry Classification Pattern
Consistent across companies and production units:
```json
{
  "branchetype": [{
    "branchekode": "123456",      // 6-digit code
    "branchetekst": "Description", // Human readable
    "periode": { /* validity */ },
    "sidstOpdateret": "..."
  }]
}
```

### Metadata vs Historical Pattern
Production units provide both:
1. **Historical arrays** - Complete change history
2. **Metadata object** - Current values for easy access
   - `nyeste*` fields contain latest values
   - No need for nested queries on metadata
   - Better performance for current-state queries

This field reference provides comprehensive documentation for all available fields across the three main CVR API indices, enabling developers to construct precise queries and understand the complete data model.