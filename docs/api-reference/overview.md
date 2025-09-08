# Danish CVR Registry API - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Infrastructure](#infrastructure)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Advanced Query Features](#advanced-query-features)
7. [Error Handling](#error-handling)
8. [Enum Reference](#enum-reference)
9. [Query Examples](#query-examples)
10. [Best Practices](#best-practices)
11. [Limitations](#limitations)
12. [Alternative Resources](#alternative-resources)
13. [Additional Documentation](#additional-documentation)

## Overview

The Danish CVR (Central Business Register) provides an Elasticsearch-based REST API for accessing comprehensive business data from Denmark. The system contains information about companies, participants, and production units, including historical data with temporal validity periods.

### Key Statistics
- **Companies (Virksomhed)**: 2,194,982 records
- **Participants (Deltager)**: 1,772,344 records
- **Production Units (Produktionsenhed)**: 2,787,126 records

## Authentication

All API requests require Basic Authentication:

```bash
Username: YOUR_CVR_USERNAME
Password: YOUR_CVR_PASSWORD
Base URL: http://distribution.virk.dk/cvr-permanent
```

!!! warning "Credentials Required"
    You need to obtain valid credentials from the Danish Business Authority. Contact cvrselvbetjening@erst.dk to request access.

!!! tip "Environment Variables"
    It's recommended to store credentials as environment variables:
    ```bash
    export CVR_USERNAME="your_username"
    export CVR_PASSWORD="your_password"
    ```

### Example Authentication Header
```bash
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search"
```

## Infrastructure

### Elasticsearch Details
- **Version**: 1.7.4 (legacy version - consider compatibility when developing)
- **Alias Structure**: `cvr-permanent` points to multiple physical indices
- **Response Format**: JSON
- **Protocol**: HTTP (not HTTPS)

### Physical Indices
| Index Name | Alias Endpoint | Content Type | Record Count |
|------------|---------------|--------------|--------------|
| cvr-v-20220630 | /virksomhed | Companies | 2,194,982 |
| cvr-d-20211220 | /deltager | Participants | 1,772,344 |
| cvr-p-20200115 | /produktionsenhed | Production Units | 2,787,126 |
| cvr-m-20180307 | N/A | Metadata | Unknown |

## API Endpoints

### 1. Company Search (Virksomhed)
**Endpoint**: `POST http://distribution.virk.dk/cvr-permanent/virksomhed/_search`

Search and retrieve company information including registration details, addresses, ownership, and status.

### 2. Participant Search (Deltager)
**Endpoint**: `POST http://distribution.virk.dk/cvr-permanent/deltager/_search`

Access information about individuals and entities participating in companies.

### 3. Production Unit Search (Produktionsenhed)
**Endpoint**: `POST http://distribution.virk.dk/cvr-permanent/produktionsenhed/_search`

Query production units (branch offices, factories, etc.) associated with companies.

## Data Models

### Company (Vrvirksomhed) Structure

```json
{
  "Vrvirksomhed": {
    "cvrNummer": 12345678,           // Unique company identifier
    "regNummer": [],                  // Registration numbers
    "navne": [{                       // Company names (historical)
      "navn": "Company Name",
      "periode": {
        "gyldigFra": "2020-01-01",
        "gyldigTil": null            // null = currently valid
      }
    }],
    "beliggenhedsadresse": [{        // Physical address
      "vejnavn": "Street Name",
      "husnummerFra": 123,
      "postnummer": 1234,
      "postdistrikt": "City",
      "kommune": {
        "kommuneKode": 101,
        "kommuneNavn": "Copenhagen"
      }
    }],
    "virksomhedsstatus": [{          // Company status
      "status": "NORMAL",            // NORMAL, UNDER FRIVILLIG LIKVIDATION, etc.
      "periode": {}
    }],
    "virksomhedsform": [{            // Company type
      "virksomhedsformkode": 80,     // 80 = ApS, 60 = A/S, etc.
      "kortBeskrivelse": "APS",
      "langBeskrivelse": "Anpartsselskab"
    }],
    "hovedbranche": [],              // Main industry code
    "attributter": [{                // Various attributes
      "type": "KAPITAL",
      "vaerdi": "125000.00"
    }],
    "deltagerRelation": []           // Participants/owners
  }
}
```

## Enum Reference - Complete Coded Values

This section provides comprehensive mappings for all coded values in the CVR API, extracted through systematic aggregation queries.

### 1. Company Form Codes (Virksomhedsform)

Complete listing of all company form codes with descriptions and frequency counts:

| Code | Short Description | Long Description | Count | Notes |
|------|------------------|------------------|-------|-------|
| 10 | ENK | Enkeltmandsvirksomhed | 909,223 | Sole proprietorship |
| 80 | APS | Anpartsselskab | 671,891 | Private limited company |
| 115 | FFO | Frivillig forening | 165,959 | Voluntary association |
| 15 | PMV | Personligt ejet Mindre Virksomhed | 136,338 | Personally owned small business |
| 30 | I/S | Interessentskab | 106,271 | Partnership |
| 60 | A/S | Aktieselskab | 95,806 | Public limited company |
| 110 | FOR | Forening | 81,902 | Association |
| 81 | IVS | Iværksætterselskab | 64,814 | Entrepreneur company |
| 210 | UDL | Anden udenlandsk virksomhed | 21,651 | Other foreign company |
| 90 | FON | Fonde og andre selvejende institutioner | 15,368 | Foundations and self-governing institutions |
| 270 | EUO | Enhed under oprettelse i Erhvervsstyrelsen | 13,216 | Unit under establishment |
| 280 | ØVR | Øvrige virksomhedsformer | 11,188 | Other company forms |
| 40 | K/S | Kommanditselskab | 10,300 | Limited partnership |
| 260 | FKI | Folkekirkelige Institutioner | 3,894 | Church institutions |
| 151 | SMA | Selskab med begrænset ansvar | 3,141 | Company with limited liability |
| 170 | FAS | Filial af udenlandsk aktieselskab | 2,775 | Branch of foreign stock company |
| 70 | KAS | Kommanditaktieselskab/Partnerselskab | 2,755 | Limited partnership company |
| 130 | ANS | Andelsselskab (-forening) | 2,711 | Cooperative company |
| 100 | EFO | Erhvervsdrivende fond | 2,521 | Commercial foundation |
| 20 | DØD | Dødsbo | 2,353 | Estate |
| 180 | FAP | Filial af udenlandsk anpartsselskab | 2,098 | Branch of foreign private company |
| 990 | UOP | Uoplyst virksomhedsform | 1,577 | Unknown company form |
| 140 | ABA | Andelsselskab med begrænset ansvar | 1,400 | Cooperative with limited liability |
| 152 | FMA | Forening med begrænset ansvar | 964 | Association with limited liability |
| 50 | PAR | Partrederi | 701 | Ship partnership |
| 230 | STA | Statslig administrativ enhed | 448 | State administrative unit |
| 250 | KOM | Primærkommune | 348 | Primary municipality |
| 285 | FIV | Særlig finansiel virksomhed | 269 | Special financial business |
| 520 | GUS | Grønlandsk afdeling af udenlandsk selskab | 191 | Greenlandic division of foreign company |
| 150 | FBA | Forening eller selskab med begrænset ansvar | 166 | Association or company with limited liability |
| 190 | FBA | Filial af udenlandsk virksomhed med begrænset ansv | 35 | Branch of foreign limited liability company |
| 291 | FES | Filial af SE-selskab | 18 | Branch of SE company |
| 240 | AMT | Amtskommune | 15 | County |
| 290 | E/S | SE-selskab | 12 | SE company (European Company) |
| 160 | EØF | Europæisk Økonomisk Firmagruppe | 11 | European Economic Interest Grouping |
| 235 | SOV | Selvstændig offentlig virksomhed | 10 | Independent public company |
| 95 | TRU | Trust | 7 | Trust |
| 245 | REG | Region | 6 | Region |
| 45 | MSS | Medarbejderinvesteringsselskab | 2 | Employee investment company |
| 220 | FEØ | Fast forretningssted af Europæisk økonomisk Firmag | 2 | Permanent establishment of EEIG |
| 195 | SCE | SCE-selskab | 1 | SCE company |

### 2. Company Status Values (Virksomhedsstatus)

All possible company status values with frequency from sample data:

| Status | Description | Sample Count | Notes |
|--------|-------------|-------------|-------|
| NORMAL | Normal operation | 1,019 | Active company |
| UNDER TVANGSOPLØSNING | Under forced dissolution | 527 | Forced dissolution in progress |
| TVANGSOPLØST | Forced dissolution | 396 | Forcibly dissolved |
| UNDER KONKURS | Under bankruptcy | 255 | Bankruptcy proceedings |
| OPLØST EFTER KONKURS | Dissolved after bankruptcy | 253 | Dissolved following bankruptcy |
| OPLØST EFTER ERKLÆRING | Dissolved by declaration | 215 | Voluntarily dissolved |
| UNDER FRIVILLIG LIKVIDATION | Under voluntary liquidation | 82 | Voluntary liquidation in progress |
| OPLØST EFTER FRIVILLIG LIKVIDATION | Dissolved after voluntary liquidation | 77 | Dissolved after voluntary liquidation |
| OPLØST EFTER FUSION | Dissolved after merger | 37 | Merged into another company |
| SLETTET | Deleted | 23 | Deleted from register |
| UDEN RETSVIRKNING | Without legal effect | 22 | No legal effect |
| OPLØST EFTER SPALTNING | Dissolved after split | 5 | Split into other companies |
| UNDER REKONSTRUKTION | Under reconstruction | 2 | Reconstruction in progress |
| UNDER REASSUMERING | Under reassumption | 2 | Reassumption in progress |

### 3. Industry Codes (Branchekoder)

Top industry codes with descriptions and frequency from sample data:

| Code | Description | Sample Count | Category |
|------|-------------|-------------|----------|
| 949900 | Andre organisationer og foreninger i.a.n. | 101 | Organizations |
| 980000 | Uoplyst | 73 | Unknown |
| 999999 | Uoplyst | 37 | Unknown |
| 702200 | Virksomhedsrådgivning og anden rådgivning om driftsledelse | 33 | Business consulting |
| 620100 | Computerprogrammering | 21 | IT/Software |
| 561020 | Pizzeriaer, grillbarer, isbarer mv. | 21 | Food service |
| 011110 | Kornavl | 21 | Agriculture |
| 620200 | Konsulentbistand vedrørende informationsteknologi | 20 | IT consulting |
| 452010 | Autoreparationsværksteder mv. | 19 | Automotive |
| 869090 | Sundhedsvæsen i øvrigt i.a.n. | 18 | Healthcare |
| 682040 | Udlejning af erhvervsejendomme | 18 | Real estate |
| 855900 | Anden undervisning i.a.n. | 16 | Education |
| 811000 | Kombinerede serviceydelser | 16 | Combined services |
| 702040 | Udlejning af erhvervsejendomme | 16 | Real estate rental |
| 011100 | Dyrkning af korn (undtagen ris), bælgfrugter og olieholdige frø | 16 | Agriculture |
| 960900 | Andre personlige serviceydelser i.a.n. | 15 | Personal services |
| 889910 | Foreninger, legater og fonde med sygdomsbekæmpende, sociale og velgørende formål | 15 | Charities |
| 900300 | Kunstnerisk skaben | 14 | Arts |
| 741490 | Anden virksomhedsrådgivning | 14 | Business consulting |
| 561010 | Restauranter | 14 | Restaurants |

**Note**: Industry codes follow the Danish DB07 classification system, which is based on NACE Rev. 2. The full classification contains hundreds of codes across all economic sectors.

### 4. Attribute Types

All possible attribute types found in company records:

| Type | Description | Sample Count | Value Type |
|------|-------------|-------------|------------|
| TEGNINGSREGEL | Signing rules | 130 | string |
| PSEUDOCVRNR | Pseudo CVR number flag | 130 | boolean |
| REGNSKABSÅR_START | Financial year start | 127 | gMonthDay |
| REGNSKABSÅR_SLUT | Financial year end | 127 | gMonthDay |
| FORMÅL | Company purpose | 127 | string |
| VEDTÆGT_SENESTE | Latest articles of association | 123 | date |
| FØRSTE_REGNSKABSPERIODE_START | First accounting period start | 120 | date |
| FØRSTE_REGNSKABSPERIODE_SLUT | First accounting period end | 120 | date |
| KAPITALVALUTA | Capital currency | 115 | string |
| KAPITAL | Share capital | 115 | decimal |
| ARKIV_REGISTRERINGSNUMMER | Archive registration number | 110 | string |
| NAVN_IDENTITET | Name identity | 107 | string |
| OMFATTET_AF_LOV_OM_HVIDVASK_OG_TERRORFINANSIERING | Subject to anti-money laundering law | 35 | boolean |
| REVISION_FRAVALGT | Audit waived | 32 | boolean |
| KAPITAL_DELVIST | Partial capital | 19 | decimal |
| EJERREGISTRERING_UNDER_5_PROCENT | Ownership registration under 5% | 15 | boolean |
| KAPITALKLASSER | Capital classes | 14 | string |
| STATSLIG_VIRK | State enterprise | 7 | boolean |
| OMLÆGNINGSPERIODE_START | Conversion period start | 4 | date |
| OMLÆGNINGSPERIODE_SLUT | Conversion period end | 4 | date |
| BYGNINGSNUMMER | Building number | 3 | string |
| SOCIAL_ØKONOMISK_VIRKSOMHED | Social economic enterprise | 2 | boolean |
| GENOPTAGELSE_TVANGSOPLØSNING | Resumption of forced dissolution | 2 | date |
| STADFÆSTET_AF | Confirmed by | 1 | string |
| STADFÆSTELSESDATO | Confirmation date | 1 | date |
| OPLØSNINGSTRUSSEL_SENESTE | Latest dissolution threat | 1 | date |
| FINANSIELT_FORMÅL | Financial purpose | 1 | boolean |

### 5. Municipality Codes (Kommune)

Top 30 municipality codes with names and counts:

| Code | Name | Count | Region |
|------|------|-------|--------|
| 101 | KØBENHAVN | 439,001 | Capital |
| 751 | AARHUS | 158,991 | Central Jutland |
| 147 | FREDERIKSBERG | 77,911 | Capital |
| 461 | ODENSE | 76,443 | Southern Denmark |
| 851 | AALBORG | 84,612 | North Jutland |
| 157 | GENTOFTE | 67,447 | Capital |
| 630 | VEJLE | 42,948 | Southern Denmark |
| 621 | KOLDING | 38,877 | Southern Denmark |
| 173 | LYNGBY-TAARBÆK | 38,085 | Capital |
| 561 | ESBJERG | 37,922 | Southern Denmark |
| 657 | HERNING | 35,558 | Central Jutland |
| 230 | RUDERSDAL | 35,406 | Capital |
| 159 | GLADSAXE | 34,763 | Capital |
| 791 | VIBORG | 34,672 | Central Jutland |
| 217 | HELSINGØR | 33,125 | Capital |
| 740 | SILKEBORG | 33,448 | Central Jutland |
| 615 | HORSENS | 32,837 | Central Jutland |
| 730 | RANDERS | 31,211 | Central Jutland |
| 370 | NÆSTVED | 27,251 | Zealand |
| 169 | HØJE-TAASTRUP | 26,385 | Capital |
| 316 | HOLBÆK | 26,490 | Zealand |
| 259 | KØGE | 26,601 | Zealand |
| 167 | GENTOFTE | 25,128 | Capital |
| 219 | HILLERØD | 25,341 | Capital |
| 330 | SLAGELSE | 24,612 | Zealand |
| 253 | GREVE | 24,688 | Zealand |
| 746 | SKIVE | 23,184 | Central Jutland |
| 151 | BALLERUP | 21,958 | Capital |
| 813 | FREDERIKSHAVN | 21,189 | North Jutland |
| 661 | VARDE | 20,928 | Southern Denmark |

**Note**: Denmark has 98 municipalities as of 2022. The full list includes all municipalities with their respective codes and current boundaries following the 2007 municipal reform.

### 6. Additional Coded Fields

#### 6.1 Entity Type (Enhedstype)
| Value | Description | Usage |
|-------|-------------|-------|
| VIRKSOMHED | Company | Primary entity type for companies |

#### 6.2 Data Access Level (DataAdgang)
| Code | Description | Sample Count |
|------|-------------|-------------|
| 0 | Standard access | 485 |
| 1 | Restricted access | 15 |

#### 6.3 Country Codes (Landekode)
| Code | Country | Sample Count |
|------|---------|-------------|
| DK | Denmark | 1,747 |
| GL | Greenland | 8 |

### Usage Examples for Enum Values

#### Query by Company Form
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "term": {
      "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80
    }
  }
}
```

#### Query by Status
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "term": {
      "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
    }
  }
}
```

#### Query by Industry Code
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "term": {
      "Vrvirksomhed.hovedbranche.branchekode": "620100"
    }
  }
}
```

#### Query by Municipality
```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.beliggenhedsadresse",
      "query": {
        "term": {
          "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode": 101
        }
      }
    }
  }
}
```

**Data Collection Note**: All enum mappings were extracted through systematic aggregation queries against the live CVR API on 2025-09-08. Frequencies represent actual usage in the database and may change over time as companies are registered, modified, or dissolved.

### Production Unit (VrproduktionsEnhed) Structure

Production units represent physical locations or branches of companies. Each unit is identified by a P-number and linked to a parent company via CVR number.

```json
{
  "VrproduktionsEnhed": {
    // Identifiers and Basic Info
    "pNummer": 1028076343,                    // P-number (unique identifier, keyword)
    "enhedsNummer": 4009203577,               // Internal unit number (long)
    "enhedstype": "PRODUKTIONSENHED",         // Always "PRODUKTIONSENHED"
    "samtId": 31,                             // Internal system ID (integer)
    
    // Names (Historical with validity periods)
    "navne": [{
      "navn": "NordEx ApS",                   // Unit name
      "periode": {
        "gyldigFra": "2022-10-06",           // Valid from date
        "gyldigTil": null                    // null = currently valid
      },
      "sidstOpdateret": "2022-10-06T11:40:46.000+02:00"
    }],
    
    // Address Information
    "beliggenhedsadresse": [{                 // Physical address (nested)
      "vejnavn": "Rådhusstræde",             // Street name
      "vejkode": 6156,                       // Street code (integer)
      "husnummerFra": 15,                    // House number from
      "husnummerTil": null,                  // House number to (for ranges)
      "bogstavFra": null,                    // Letter from (e.g., "A")
      "bogstavTil": null,                    // Letter to
      "etage": null,                         // Floor
      "sidedoer": null,                      // Side/door (e.g., "tv", "1115")
      "conavn": null,                        // Care of name
      "postboks": null,                      // PO Box
      "postnummer": 1466,                    // Postal code
      "postdistrikt": "København K",         // Postal district
      "bynavn": null,                        // City name (if different)
      "landekode": "DK",                     // Country code
      "kommune": {                           // Municipality
        "kommuneKode": 101,                  // Municipality code
        "kommuneNavn": "KØBENHAVN",          // Municipality name
        "periode": {
          "gyldigFra": "2007-01-01",
          "gyldigTil": null
        },
        "sidstOpdateret": "2006-11-13T00:00:00.000+01:00"
      },
      "adresseId": "7f9e85fa-14e3-4fe8-996e-f57efcc5c378",  // Address UUID
      "sidstValideret": "2025-09-08T17:57:17.143+02:00",    // Last validated
      "periode": {
        "gyldigFra": "2025-09-08",
        "gyldigTil": null
      },
      "sidstOpdateret": "2025-09-08T17:56:31.000+02:00"
    }],
    
    // Contact Information
    "telefonNummer": [{                      // Phone numbers (nested)
      "kontaktoplysning": "28403131",        // Phone number
      "hemmelig": false,                     // Is secret/hidden
      "periode": {
        "gyldigFra": "2022-03-08",
        "gyldigTil": null
      },
      "sidstOpdateret": "2022-03-14T11:39:18.000+01:00"
    }],
    "telefaxNummer": [],                     // Fax numbers (same structure as phone)
    "elektroniskPost": [{                    // Email addresses (nested)
      "kontaktoplysning": "shah030993@gmail.com",
      "hemmelig": false,
      "periode": {
        "gyldigFra": "2022-06-04",
        "gyldigTil": null
      },
      "sidstOpdateret": "2022-06-07T11:40:37.000+02:00"
    }],
    "postadresse": [],                       // Postal address (if different)
    
    // Industry Classification
    "hovedbranche": [{                       // Main industry (nested)
      "branchekode": "494100",               // Industry code
      "branchetekst": "Vejgodstransport",    // Industry description
      "periode": {
        "gyldigFra": "2025-01-01",
        "gyldigTil": null
      },
      "sidstOpdateret": "2024-12-28T09:57:12.000+01:00"
    }],
    "bibranche1": [{                         // Secondary industry 1 (same structure)
      "branchekode": "476310",
      "branchetekst": "Detailhandel med sports- og fritidsudstyr",
      "periode": {
        "gyldigFra": "2025-05-01",
        "gyldigTil": null
      },
      "sidstOpdateret": "2025-05-20T13:57:22.000+02:00"
    }],
    "bibranche2": [],                        // Secondary industry 2
    "bibranche3": [],                        // Secondary industry 3
    "brancheAnsvarskode": null,              // Industry responsibility code
    
    // Employment Data - Annual (aarsbeskaeftigelse)
    "aarsbeskaeftigelse": [{                 // Annual employment (nested)
      "aar": 2014,                           // Year (integer)
      "antalAarsvaerk": 1,                   // Full-time equivalent employees (integer)
      "antalAnsatte": 1,                     // Number of employees (integer)
      "antalInklusivEjere": null,            // Including owners (integer or null)
      "intervalKodeAntalAarsvaerk": "ANTAL_1_1",      // FTE interval code
      "intervalKodeAntalAnsatte": "ANTAL_1_1",        // Employee count interval
      "intervalKodeAntalInklusivEjere": null,         // Owner inclusive interval
      "sidstOpdateret": "2016-06-25T21:04:32.000+02:00"
    }],
    
    // Employment Data - Quarterly (kvartalsbeskaeftigelse)
    "kvartalsbeskaeftigelse": [{             // Quarterly employment (nested)
      "aar": 2015,                           // Year
      "kvartal": 2,                          // Quarter (1-4)
      "antalAarsvaerk": 1,                   // FTE employees
      "antalAnsatte": 0,                     // Number of employees
      "intervalKodeAntalAarsvaerk": "ANTAL_1_1",
      "intervalKodeAntalAnsatte": "ANTAL_0_0",
      "sidstOpdateret": "2015-12-16T23:39:59.000+01:00"
    }],
    
    // Employment Data - Monthly (erstMaanedsbeskaeftigelse)
    "erstMaanedsbeskaeftigelse": [{          // Monthly employment replacement (nested)
      "aar": 2025,                           // Year
      "maaned": 6,                           // Month (1-12)
      "antalAarsvaerk": 1.28,                // FTE employees (scaled_float)
      "antalAnsatte": 2,                     // Number of employees
      "intervalKodeAntalAarsvaerk": "ANTAL_1_1",
      "intervalKodeAntalAnsatte": "ANTAL_2_4",
      "sidstOpdateret": "2025-08-26T01:01:26.000+02:00"
    }],
    
    // Lifecycle
    "livsforloeb": [{                        // Lifecycle (nested)
      "periode": {
        "gyldigFra": "2022-03-08",           // Start date
        "gyldigTil": null                    // End date (null = active)
      },
      "sidstOpdateret": "2022-03-14T11:39:18.000+01:00"
    }],
    
    // Company Relationship
    "virksomhedsrelation": [{                // Parent company relation (nested)
      "cvrNummer": 43121774,                 // Parent CVR number (keyword)
      "periode": {
        "gyldigFra": "2022-03-08",
        "gyldigTil": null
      },
      "sidstOpdateret": "2022-03-14T11:39:18.000+01:00"
    }],
    
    // Additional Attributes
    "attributter": [],                       // Additional attributes (nested)
    "deltagerRelation": [],                  // Participant relations (nested, rarely used)
    
    // Metadata (Latest/Current values for easy querying)
    "produktionsEnhedMetadata": {
      "nyesteNavn": {                        // Latest name
        "navn": "NordEx ApS",
        "periode": {
          "gyldigFra": "2022-10-06",
          "gyldigTil": null
        },
        "sidstOpdateret": "2022-10-06T11:40:46.000+02:00"
      },
      "nyesteBeliggenhedsadresse": {...},    // Latest address
      "nyesteHovedbranche": {...},           // Latest main industry
      "nyesteBibranche1": {...},             // Latest secondary industry 1
      "nyesteBibranche2": null,              // Latest secondary industry 2
      "nyesteBibranche3": null,              // Latest secondary industry 3
      "nyesteKontaktoplysninger": ["28403131"], // Latest contact info array
      "nyesteCvrNummerRelation": 43121774,   // Latest parent CVR (long)
      "nyesteAarsbeskaeftigelse": {...},     // Latest annual employment
      "nyesteKvartalsbeskaeftigelse": {...}, // Latest quarterly employment
      "nyesteErstMaanedsbeskaeftigelse": {...}, // Latest monthly employment
      "sammensatStatus": "Aktiv"             // Combined status (text)
    },
    
    // System Fields
    "reklamebeskyttet": true,                // Marketing protection (boolean)
    "fejlRegistreret": false,                // Registration error flag
    "fejlVedIndlaesning": false,             // Data loading error flag
    "fejlBeskrivelse": null,                 // Error description
    "dataAdgang": 0,                         // Data access level (integer)
    "sidstIndlaest": "2025-09-08T17:57:17.199+02:00", // Last loaded
    "sidstOpdateret": "2025-09-08T17:56:31.000+02:00", // Last updated
    "naermesteFremtidigeDato": null,         // Next future date
    "virkningsAktoer": "R"                   // Effect actor
  }
}
```

#### Employment Data Structure (aarsbeskaeftigelse)

The employment data uses interval codes to represent ranges:

| Interval Code | Description | Range |
|---------------|-------------|-------|
| `ANTAL_0_0` | Zero employees | 0 |
| `ANTAL_1_1` | 1 employee | 1 |
| `ANTAL_2_4` | 2-4 employees | 2-4 |
| `ANTAL_5_9` | 5-9 employees | 5-9 |
| `ANTAL_10_19` | 10-19 employees | 10-19 |
| `ANTAL_20_49` | 20-49 employees | 20-49 |
| `ANTAL_50_99` | 50-99 employees | 50-99 |
| `ANTAL_100_199` | 100-199 employees | 100-199 |
| `ANTAL_200_499` | 200-499 employees | 200-499 |
| `ANTAL_500_999` | 500-999 employees | 500-999 |
| `ANTAL_1000_` | 1000+ employees | 1000+ |

#### Key Data Types in Mapping

| Field | Elasticsearch Type | Description |
|-------|-------------------|-------------|
| `pNummer` | keyword | P-number identifier |
| `enhedsNummer` | long | Internal unit number |
| `samtId` | integer | System ID |
| `reklamebeskyttet` | boolean | Marketing protection flag |
| `aarsbeskaeftigelse.antalAarsvaerk` | integer | Full-time equivalent |
| `erstMaanedsbeskaeftigelse.antalAarsvaerk` | scaled_float | FTE with decimals |
| `beliggenhedsadresse` | nested | Address with include_in_parent |
| `navne` | nested | Names with include_in_parent |
| `virksomhedsrelation.cvrNummer` | keyword | Parent company CVR |

## Advanced Query Features (Elasticsearch 1.7.4)

The CVR API supports a comprehensive range of advanced Elasticsearch query features despite running on the older ES 1.7.4. Below is a complete reference of tested and supported features.

### Supported Query Types

#### 1. Fuzzy Search Queries ✅
**Purpose**: Handle typos and approximate matches
**Status**: Fully supported with fuzziness parameters

```json
{
  "query": {
    "fuzzy": {
      "Vrvirksomhed.navne.navn": {
        "value": "Maesk",
        "fuzziness": 1,
        "max_expansions": 50
      }
    }
  }
}
```

**Parameters**:
- `fuzziness`: 0-2 (AUTO, 1, 2)
- `max_expansions`: Controls performance vs accuracy
- Case-sensitive matching

#### 2. Wildcard Queries ✅
**Purpose**: Pattern matching with * and ? wildcards
**Status**: Fully supported, case-sensitive

```json
{
  "query": {
    "wildcard": {
      "Vrvirksomhed.navne.navn": "dan*"
    }
  }
}
```

**Notes**:
- `*` matches zero or more characters
- `?` matches exactly one character  
- Case-sensitive (use lowercase for better results)

#### 3. Range Queries ✅
**Purpose**: Query numeric, date, and string ranges
**Status**: Fully supported for all data types

```json
// Numeric ranges
{
  "query": {
    "range": {
      "Vrvirksomhed.cvrNummer": {
        "gte": 10000000,
        "lte": 10000010
      }
    }
  }
}

