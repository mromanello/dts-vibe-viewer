# Distributed Text Services (DTS) 1.0 Release Candidate Specification

**Version:** 1.0 RC1
**Authors:** Hugh Cayless, Thibault Clérice, Jonathan Robie, Ian Scott, Bridget Almas
**License:** CC-BY 4.0
**Specification URL:** https://distributed-text-services.github.io/specifications/versions/1.0rc1/

---

## Overview

DTS provides a standardized API for accessing distributed text collections. The specification defines one entry point and three primary endpoints for navigating collections, discovering internal text structures, and retrieving document content.

### Core Capabilities

- Retrieve lists of collection members
- Access metadata about collection items
- Retrieve citeable passage lists within texts
- Retrieve document citation structure metadata
- Retrieve single passages at any citation level
- Retrieve passage ranges with defined start/end points
- Retrieve complete texts

### Endpoints

1. **Entry Endpoint** - Discover available API endpoints
2. **Collection Endpoint** - Navigate across texts, returns JSON-LD
3. **Navigation Endpoint** - Navigate within a text, returns JSON-LD
4. **Document Endpoint** - Retrieve complete or partial texts, returns TEI/XML or other formats

---

## 1. Entry Endpoint

### Purpose
Provides discovery information for all API endpoints.

### Request
**Method:** GET
**Content-Type:** `application/ld+json`

### Response Structure

```json
{
  "@context": "https://distributed-text-services.github.io/specifications/context/1.0rc1.json",
  "@id": "/api/dts/",
  "@type": "EntryPoint",
  "dtsVersion": "1.0rc1",
  "collection": "/api/dts/collection/{?id,page,nav}",
  "navigation": "/api/dts/navigation/{?resource,ref,start,end,down,tree,page}",
  "document": "/api/dts/document/{?resource,ref,start,end,tree,mediaType}"
}
```

### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `@context` | string | Yes | JSON-LD context URL |
| `@id` | string | Yes | API identifier (typically the URL) |
| `@type` | string | Yes | Must be "EntryPoint" |
| `dtsVersion` | string | Yes | DTS specification version |
| `collection` | string | Yes | URI template for Collection endpoint |
| `navigation` | string | Yes | URI template for Navigation endpoint |
| `document` | string | Yes | URI template for Document endpoint |

### URI Templates

All endpoint fields use RFC 6570 URI Templates with query parameters enclosed in `{?param1,param2}`.

---

## 2. Collection Endpoint

### Purpose
Navigate across texts within collections; discover Resources and nested Collections.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | URI | No | Collection or Resource identifier |
| `page` | integer | No | Pagination support |
| `nav` | string | No | "children" (default) or "parents" |

### Response Objects

Two object types are returned: **Collection** and **Resource**.

#### Collection Object

```json
{
  "@context": "https://distributed-text-services.github.io/specifications/context/1.0rc1.json",
  "@id": "general",
  "@type": "Collection",
  "dtsVersion": "1.0rc1",
  "title": "Collection Générale de l'École Nationale des Chartes",
  "totalParents": 0,
  "totalChildren": 2,
  "collection": "/api/dts/collection/{?id,page,nav}",
  "member": [...]
}
```

##### Collection Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `@id` | string | Yes | Unique identifier |
| `@type` | string | Yes | "Collection" |
| `title` | string | Yes | Collection name |
| `totalParents` | integer | Yes | Number of parent collections |
| `totalChildren` | integer | Yes | Number of child items |
| `description` | string | No | Brief summary |
| `member` | array | No | Child Collections or Resources |
| `dublinCore` | object | No | Dublin Core metadata |
| `extensions` | object | No | Additional metadata |
| `collection` | string | Yes | URI template to Collection endpoint |
| `view` | object | No | Pagination object (when paginated) |

#### Resource Object

Extends Collection with additional properties:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `navigation` | string | Yes | URI template to Navigation endpoint |
| `document` | string | Yes | URI template to Document endpoint |
| `download` | array | No | Links to downloadable versions |
| `citationTrees` | array | No | Array of Citation Tree objects |
| `mediaTypes` | array | No | Supported response formats |

### Pagination Object

```json
{
  "@id": "/api/dts/collection/?id=general&page=1",
  "@type": "Pagination",
  "first": "/api/dts/collection/?id=general&page=1",
  "previous": null,
  "next": "/api/dts/collection/?id=general&page=2",
  "last": "/api/dts/collection/?id=general&page=5"
}
```

### MetadataObject Structure