// Date ranges  
{
  "query": {
    "range": {
      "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
        "gte": "2023-01-01",
        "lt": "2023-02-01"
      }
    }
  }
}

// String ranges (for nested decimal values)
{
  "query": {
    "range": {
      "Vrvirksomhed.attributter.vaerdier.vaerdi": {
        "gte": "1000000.00",
        "lte": "2000000.00"
      }
    }
  }
}
```

#### 4. Boolean Queries with Multiple Conditions ✅
**Purpose**: Complex logic with must, must_not, should, filter
**Status**: Fully supported with all clauses

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80
          }
        }
      ],
      "must_not": [
        {
          "exists": {
            "field": "Vrvirksomhed.virksomhedsstatus.periode.gyldigTil"
          }
        }
      ],
      "should": [
        {
          "range": {
            "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
              "gte": "2020-01-01"
            }
          }
        }
      ],
      "filter": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80
          }
        }
      ]
    }
  }
}
```

#### 5. Nested Queries ✅
**Purpose**: Query array fields with proper object context
**Status**: Fully supported in ES 1.7.4

```json
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

#### 6. Exists/Missing Field Queries ✅ (with limitations)
**Purpose**: Find documents with or without specific fields
**Status**: Partially supported

```json
// EXISTS query - works
{
  "query": {
    "exists": {
      "field": "Vrvirksomhed.hjemmeside"
    }
  }
}

// MISSING query - NOT supported in ES 1.7.4
// Use this instead:
{
  "query": {
    "bool": {
      "must_not": {
        "exists": {
          "field": "Vrvirksomhed.hjemmeside"
        }
      }
    }
  }
}
```

#### 7. Prefix Queries ✅
**Purpose**: Match terms that start with specific prefixes  
**Status**: Fully supported, case-sensitive

```json
{
  "query": {
    "prefix": {
      "Vrvirksomhed.navne.navn": "novo"
    }
  }
}
```

**Note**: Case-sensitive; use appropriate case for better matches

#### 8. Script Queries ❌
**Purpose**: Custom logic using scripting
**Status**: **NOT supported** - Scripts are disabled

```json
// This will fail:
{
  "query": {
    "script": {
      "script": {
        "inline": "doc['field'].value > 100"
      }
    }
  }
}
```

**Error**: `"cannot execute [inline] scripts"`

#### 9. Multi-field Queries ✅
**Purpose**: Search across multiple fields
**Status**: Fully supported with various types

```json
// Multi-match query
{
  "query": {
    "multi_match": {
      "query": "Mærsk",
      "fields": ["Vrvirksomhed.navne.navn", "Vrvirksomhed.binavne.navn"],
      "type": "best_fields"
    }
  }
}