Properties must be defined with vocabularies specified via `@context`. Values may be:
- Literals (int, float, string)
- URIs
- Localized arrays with `value` and `lang` properties (BCP 47)
- URI arrays

**Example:**
```json
{
  "dublinCore": {
    "title": [
      {"lang": "en", "value": "Dracula"},
      {"lang": "fr", "value": "Dracula"}
    ],
    "creator": ["Bram Stoker"],
    "date": ["1897"]
  }
}
```

---

## 3. Navigation Endpoint

### Purpose
Describe internal structures and citation trees within Resources; enable table-of-contents construction.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resource` | URI | **Yes** | Resource identifier |
| `ref` | string | No | Single citation node identifier (exclusive with start/end) |
| `start` | string | No | Range start (requires `end`) |
| `end` | string | No | Range end (requires `start`) |
| `down` | integer | No | Maximum depth relative to ref/start/end (−1 = full depth) |
| `tree` | string | No | CitationTree identifier (omit for default) |
| `page` | integer | No | Pagination support |

### Parameter Combinations

| down | ref | start/end | Result |
|------|-----|-----------|--------|
| absent | absent | absent | **400 Error** |
| absent | present | absent | Single CitableUnit info |
| absent | absent | present | Range endpoints info |
| 0 | present | absent | Siblings including ref |
| >0 | absent | absent | Tree from root to depth |
| >0 | present | absent | Tree from ref to depth |
| >0 | absent | present | Tree from start to end to depth |
| −1 | absent | absent | Full tree from root |
| −1 | present | absent | Full tree from ref |
| −1 | absent | present | Full tree from start to end |

### Response Structure

#### Navigation Object

```json
{
  "@context": "https://distributed-text-services.github.io/specifications/context/1.0rc1.json",
  "@id": "https://example.org/api/dts/navigation/?resource=https://en.wikisource.org/wiki/Dracula&down=1",
  "@type": "Navigation",
  "dtsVersion": "1.0rc1",
  "resource": {...},
  "member": [...]
}
```

##### Navigation Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `@id` | string | Yes | Current request URL |
| `@type` | string | Yes | "Navigation" |
| `dtsVersion` | string | Yes | DTS version |
| `resource` | object | Yes | Resource object with citation metadata |
| `ref` | object | No | CitableUnit being queried |
| `start` | object | No | Range start CitableUnit |
| `end` | object | No | Range end CitableUnit |
| `member` | array | Yes | Array of CitableUnit objects |
| `view` | object | No | Pagination object |

#### Resource Object (within Navigation)

```json
{
  "@id": "https://en.wikisource.org/wiki/Dracula",
  "@type": "Resource",
  "collection": "https://example.org/api/dts/collection/?...",
  "navigation": "https://example.org/api/dts/navigation/?...",
  "document": "https://example.org/api/dts/document/?...",
  "citationTrees": [...]
}
```

#### CitationTree Object

```json
{
  "identifier": "default",
  "@type": "CitationTree",
  "citeStructure": [
    {
      "citeType": "Chapter",
      "citeStructure": [
        {
          "citeType": "Journal Entry",
          "citeStructure": [
            {"citeType": "Paragraph"}
          ]
        }
      ]
    }
  ],
  "description": "Citation hierarchy for Dracula"
}
```

##### CitationTree Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identifier` | string | Conditional | Required if multiple trees exist |
| `@type` | string | Yes | "CitationTree" |
| `citeStructure` | array | Yes | Hierarchical structure array |
| `description` | string | No | Human-readable explanation |

#### CiteStructure Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `citeType` | string | **Yes** | Textual unit type (e.g., "chapter", "verse") |
| `citeStructure` | array | No | Nested structure array |

#### CitableUnit Object

```json
{
  "identifier": "C1",
  "@type": "CitableUnit",
  "level": 1,
  "parent": null,
  "citeType": "Chapter",
  "dublinCore": {
    "title": [{"lang": "en", "value": "Chapter 1: Jonathan Harker's Journal"}]
  }
}
```

##### CitableUnit Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identifier` | string | **Yes** | Unique within CitationTree |
| `@type` | string | Yes | "CitableUnit" |
| `level` | integer | **Yes** | Depth in citation tree |
| `parent` | string/null | **Yes** | Parent identifier or null |
| `citeType` | string | No | Unit type (e.g., "chapter") |
| `@id` | string | No | Optional URI for linked data |
| `dublinCore` | object | No | Dublin Core metadata |
| `extensions` | object | No | Extended metadata |

### CitableUnit Ordering

Members are returned in document order (pre-order, depth-first traversal per XPath 3.1).

### Error Handling