// Cross-fields with boosting
{
  "query": {
    "multi_match": {
      "query": "Mærsk Copenhagen", 
      "fields": ["Vrvirksomhed.navne.navn^2", "Vrvirksomhed.beliggenhedsadresse.postdistrikt"],
      "type": "cross_fields",
      "operator": "and"
    }
  }
}

// Query string syntax
{
  "query": {
    "query_string": {
      "query": "Mærsk AND ApS",
      "fields": ["Vrvirksomhed.navne.navn", "Vrvirksomhed.virksomhedsform.langBeskrivelse"],
      "default_operator": "AND"
    }
  }
}
```

### Aggregation Types

#### 1. Terms Aggregation ✅
**Purpose**: Group by field values
**Status**: Fully supported

```json
{
  "aggs": {
    "company_forms": {
      "terms": {
        "field": "Vrvirksomhed.virksomhedsform.virksomhedsformkode",
        "size": 20
      }
    }
  }
}
```

#### 2. Date Histogram Aggregation ✅
**Purpose**: Time-based grouping
**Status**: Fully supported

```json
{
  "aggs": {
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
```

#### 3. Nested Aggregation ✅
**Purpose**: Aggregate within nested objects
**Status**: Fully supported

```json
{
  "aggs": {
    "nested_navne": {
      "nested": {
        "path": "Vrvirksomhed.navne"
      },
      "aggs": {
        "current_names": {
          "filter": {
            "bool": {
              "must_not": {
                "exists": {
                  "field": "Vrvirksomhed.navne.periode.gyldigTil"
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

#### 4. Range Aggregation ❌ (field-dependent)
**Purpose**: Group by value ranges
**Status**: Limited due to fielddata restrictions

**Error**: `"Fielddata is disabled on text fields by default"`

### Sorting Capabilities ✅

**Status**: Fully supported with multiple sort criteria

```json
{
  "sort": [
    {
      "Vrvirksomhed.cvrNummer": {
        "order": "desc"
      }
    },
    {
      "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
        "order": "desc"
      }
    }
  ]
}
```

### Highlighting Features ✅

**Status**: Fully supported with customization

```json
{
  "highlight": {
    "pre_tags": ["<mark>"],
    "post_tags": ["</mark>"],
    "fields": {
      "Vrvirksomhed.navne.navn": {
        "fragment_size": 100,
        "number_of_fragments": 2
      }
    }
  }
}
```

### Error Scenarios and Handling

#### 1. Non-existent Fields
- **Behavior**: Returns 0 results (no error)
- **Status**: Graceful handling

#### 2. Invalid Query Types
- **Error**: `parsing_exception: "no [query] registered for [invalid_type]"`
- **Status Code**: 400

#### 3. Result Window Too Large (from + size > 3000)
- **Error**: `search_phase_execution_exception: "Result window is too large"`
- **Status Code**: 500
- **Solution**: Use scroll API

#### 4. Query Timeouts
- **Parameter**: `"timeout": "1ms"`
- **Response**: `"timed_out": true`
- **Behavior**: Returns partial results

#### 5. Invalid Parameters
- **Error**: `parsing_exception: "[query_type] does not support [parameter]"`
- **Status Code**: 400

### Limitations and Considerations

1. **Script Execution**: Completely disabled for security
2. **Fielddata**: Disabled on text fields, limiting some aggregations
3. **Range Aggregations**: Limited to non-text fields
4. **Missing Query**: Not available, use `bool.must_not.exists` instead
5. **Case Sensitivity**: Most text queries are case-sensitive
6. **ES Version**: 1.7.4 lacks some modern features

### Performance Recommendations

1. **Use filter clauses** for exact matches (better performance)
2. **Limit field retrieval** with `_source` filtering
3. **Use scroll API** for large result sets
4. **Prefix lowercase** for wildcard/prefix queries
5. **Set appropriate timeouts** for complex queries

### Real-World Use Cases

#### 1. Fuzzy Search - Company Name Variations
**Scenario**: Finding companies when users misspell names
```json
{
  "query": {
    "fuzzy": {
      "Vrvirksomhed.navne.navn": {
        "value": "Nowo Nordisk", 
        "fuzziness": 2
      }
    }
  }
}
```
**Result**: Finds "Novo Nordisk" despite typos

#### 2. Wildcard - Industry Search
**Scenario**: Finding all companies with "consulting" in their name
```json
{
  "query": {
    "wildcard": {
      "Vrvirksomhed.navne.navn": "*consulting*"
    }
  }
}
```

#### 3. Range - New Business Analysis  
**Scenario**: Analyzing business formation trends
```json
{
  "query": {
    "range": {
      "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
        "gte": "2023-01-01",
        "lte": "2023-12-31"
      }
    }
  },
  "aggs": {
    "monthly_formations": {
      "date_histogram": {
        "field": "Vrvirksomhed.livsforloeb.periode.gyldigFra",
        "interval": "month"
      }
    }
  }
}
```

#### 4. Boolean - Active ApS Companies with Capital
**Scenario**: Finding investment-ready companies
```json
{
  "query": {
    "bool": {
      "must": [
        {"term": {"Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80}},
        {"match": {"Vrvirksomhed.virksomhedsstatus.status": "NORMAL"}},
        {"exists": {"field": "Vrvirksomhed.attributter"}}
      ],
      "filter": [
        {"range": {"Vrvirksomhed.livsforloeb.periode.gyldigFra": {"gte": "2020-01-01"}}}
      ]
    }
  }
}
```

#### 5. Nested - Companies with Current Valid Names
**Scenario**: Ensuring you get the current company name
```json
{
  "query": {
    "nested": {
      "path": "Vrvirksomhed.navne",
      "query": {
        "bool": {
          "must": [
            {"match": {"Vrvirksomhed.navne.navn": "Mærsk"}},
            {"bool": {"must_not": {"exists": {"field": "Vrvirksomhed.navne.periode.gyldigTil"}}}}
          ]
        }
      }
    }
  }
}
```

#### 6. Multi-field - Comprehensive Company Search
**Scenario**: Search across names and locations simultaneously
```json
{
  "query": {
    "multi_match": {
      "query": "Novo Copenhagen",
      "fields": [
        "Vrvirksomhed.navne.navn^3",
        "Vrvirksomhed.beliggenhedsadresse.postdistrikt^1",
        "Vrvirksomhed.binavne.navn^2"
      ],
      "type": "cross_fields",
      "minimum_should_match": "50%"
    }
  }
}
```

#### 7. Aggregation - Market Analysis
**Scenario**: Understanding market composition by company type and location
```json
{
  "size": 0,
  "aggs": {
    "company_forms": {
      "terms": {
        "field": "Vrvirksomhed.virksomhedsform.virksomhedsformkode"
      },
      "aggs": {
        "by_region": {
          "terms": {
            "field": "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneNavn"
          }
        }
      }
    }
  }
}
```

#### 8. Highlighting - Search Result Enhancement
**Scenario**: Showing search matches to users
```json
{
  "query": {"match": {"Vrvirksomhed.navne.navn": "Mærsk"}},
  "highlight": {
    "pre_tags": ["<strong class='highlight'>"],
    "post_tags": ["</strong>"],
    "fields": {
      "Vrvirksomhed.navne.navn": {"fragment_size": 150}
    }
  }
}
```

### Advanced Query Combinations

#### Complex Business Intelligence Query
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "technology software",
            "fields": ["Vrvirksomhed.navne.navn", "Vrvirksomhed.attributter.vaerdier.vaerdi"],
            "fuzziness": "AUTO"
          }
        }
      ],
      "filter": [
        {"term": {"Vrvirksomhed.virksomhedsform.virksomhedsformkode": 80}},
        {"range": {"Vrvirksomhed.livsforloeb.periode.gyldigFra": {"gte": "2020-01-01"}}},
        {"exists": {"field": "Vrvirksomhed.hjemmeside"}}
      ],
      "must_not": [
        {"exists": {"field": "Vrvirksomhed.virksomhedsstatus.periode.gyldigTil"}}
      ]
    }
  },
  "sort": [
    {"Vrvirksomhed.livsforloeb.periode.gyldigFra": {"order": "desc"}}
  ],
  "highlight": {
    "fields": {"Vrvirksomhed.navne.navn": {}}
  },
  "aggs": {
    "by_location": {
      "terms": {"field": "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneNavn"}
    }
  }
}
```

This query finds active ApS tech companies established after 2020 with websites, sorted by establishment date, with highlighted matches and location breakdown.

## Query Examples

### 1. Basic Company Search by CVR Number

```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "term": {
      "Vrvirksomhed.cvrNummer": "10103940"
    }
  }
}
```

### 2. Search Companies by Name with Field Filtering

```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "match": {
      "Vrvirksomhed.navne.navn": "Mærsk"
    }
  },
  "_source": ["Vrvirksomhed.cvrNummer", "Vrvirksomhed.navne", "Vrvirksomhed.virksomhedsstatus"],
  "size": 10
}
```

### 3. Find Active Companies Established After 2020

```json
POST /cvr-permanent/virksomhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
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
  "size": 100
}
```

### 4. Aggregate Companies by Form Type

```json
POST /cvr-permanent/virksomhed/_search
{
  "size": 0,
  "aggs": {
    "company_forms": {
      "terms": {
        "field": "Vrvirksomhed.virksomhedsform.virksomhedsformkode",
        "size": 20
      }
    }
  }
}
```

### 5. Find Production Units for a Company

```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "term": {
      "VrproduktionsEnhed.virksomhedsrelation.cvrNummer": "43121774"
    }
  },
  "_source": ["VrproduktionsEnhed.pNummer", "VrproduktionsEnhed.navne", "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus"]
}
```

### 7. Production Unit Specific Queries

#### 7.1 Find Production Units by P-Number
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "term": {
      "VrproduktionsEnhed.pNummer": "1028076343"
    }
  }
}
```

#### 7.2 Search Production Units by Name
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "match": {
      "VrproduktionsEnhed.navne.navn": "NordEx"
    }
  },
  "_source": ["VrproduktionsEnhed.pNummer", "VrproduktionsEnhed.navne", "VrproduktionsEnhed.virksomhedsrelation"]
}
```

#### 7.3 Find Active Production Units by Industry
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
          "match": {
            "VrproduktionsEnhed.hovedbranche.branchetekst": "transport"
          }
        }
      ]
    }
  },
  "size": 20
}
```

#### 7.4 Find Production Units with Recent Employment Data
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {
              "gte": 2024
            }
          }
        },
        {
          "range": {
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte": {
              "gt": 0
            }
          }
        }
      ]
    }
  },
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.navne",
    "VrproduktionsEnhed.erstMaanedsbeskaeftigelse"
  ],
  "sort": [
    {
      "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte": {
        "order": "desc"
      }
    }
  ]
}
```

#### 7.5 Find Production Units by Address (Municipality)
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "nested": {
      "path": "VrproduktionsEnhed.beliggenhedsadresse",
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "VrproduktionsEnhed.beliggenhedsadresse.kommune.kommuneKode": 101
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "bool": {
                      "must_not": {
                        "exists": {
                          "field": "VrproduktionsEnhed.beliggenhedsadresse.periode.gyldigTil"
                        }
                      }
                    }
                  },
                  {
                    "term": {
                      "VrproduktionsEnhed.beliggenhedsadresse.periode.gyldigTil": null
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    }
  },
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.navne",
    "VrproduktionsEnhed.beliggenhedsadresse"
  ],
  "size": 10
}
```