- **400 Bad Request:** Missing resource, conflicting parameters, down=0 without ref/start/end
- **404 Not Found:** Non-existent ref/start/end/tree values

---

## 4. Document Endpoint

### Purpose
Retrieve actual content of Resources or passages.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resource` | URI | **Yes** | Resource identifier |
| `ref` | string | No | Single citation node (exclusive with start/end) |
| `start` | string | No | Range start (requires `end`) |
| `end` | string | No | Range end (requires `start`) |
| `tree` | string | No | CitationTree identifier (omit for default) |
| `mediaType` | string | No | Response format identifier |

### Parameter Requirements

- `resource` is mandatory
- `tree` must be omitted for default CitationTree
- `tree` must be provided to address non-default CitationTrees
- `ref` cannot combine with `start` and `end`
- `start` requires `end` and vice versa

### Response Formats

#### TEI/XML (Recommended Default)

**Content-Type:** `application/tei+xml`

**Full Document:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader><!-- ... --></teiHeader>
  <text>
    <body>
      <!-- Document content -->
    </body>
  </text>
</TEI>
```

**Partial Content:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader><!-- ... --></teiHeader>
  <text>
    <body>
      <dts:wrapper xmlns:dts="https://w3id.org/api/dts#" ref="C1">
        <div type="chapter" n="1">
          <head>CHAPTER I</head>
          <!-- passage content -->
        </div>
      </dts:wrapper>
    </body>
  </text>