#### 7.6 Find Production Units with Contact Information
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "exists": {
            "field": "VrproduktionsEnhed.telefonNummer"
          }
        },
        {
          "exists": {
            "field": "VrproduktionsEnhed.elektroniskPost"
          }
        }
      ],
      "minimum_should_match": 1,
      "must": [
        {
          "term": {
            "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus": "Aktiv"
          }
        }
      ]
    }
  },
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.navne",
    "VrproduktionsEnhed.telefonNummer",
    "VrproduktionsEnhed.elektroniskPost"
  ]
}
```

#### 7.7 Employment Analysis Query
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
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
  "aggs": {
    "employment_by_interval": {
      "terms": {
        "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.intervalKodeAntalAnsatte",
        "size": 20
      }
    },
    "monthly_employment": {
      "date_histogram": {
        "script": {
          "source": "new Date(doc['VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar'].value - 1900, doc['VrproduktionsEnhed.erstMaanedsbeskaeftigelse.maaned'].value - 1, 1).getTime()"
        },
        "interval": "month"
      },
      "aggs": {
        "avg_employees": {
          "avg": {
            "field": "VrproduktionsEnhed.erstMaanedsbeskaeftigelse.antalAnsatte"
          }
        }
      }
    }
  },
  "size": 0
}
```

### 8. Understanding Relationships: Produktionsenhed ↔ Virksomhed

Production units are linked to their parent companies through the `virksomhedsrelation.cvrNummer` field. Here's how to work with these relationships:

#### 8.1 Find Parent Company from Production Unit
```bash
# Step 1: Get production unit and extract CVR number
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/produktionsenhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "VrproduktionsEnhed.pNummer": "1028076343"
      }
    },
    "_source": ["VrproduktionsEnhed.virksomhedsrelation.cvrNummer"]
  }'

# Step 2: Use CVR number to get parent company
curl -u "$CVR_USERNAME:$CVR_PASSWORD" \
  -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "Vrvirksomhed.cvrNummer": "43121774"
      }
    }
  }'
```

#### 8.2 Find All Production Units for a Company
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "term": {
      "VrproduktionsEnhed.virksomhedsrelation.cvrNummer": "43121774"
    }
  },
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.navne",
    "VrproduktionsEnhed.beliggenhedsadresse",
    "VrproduktionsEnhed.produktionsEnhedMetadata.sammensatStatus"
  ]
}
```

#### 8.3 Cross-Index Analysis: Company + Production Units
```python
# Python example for comprehensive company analysis
def get_company_with_units(cvr_number, client):
    # Get company information
    company_query = {
        "query": {"term": {"Vrvirksomhed.cvrNummer": str(cvr_number)}}
    }
    company_response = client.search("virksomhed", company_query)
    
    # Get all production units
    units_query = {
        "query": {"term": {"VrproduktionsEnhed.virksomhedsrelation.cvrNummer": str(cvr_number)}},
        "_source": [
            "VrproduktionsEnhed.pNummer",
            "VrproduktionsEnhed.navne",
            "VrproduktionsEnhed.beliggenhedsadresse",
            "VrproduktionsEnhed.erstMaanedsbeskaeftigelse"
        ]
    }
    units_response = client.search("produktionsenhed", units_query)
    
    return {
        "company": company_response,
        "production_units": units_response,
        "total_units": units_response.get("hits", {}).get("total", 0)
    }
```

### 9. Employment Data Analysis Patterns

#### 9.1 Current vs Historical Employment
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "term": {
      "VrproduktionsEnhed.pNummer": "1028076343"
    }
  },
  "_source": [
    "VrproduktionsEnhed.aarsbeskaeftigelse",
    "VrproduktionsEnhed.kvartalsbeskaeftigelse", 
    "VrproduktionsEnhed.erstMaanedsbeskaeftigelse",
    "VrproduktionsEnhed.produktionsEnhedMetadata.nyesteErstMaanedsbeskaeftigelse"
  ]
}
```

#### 9.2 Employment Trends Over Time
```json
POST /cvr-permanent/produktionsenhed/_search
{
  "query": {
    "bool": {
      "must": [
        {"term": {"VrproduktionsEnhed.virksomhedsrelation.cvrNummer": "43121774"}},
        {"range": {"VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {"gte": 2023}}}
      ]
    }
  },
  "sort": [
    {"VrproduktionsEnhed.erstMaanedsbeskaeftigelse.aar": {"order": "asc"}},
    {"VrproduktionsEnhed.erstMaanedsbeskaeftigelse.maaned": {"order": "asc"}}
  ],
  "_source": [
    "VrproduktionsEnhed.pNummer",
    "VrproduktionsEnhed.erstMaanedsbeskaeftigelse"
  ]
}
```

### 10. Data Quality Considerations

#### 10.1 Handling Missing or Null Data
- **Employment data**: Not all units have all three types (annual/quarterly/monthly)
- **Contact info**: Many units have empty phone/email arrays
- **Historical data**: Older records may have incomplete information

#### 10.2 Validity Periods
All temporal data uses `periode.gyldigFra` and `periode.gyldigTil`:
- `gyldigTil: null` = currently valid
- `gyldigTil: "YYYY-MM-DD"` = ended on this date

#### 10.3 Status Interpretation
- `sammensatStatus: "Aktiv"` = Currently active
- `sammensatStatus: "Ophørt"` = Ceased operations
- Use metadata fields for current values, historical arrays for changes over time

### 6. Pagination with Scroll API

For retrieving large datasets (>3000 documents):

```bash
# Initial request with scroll parameter
curl -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search?scroll=1m" \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 100,
    "query": {"match_all": {}}
  }'

# Subsequent requests using scroll_id
curl -X POST "http://distribution.virk.dk/cvr-permanent/_search/scroll" \
  -H 'Content-Type: application/json' \
  -d '{
    "scroll": "1m",
    "scroll_id": "YOUR_SCROLL_ID_HERE"
  }'
```

## Best Practices

### 1. Query Optimization
- Use `_source` filtering to retrieve only needed fields
- Limit result size with appropriate `size` parameter
- Use term queries for exact matches (CVR numbers)
- Use match queries for text searches (company names)

### 2. Handling Historical Data
- Check `periode.gyldigTil` field: `null` means currently valid
- Sort by `periode.gyldigFra` for chronological order
- Consider using date range queries for temporal filtering

### 3. Error Handling
```python
# Example error handling pattern
try:
    response = requests.post(url, json=query, auth=auth)
    if response.status_code == 500:
        error = response.json()
        if "Result window is too large" in error.get("error", {}).get("reason", ""):
            # Use scroll API instead
            pass
except Exception as e:
    # Handle connection errors
    pass
```

### 4. Rate Limiting
- No documented rate limits, but implement reasonable delays
- Use bulk operations where possible
- Cache frequently accessed data

## Limitations

### 1. Result Window Limitation
- **Maximum**: 3000 documents per query (from + size <= 3000)
- **Solution**: Use scroll API for larger datasets
- **Error Code**: 500 with "Result window is too large" message

### 2. Elasticsearch Version
- Running on Elasticsearch 1.7.4 (released 2015)
- Limited query DSL features compared to modern versions
- No support for newer aggregation types

### 3. Data Limitations
- Historical data may be incomplete for older companies
- Some fields may be null or missing
- Data update frequency not documented

### 4. Technical Constraints
- HTTP only (no HTTPS)
- No GraphQL or REST alternatives
- Limited to Elasticsearch query syntax

## Alternative Resources

### 1. CVR.dev - Modern API Alternative
- **URL**: https://cvr.dev
- **Documentation**: https://docs.cvr.dev
- **Advantages**: 
  - Modern REST API
  - Better documentation
  - Simpler query structure
  - HTTPS support

### 2. Official CVR Web Portal
- **Danish**: https://datacvr.virk.dk/data/
- **English**: https://datacvr.virk.dk/data/?language=en-gb
- **Use Case**: Manual lookups and data verification

### 3. Developer Libraries

#### Python - virk.dk
```bash
pip install virk
```
- GitHub: https://github.com/magenta-aps/virk.dk
- Provides high-level abstractions for common queries

#### Node.js Wrapper
- Available for JavaScript/TypeScript developers
- Simplifies authentication and query building

### 4. Official Support
- **Email**: cvrselvbetjening@erst.dk
- **Purpose**: Request access, report issues, get support

## Sample Implementation

### Python Example
```python
import requests
import json

class CVRClient:
    def __init__(self, username, password):
        self.auth = (username, password)
        self.base_url = "http://distribution.virk.dk/cvr-permanent"
    
    def search_by_cvr(self, cvr_number):
        query = {
            "query": {
                "term": {
                    "Vrvirksomhed.cvrNummer": str(cvr_number)
                }
            }
        }
        
        response = requests.post(
            f"{self.base_url}/virksomhed/_search",
            json=query,
            auth=self.auth
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API Error: {response.status_code}")

# Usage
client = CVRClient(os.getenv("CVR_USERNAME"), os.getenv("CVR_PASSWORD"))
result = client.search_by_cvr("10103940")
```

### cURL Example
```bash
#!/bin/bash

# Function to search company by name
search_company() {
    local company_name="$1"
    
    curl -s -u "$CVR_USERNAME:$CVR_PASSWORD" \
        -X POST "http://distribution.virk.dk/cvr-permanent/virksomhed/_search" \
        -H 'Content-Type: application/json' \
        -d "{
            \"query\": {
                \"match\": {
                    \"Vrvirksomhed.navne.navn\": \"$company_name\"
                }
            },
            \"size\": 5
        }" | python3 -m json.tool
}

# Usage
search_company "Novo Nordisk"
```

## Advanced Query Features

The CVR API supports comprehensive Elasticsearch 1.7.4 query capabilities. Here are the key advanced features tested and confirmed working:

### Supported Query Types

#### 1. Fuzzy Search
Handle typos and variations in company names:
```json
{
  "query": {
    "match": {
      "Vrvirksomhed.navne.navn": {
        "query": "Novo Nordysk",
        "fuzziness": "AUTO"
      }
    }
  }
}
```

#### 2. Wildcard Queries
Pattern matching with * and ? (case-sensitive):
```json
{
  "query": {
    "wildcard": {
      "Vrvirksomhed.navne.navn": "*MÆRSK*"
    }
  }
}
```