</TEI>
```

The `dts:wrapper` element may include optional `ref`, `start`, `end` XPath attributes.

#### Other Formats

Servers may support:
- **HTML:** `text/html`
- **Plain text:** `text/plain`
- **JSON:** `application/json` or `application/ld+json`

### Response Headers

```
Content-Type: application/tei+xml
Link: <https://example.org/api/dts/collection/?resource=...>; rel="collection"
```

- **Content-Type:** Media type of response
- **Link:** URI to Collection endpoint with `rel="collection"`

### Batch Requests

**Not supported.** The specification does not support batch operations; multiple asynchronous requests are recommended.

### Error Handling

- **400 Bad Request:** Missing resource parameter
- **404 Not Found:** Non-existent resource, tree, ref, start/end, or unsupported mediaType

### Example Request

**Retrieve full document:**
```
GET /api/dts/document/?resource=https://en.wikisource.org/wiki/Dracula
```

**Retrieve single passage:**
```
GET /api/dts/document/?resource=https://en.wikisource.org/wiki/Dracula&ref=C1
```

**Retrieve passage range:**
```
GET /api/dts/document/?resource=https://en.wikisource.org/wiki/Dracula&start=C1&end=C3
```

**Retrieve as HTML:**
```
GET /api/dts/document/?resource=https://en.wikisource.org/wiki/Dracula&mediaType=text/html
```

---

## Conformance Requirements

### All DTS Servers MUST:
- Implement all four endpoints: Entry, Collection, Navigation, Document
- Support all valid calls as documented
- Return appropriate HTTP error codes for invalid requests

### Level 0 Conformance
- Minimal implementations (including static file generation)
- Need not support `start` and `end` parameters on Navigation endpoint
- Should raise errors if these parameters are used

### Level 1 Conformance
- Full support for all documented features

---

## Key Concepts

### Citation Tree
Hierarchical structuring of text divisions (e.g., Book → Chapter → Paragraph) allowing multiple parallel citation schemes for the same document.

### CitableUnit
Identifiable portion of a Resource using the citation hierarchy.

### URI Templates (RFC 6570)
Parameterized URIs allowing clients to construct endpoint URLs dynamically using defined parameters.

**Example:**
```
/api/dts/navigation/{?resource,ref,start,end,down,tree,page}
```

Can be expanded to:
```
/api/dts/navigation/?resource=urn:cts:greekLit:tlg0012.tlg001&ref=1.1&down=2
```

### Metadata Vocabularies

DTS uses JSON-LD for metadata. Common vocabularies:
- **Dublin Core:** http://purl.org/dc/terms/
- **DTS terms:** https://w3id.org/api/dts#

### Content-Type Negotiation

Clients should use `Accept` headers to request preferred formats. Servers should honor these when possible or return default format.

---

## Implementation Notes

### Validation
- Responses should be valid JSON-LD
- Required fields must be present
- URIs should be properly encoded
- URI templates should follow RFC 6570

### Performance Considerations
- Implement pagination for large collections
- Cache responses when appropriate
- Support conditional requests (ETag, Last-Modified)
- Consider rate limiting

### Error Responses

Should include:
- Appropriate HTTP status code
- Error message in response body
- Details about what went wrong

**Example Error Response:**
```json
{
  "error": "Invalid parameter",
  "message": "Parameter 'ref' cannot be used with 'start' and 'end'",
  "status": 400
}
```

---

## Examples

### Example 1: Discover Entry Endpoint

**Request:**
```
GET https://dracor.org/api/v1/dts
Accept: application/ld+json
```

**Response:**
```json
{
  "@context": "https://distributed-text-services.github.io/specifications/context/1.0rc1.json",
  "@id": "https://dracor.org/api/v1/dts",
  "@type": "EntryPoint",
  "dtsVersion": "1.0rc1",
  "collection": "https://dracor.org/api/v1/dts/collections{?id,page,nav}",
  "navigation": "https://dracor.org/api/v1/dts/navigation{?resource,ref,start,end,down,tree,page}",
  "document": "https://dracor.org/api/v1/dts/documents{?resource,ref,start,end,tree,mediaType}"
}
```

### Example 2: Browse Root Collection

**Request:**
```
GET https://dracor.org/api/v1/dts/collections
```

**Response:**
```json
{
  "@context": "https://distributed-text-services.github.io/specifications/context/1.0rc1.json",
  "@id": "https://dracor.org",
  "@type": "Collection",
  "title": "DraCor - Drama Corpora Platform",
  "totalParents": 0,
  "totalChildren": 12,
  "member": [
    {
      "@id": "https://dracor.org/ger",
      "@type": "Collection",
      "title": "German Drama Corpus",
      "totalChildren": 583
    },
    {
      "@id": "https://dracor.org/rus",
      "@type": "Collection",
      "title": "Russian Drama Corpus",
      "totalChildren": 211
    }
  ]
}
```

### Example 3: Navigate Citation Structure

**Request:**
```
GET https://dracor.org/api/v1/dts/navigation?resource=ger000087&down=1
```

**Response:**
```json
{
  "@context": "https://distributed-text-services.github.io/specifications/context/1.0rc1.json",
  "@id": "https://dracor.org/api/v1/dts/navigation?resource=ger000087&down=1",
  "@type": "Navigation",
  "resource": {
    "@id": "ger000087",
    "@type": "Resource",
    "citationTrees": [
      {
        "@type": "CitationTree",
        "citeStructure": [
          {
            "citeType": "act",
            "citeStructure": [
              {"citeType": "scene"}
            ]
          }
        ]
      }
    ]
  },
  "member": [
    {
      "identifier": "1",
      "@type": "CitableUnit",
      "level": 1,
      "parent": null,
      "citeType": "act"
    },
    {
      "identifier": "2",
      "@type": "CitableUnit",
      "level": 1,
      "parent": null,
      "citeType": "act"
    }
  ]
}
```

### Example 4: Retrieve Document Passage

**Request:**
```
GET https://dracor.org/api/v1/dts/documents?resource=ger000087&ref=1.1
Accept: application/tei+xml
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>Emilia Galotti</title>
        <author>Gotthold Ephraim Lessing</author>
      </titleStmt>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <dts:wrapper xmlns:dts="https://w3id.org/api/dts#" ref="1.1">
        <div type="scene">
          <head>Erster Aufzug, Erster Auftritt</head>
          <sp who="#der_prinz">
            <speaker>DER PRINZ</speaker>
            <stage>(an einem Arbeitstische voll Briefschaften und Papieren, die er durchläuft)</stage>
            <p>Klagen, nichts als Klagen!</p>
          </sp>
        </div>
      </dts:wrapper>
    </body>
  </text>
</TEI>
```

---

## Related Standards

- **JSON-LD:** https://json-ld.org/
- **Dublin Core:** http://purl.org/dc/terms/
- **TEI:** https://tei-c.org/
- **URI Template (RFC 6570):** https://tools.ietf.org/html/rfc6570
- **XPath 3.1:** https://www.w3.org/TR/xpath-31/
- **BCP 47 (Language Tags):** https://tools.ietf.org/html/bcp47

---

## Changelog

### 1.0 Release Candidate 1 (Current)
- Initial release candidate
- Defines four endpoints: Entry, Collection, Navigation, Document
- Supports multiple citation trees
- Defines conformance levels 0 and 1

---

## Contributing

The DTS specification is developed collaboratively. Contributions, feedback, and implementations are welcome.

**Specification Repository:** https://github.com/distributed-text-services/specifications
**Issue Tracker:** https://github.com/distributed-text-services/specifications/issues

---

*This document is a reformatted summary of the official DTS 1.0 RC specification for developer reference.*