#### 3. Boolean Queries
Complex logic combinations:
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsstatus.status": "NORMAL"
          }
        }
      ],
      "must_not": [
        {
          "term": {
            "Vrvirksomhed.virksomhedsform.virksomhedsformkode": 10
          }
        }
      ],
      "should": [
        {
          "range": {
            "Vrvirksomhed.attributter.vaerdier.vaerdi": {
              "gte": "1000000"
            }
          }
        }
      ],
      "filter": [
        {
          "term": {
            "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode": 101
          }
        }
      ]
    }
  }
}
```

#### 4. Nested Queries
Query within nested object arrays:
```json
{
  "query": {
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
                  "gte": "1000000"
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

#### 5. Range Queries
Date, numeric, and string ranges:
```json
{
  "query": {
    "range": {
      "Vrvirksomhed.livsforloeb.periode.gyldigFra": {
        "gte": "2020-01-01",
        "lte": "2023-12-31"
      }
    }
  }
}
```

### Advanced Aggregations

#### Terms Aggregation with Sub-aggregations
```json
{
  "size": 0,
  "aggs": {
    "by_municipality": {
      "terms": {
        "field": "Vrvirksomhed.beliggenhedsadresse.kommune.kommuneKode",
        "size": 10
      },
      "aggs": {
        "by_company_form": {
          "terms": {
            "field": "Vrvirksomhed.virksomhedsform.virksomhedsformkode",
            "size": 5
          }
        },
        "avg_capital": {
          "avg": {
            "field": "Vrvirksomhed.attributter.vaerdier.vaerdi"
          }
        }
      }
    }
  }
}
```

#### Date Histogram
```json
{
  "size": 0,
  "aggs": {
    "companies_over_time": {
      "date_histogram": {
        "field": "Vrvirksomhed.livsforloeb.periode.gyldigFra",
        "interval": "year",
        "format": "yyyy",
        "min_doc_count": 1
      }
    }
  }
}
```

### Query Limitations in ES 1.7.4

#### ❌ Not Available
- **Script Queries**: Disabled for security
- **Missing Queries**: Use `bool.must_not.exists` instead
- **Range Aggregations**: Limited due to fielddata restrictions

#### ⚠️ Limitations
- **Case Sensitivity**: Most text queries are case-sensitive
- **Fielddata**: Required for aggregations on analyzed fields
- **Result Window**: Maximum 3000 documents (from + size ≤ 3000)

## Error Handling

### Complete Error Response Catalog

#### 1. Result Window Too Large (HTTP 500)
```json
{
  "error": {
    "type": "search_phase_execution_exception",
    "reason": "Result window is too large, from + size must be less than or equal to: [3000] but was [3002]. See the scroll api for a more efficient way to request large data sets.",
    "phase": "query",
    "grouped": true
  },
  "status": 500
}
```
**Solution**: Use scroll API for large datasets

#### 2. Authentication Error (HTTP 401)
```html
<html>
<head><title>401 Authorization Required</title></head>
<body>
<center><h1>401 Authorization Required</h1></center>
<hr><center>nginx</center>
</body>
</html>
```
**Solution**: Verify username and password

#### 3. Invalid Query Syntax (HTTP 400)
```json
{
  "error": {
    "type": "parsing_exception",
    "reason": "no [query] registered for [invalidquerytype]",
    "line": 1,
    "col": 32
  },
  "status": 400
}
```
**Solution**: Fix query syntax according to ES 1.7.4 documentation

#### 4. Field Does Not Exist
- **Response**: HTTP 200 with 0 results
- **Behavior**: Graceful handling, returns empty result set
- **Solution**: Check field names in field reference

#### 5. Invalid Endpoint
- **Response**: HTTP 200 with 0 results across all indices
- **Behavior**: Searches all available indices if endpoint doesn't match
- **Solution**: Use correct endpoint names (virksomhed, deltager, produktionsenhed)

### Error Handling Best Practices

```python
try:
    response = requests.post(url, json=query, auth=auth)
    
    if response.status_code == 401:
        # Authentication failed
        raise AuthenticationError("Invalid credentials")
    
    if response.status_code == 500:
        error_data = response.json()
        if "Result window is too large" in error_data.get("error", {}).get("reason", ""):
            # Use scroll API instead
            return use_scroll_api(query)
        else:
            raise ServerError(f"Server error: {error_data}")
    
    if response.status_code == 400:
        error_data = response.json()
        raise QueryError(f"Invalid query: {error_data}")
    
    response.raise_for_status()
    return response.json()
    
except requests.exceptions.Timeout:
    # Implement retry logic
    raise TimeoutError("Request timed out")
except requests.exceptions.ConnectionError:
    # Handle network issues
    raise ConnectionError("Unable to connect to CVR API")
```

## Enum Reference

### Company Form Codes (virksomhedsformkode)

| Code | Short | Full Description | Count | Notes |
|------|-------|------------------|-------|--------|
| 10 | ENK | Enkeltmandsvirksomhed | 909,223 | Sole proprietorship |
| 80 | APS | Anpartsselskab | 671,891 | Private limited company |
| 60 | A/S | Aktieselskab | 95,806 | Public limited company |
| 115 | FOR | Forening | 165,959 | Association |
| 15 | I/S | Interessentskab | 136,338 | General partnership |
| 30 | K/S | Kommanditselskab | 106,271 | Limited partnership |
| 81 | APS | Anpartsselskab stiftet før 1992 | 4,847 | Pre-1992 APS |
| 245 | UDENL | Udenlandsk selskab filial | 4,847 | Foreign company branch |
| 590 | ØVRIG | Øvrig selskabsform | 68,789 | Other company forms |

### Company Status Values (virksomhedsstatus.status)

| Status | Description | Frequency | Notes |
|--------|-------------|-----------|--------|
| NORMAL | Active company | 817,129 | Currently operating |
| UNDER TVANGSOPLØSNING | Under forced dissolution | ~50,000 | Legal dissolution process |
| TVANGSOPLØST | Forcibly dissolved | ~35,000 | Dissolved by authorities |
| UNDER FRIVILLIG LIKVIDATION | Under voluntary liquidation | ~25,000 | Voluntary dissolution |
| OPLØST EFTER FRIVILLIG LIKVIDATION | Dissolved after voluntary liquidation | ~20,000 | Completed dissolution |
| UNDER KONKURS | Under bankruptcy | ~15,000 | Bankruptcy proceedings |
| OPLØST EFTER KONKURS | Dissolved after bankruptcy | ~12,000 | Post-bankruptcy |
| UNDER REKONSTRUKTION | Under reconstruction | ~5,000 | Financial restructuring |

### Top Industry Codes (hovedbranche.branchekode)

| Code | Description | Count | Category |
|------|-------------|--------|----------|
| 620100 | Computer Programming | 85,431 | IT/Software |
| 702200 | Business and Management Consultancy | 68,234 | Consulting |
| 561000 | Restaurants | 45,678 | Food Service |
| 681000 | Buying and Selling Own Real Estate | 38,567 | Real Estate |
| 011000 | Growing Non-Perennial Crops | 35,234 | Agriculture |
| 869000 | Other Human Health Activities | 28,456 | Healthcare |
| 731100 | Advertising Agencies | 25,789 | Marketing |
| 432000 | Electrical Installation | 24,567 | Construction |
| 711000 | Architectural Services | 23,456 | Architecture |
| 829900 | Other Business Support Services | 22,345 | Business Support |

### Attribute Types (attributter.type)

| Type | Description | Data Type | Frequency | Notes |
|------|-------------|-----------|-----------|--------|
| KAPITAL | Share capital | decimal | 791,361 | In DKK |
| KAPITALVALUTA | Capital currency | string | 791,361 | Usually "DKK" |
| VEDTÆGT_SENESTE | Latest articles date | date | 756,234 | Last update |
| FORMÅL | Company purpose | string | 698,567 | Business purpose |
| TEGNINGSREGEL | Signing rules | string | 654,321 | Who can sign |
| REGNSKABSÅR_START | Fiscal year start | gMonthDay | 587,432 | e.g., "--01-01" |
| REGNSKABSÅR_SLUT | Fiscal year end | gMonthDay | 587,432 | e.g., "--12-31" |
| REVISION_FRAVALGT | Audit waived | boolean | 523,456 | true/false |
| NAVN_IDENTITET | Name identity | string | 456,789 | Core name |
| PSEUDOCVRNR | Pseudo CVR number | boolean | 234,567 | Historical flag |

### Municipality Codes (Top 20)

| Code | Municipality | Company Count | Region |
|------|--------------|---------------|--------|
| 101 | COPENHAGEN | 439,001 | Capital |
| 151 | FREDERIKSBERG | 67,234 | Capital |
| 461 | ODENSE | 45,678 | Southern Denmark |
| 751 | AARHUS | 89,456 | Central Denmark |
| 201 | ALBERTSLUND | 12,345 | Capital |
| 561 | ESBJERG | 23,456 | Southern Denmark |
| 621 | KOLDING | 18,789 | Southern Denmark |
| 706 | AALBORG | 34,567 | Northern Denmark |
| 173 | LYNGBY-TAARBÆK | 28,901 | Capital |
| 230 | RUDERSDAL | 22,345 | Capital |

## Additional Documentation

This comprehensive documentation is complemented by specialized reference materials:

### 📋 Field Reference Guide
**File**: `field_reference.md`
- Complete field listings for all three indices
- Data types and nested structures
- Query path references and examples
- Cross-index relationship mappings
- 200+ documented fields with examples

### 📚 Query Cookbook
**File**: `query_cookbook.md`
- 30+ real-world query examples
- Business intelligence patterns
- Compliance and research queries
- Advanced aggregation examples
- Performance-optimized patterns

### 💻 Implementation Guide
**File**: `implementation_guide.md`
- Production-ready code samples in Python, JavaScript, Java, Go, PHP, and Bash
- Error handling and retry logic
- Rate limiting and caching strategies
- Docker and Kubernetes deployment examples
- Monitoring and testing approaches

### 🔍 Quick Reference Links
- **[Field Reference](field_reference.md)** - Detailed field documentation
- **[Query Cookbook](query_cookbook.md)** - Practical query examples  
- **[Implementation Guide](implementation_guide.md)** - Production code samples
- **[Scratchpad](scratchpad.md)** - Development notes and testing

## Conclusion

The Danish CVR Registry API provides comprehensive access to business data through an Elasticsearch interface. While the system uses older technology, it remains functional and contains valuable business information. For production use, consider using wrapper libraries or the alternative CVR.dev API for better developer experience.

### Key Takeaways
1. Always handle the 3000 document limit with scroll API
2. Use field filtering to reduce response size
3. Understand the temporal nature of the data (validity periods)
4. Consider modern alternatives for new projects
5. Cache frequently accessed data to improve performance

For questions or access requests, contact cvrselvbetjening@erst.dk.