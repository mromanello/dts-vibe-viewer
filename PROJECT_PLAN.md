# DTS Viewer - Project Plan

## Project Overview

Build a modern, production-ready web application that serves as a universal viewer for the DTS (Distributed Text Services) standard - similar to how Mirador works for IIIF, but for text collections.

**Goal:** Create an intuitive, resilient viewer that makes exploring distributed text collections delightful, even when endpoints don't perfectly conform to spec.

## Tech Stack

- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **TEI Rendering:** CETEIcean
- **State Management:** React Context + hooks (start simple, evaluate Redux/Zustand if needed)
- **Routing:** React Router
- **HTTP Client:** fetch API with custom wrapper for DTS-specific logic
- **Testing:** Vitest + React Testing Library
- **Code Quality:** ESLint + Prettier

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   DTS Viewer App                    │
├─────────────────────────────────────────────────────┤
│  Entry Point │ Collection Browser │ Reading Pane   │
│  ─────────────┼───────────────────┼────────────────│
│  - URL Input │ - Tree View       │ - ToC          │
│  - Examples  │ - Metadata        │ - Content      │
│  - Discovery │ - Navigation      │ - Citation     │
│              │                   │ - Download     │
├─────────────────────────────────────────────────────┤
│              DTS Client Service Layer               │
│  - Entry Endpoint Discovery                         │
│  - Collections API (with caching)                   │
│  - Navigation API (citation trees)                  │
│  - Document API (content retrieval)                 │
│  - Validation & Error Handling                      │
├─────────────────────────────────────────────────────┤
│                  Rendering Layer                    │
│  - CETEIcean for TEI-XML                           │
│  - Progressive loading                              │
│  - Citation link generation                         │
└─────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Project Setup & Foundation (Priority 1)

**Deliverables:**
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint, Prettier
- [ ] Create basic folder structure
- [ ] Set up React Router
- [ ] Create layout components (Header, Sidebar, Main)
- [ ] Basic responsive layout

**Folder Structure:**
```
src/
├── components/
│   ├── layout/           # Header, Sidebar, MainContent
│   ├── entry/            # EntryPoint, ExampleEndpoints
│   ├── collections/      # CollectionTree, CollectionItem
│   ├── reading/          # ReadingPane, TableOfContents, TextContent
│   ├── validation/       # ValidationReport, ConformanceIndicator
│   └── common/           # Button, Input, Modal, Spinner, etc.
├── services/
│   ├── dts/              # DTS API client modules
│   │   ├── entry.ts
│   │   ├── collections.ts
│   │   ├── navigation.ts
│   │   ├── document.ts
│   │   └── validator.ts
│   └── utils/            # HTTP client, error handlers
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── context/              # React Context providers
├── constants/            # Example endpoints, config
└── App.tsx
```

### Phase 2: Entry Point & Endpoint Discovery (Priority 1)

**Deliverables:**
- [ ] Entry point UI with URL input field
- [ ] Hardcoded example endpoints as quick-select buttons
  - DraCor: `https://dracor.org/api/v1/dts`
  - Heidelberg: `https://digi.ub.uni-heidelberg.de/editionService/dts/`
  - DOTS: `https://dots.chartes.psl.eu/demo/api/dts/`
- [ ] Fetch Entry Endpoint response
- [ ] Parse JSON-LD to extract URI templates:
  - Collection endpoint
  - Navigation endpoint
  - Document endpoint
- [ ] Store endpoints in application state
- [ ] Loading states and error handling
- [ ] Stub: "Fetch from external API" option

**DTS Entry Endpoint Client:**
```typescript
interface EntryPoint {
  '@context': string;
  '@id': string;
  '@type': 'EntryPoint';
  dtsVersion: string;
  collection: string;  // URI template
  navigation: string;  // URI template
  document: string;    // URI template
}

async function fetchEntryPoint(url: string): Promise<EntryPoint>
```

### Phase 3: Validation & Error Handling (Priority 1)

**Deliverables:**
- [ ] Response validation service
- [ ] DTS spec conformance checker (inspired by DTS-validator)
- [ ] Validation levels:
  - **Critical errors:** Invalid JSON, missing required fields, wrong @type
  - **Warnings:** Spec deviations, optional fields missing, unusual patterns
  - **Info:** Non-standard but acceptable variations
- [ ] Graceful degradation logic
- [ ] Validation Report component
  - Shows conformance status
  - Lists warnings about spec deviations
  - Indicates which parts worked/didn't work
- [ ] Toggle between "strict mode" and "permissive mode"

**Validation Strategy:**
- Start strict (fail on major violations)
- Log all encountered issues
- Gradually build permissive mode based on real-world data
- Always attempt to render/process when feasible

**Example Validation:**
```typescript
interface ValidationResult {
  isValid: boolean;
  conformanceLevel: 'full' | 'partial' | 'minimal' | 'invalid';
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  expectedValue?: any;
  actualValue?: any;
}
```

### Phase 4: Collection Browser (Priority 1)

**Deliverables:**
- [ ] Sidebar/panel component with tree view
- [ ] Fetch root collection on entry point discovery
- [ ] Expand/collapse functionality for nested collections
- [ ] Distinct icons for:
  - Collections (folders/containers)
  - Resources (readable documents)
- [ ] Metadata display on hover or in detail pane
- [ ] Support pagination for large collections
- [ ] Navigation through collection hierarchies
- [ ] Responsive design (collapsible on mobile)
- [ ] Loading states for async operations
- [ ] Search/filter within collections (optional enhancement)

**Collection Types:**
```typescript
interface Collection {
  '@id': string;
  '@type': 'Collection';
  title: string;
  totalParents: number;
  totalChildren: number;
  description?: string;
  member?: Array<Collection | Resource>;
  dublinCore?: MetadataObject;
  extensions?: MetadataObject;
  collection: string;  // URI template
  view?: PaginationObject;
}

interface Resource extends Collection {
  '@type': 'Resource';
  navigation: string;   // URI template
  document: string;     // URI template
  download?: string[];
  citationTrees?: CitationTree[];
  mediaTypes?: string[];
}
```

### Phase 5: Navigation Endpoint & Citation Trees (Priority 2)

**Deliverables:**
- [ ] Navigation API client
- [ ] Fetch citation tree structure for selected Resource
- [ ] Parse CitationTree and CiteStructure
- [ ] Build internal data structure for tree representation
- [ ] Handle multiple citation trees (if available)
- [ ] Support all parameter combinations:
  - `down` for depth control
  - `ref` for single unit
  - `start`/`end` for ranges
- [ ] Error handling for 400/404 responses

**Navigation Types:**
```typescript
interface CitationTree {
  identifier?: string;
  '@type': 'CitationTree';
  citeStructure: CiteStructure[];
  description?: string;
}

interface CiteStructure {
  citeType: string;  // e.g., "book", "chapter", "verse"
  citeStructure?: CiteStructure[];
}

interface CitableUnit {
  identifier: string;
  '@type': 'CitableUnit';
  level: number;
  parent: string | null;
  citeType?: string;
  '@id'?: string;
  dublinCore?: MetadataObject;
  extensions?: MetadataObject;
}
```

### Phase 6: Reading Pane - Table of Contents (Priority 2)

**Deliverables:**
- [ ] Table of Contents component based on citation structure
- [ ] Tree view with progressive disclosure
  - Start with `down=1` to get top-level units
  - Expand on-demand for deeper levels
- [ ] Support deep hierarchies (act → scene → speech → line)
- [ ] Click to navigate to specific citable unit
- [ ] Visual indication of current location
- [ ] Keyboard navigation support
- [ ] Breadcrumb navigation showing current path

### Phase 7: Document Endpoint & Content Display (Priority 2)

**Deliverables:**
- [ ] Document API client
- [ ] Fetch document content (full or partial)
- [ ] Support multiple formats:
  - TEI-XML (primary)
  - HTML
  - Plain text (if available)
- [ ] Format selection UI
- [ ] Progressive loading strategy:
  - Load metadata + ToC initially
  - Fetch text passages on-demand when ToC item clicked
  - Pre-load adjacent sections for smooth UX
- [ ] Handle full document vs. passage retrieval
- [ ] Parse `dts:wrapper` elements in TEI responses
- [ ] Display loading states during fetch

**Document Client:**
```typescript
interface DocumentRequest {
  resource: string;     // Resource URI
  ref?: string;         // Single citation
  start?: string;       // Range start
  end?: string;         // Range end
  tree?: string;        // Citation tree identifier
  mediaType?: string;   // Format preference
}

async function fetchDocument(
  endpoint: string,
  params: DocumentRequest
): Promise<string>  // Returns content as string
```

### Phase 8: TEI Rendering with CETEIcean (Priority 2)

**Deliverables:**
- [ ] Integrate CETEIcean library
- [ ] Render TEI-XML as custom HTML5 elements
- [ ] Style TEI elements appropriately:
  - `<tei-head>` as headings
  - `<tei-p>` as paragraphs
  - `<tei-l>` (lines) with proper formatting
  - `<tei-stage>` (stage directions) in italics
  - `<tei-sp>` (speeches) with speaker labels
- [ ] Handle `dts:wrapper` elements
- [ ] Support common TEI structures
- [ ] Custom behaviors for interactive elements
- [ ] Fallback rendering for unsupported elements

**CETEIcean Integration:**
```typescript
import CETEI from 'CETEIcean';

function renderTEI(teiXML: string, container: HTMLElement) {
  const CETEIcean = new CETEI();
  CETEIcean.makeHTML5(teiXML, (data) => {
    container.appendChild(data);
  });
}
```

### Phase 9: Citation Link Generation (Priority 3)

**Deliverables:**
- [ ] Selection mechanism for citable units in reading view
- [ ] Generate fragment identifiers/URIs for units
- [ ] "Copy citation link" button for each citable unit
- [ ] Construct proper Navigation Endpoint URL with parameters
- [ ] Modal showing citation with copy-to-clipboard
- [ ] Support for:
  - Single ref citations
  - Range citations (start/end)
- [ ] Visual feedback on copy success

**Citation Features:**
```typescript
interface Citation {
  resource: string;
  ref?: string;
  start?: string;
  end?: string;
  tree?: string;
  url: string;  // Constructed Navigation URL
}

function generateCitationURL(
  navigationTemplate: string,
  citation: Citation
): string
```

### Phase 10: Progressive Text Loading (Priority 3)

**Deliverables:**
- [ ] Implement lazy loading for text passages
- [ ] Load visible sections on scroll
- [ ] Pre-fetch adjacent sections
- [ ] Cache fetched passages
- [ ] Virtualization for very large documents
- [ ] Smooth scrolling between sections
- [ ] Loading indicators for sections being fetched

**Optimization Strategy:**
- Use Intersection Observer API for viewport detection
- Cache strategy: LRU cache for recently viewed passages
- Consider IndexedDB for large document caching

### Phase 11: Download Functionality (Priority 3)

**Deliverables:**
- [ ] Download button for current document
- [ ] Format selection (if multiple available)
- [ ] Proper file naming based on metadata:
  - Use Dublin Core title
  - Include resource identifier
  - Appropriate file extension
- [ ] Download full document or current passage
- [ ] Progress indicator for large downloads
- [ ] Error handling for failed downloads

**Download Implementation:**
```typescript
interface DownloadOptions {
  resource: string;
  format: string;  // mediaType
  filename: string;
  fullDocument: boolean;
  ref?: string;    // If downloading partial
}

async function downloadDocument(
  documentEndpoint: string,
  options: DownloadOptions
): Promise<void>
```

### Phase 12: Annotation Stub (Priority 4)

**Deliverables:**
- [ ] UI element "Annotate this passage" on citable units
- [ ] Placeholder modal for annotation creation
- [ ] Data structure for Web Annotation Data Model
- [ ] Stub API endpoints for:
  - Creating annotations
  - Retrieving annotations
  - Updating annotations
  - Deleting annotations
- [ ] Visual indication of annotated passages
- [ ] Annotation display panel

**Annotation Structure (W3C Web Annotation):**
```typescript
interface Annotation {
  '@context': 'http://www.w3.org/ns/anno.jsonld';
  id: string;
  type: 'Annotation';
  motivation: 'commenting' | 'highlighting' | 'tagging';
  body: {
    type: 'TextualBody';
    value: string;
    format: 'text/plain' | 'text/html';
    language?: string;
  };
  target: {
    source: string;  // Resource URI
    selector: {
      type: 'FragmentSelector' | 'XPathSelector';
      value: string;  // DTS ref or XPath
    };
  };
  created: string;   // ISO 8601 timestamp
  creator?: string;
}
```

## Component Design

### Key Components

#### 1. EntryPointInput
- URL input field with validation
- Example endpoint buttons
- "Fetch from API" option (stub)
- Submit handler

#### 2. CollectionTree
- Recursive tree component
- Expand/collapse controls
- Icon rendering (folder/document)
- Click handlers for navigation
- Metadata tooltip/panel

#### 3. TableOfContents
- Tree view of citation structure
- Progressive expansion
- Active item highlighting
- Click to navigate to passage

#### 4. ReadingPane
- Main content container
- Format selector
- Content renderer (TEI/HTML/text)
- Citation controls
- Download button

#### 5. TEIRenderer
- CETEIcean integration
- Custom element styling
- Interactive behaviors

#### 6. ValidationReport
- Conformance status badge
- Expandable error/warning lists
- Spec reference links
- Toggle strict/permissive mode

#### 7. CitationModal
- Display citation URL
- Copy to clipboard button
- Format preview (Markdown, plain, etc.)

## State Management

### Global State (Context)
```typescript
interface AppState {
  // Endpoint configuration
  entryPointURL: string | null;
  endpoints: {
    collection: string | null;
    navigation: string | null;
    document: string | null;
  };

  // Current selection
  currentCollection: Collection | Resource | null;
  currentResource: Resource | null;
  currentCitation: CitableUnit | null;

  // UI state
  sidebarOpen: boolean;
  validationReportOpen: boolean;

  // Validation
  validationMode: 'strict' | 'permissive';
  lastValidationResult: ValidationResult | null;
}
```

### Local Component State
- Tree expansion states
- Loading indicators
- Form inputs
- Modal visibility

## API Client Design

### HTTP Client Wrapper
```typescript
class DTSClient {
  private baseURL: string;
  private endpoints: EndpointTemplates;

  async fetchEntry(url: string): Promise<EntryPoint>
  async fetchCollection(id?: string, page?: number): Promise<Collection>
  async fetchNavigation(params: NavigationParams): Promise<Navigation>
  async fetchDocument(params: DocumentParams): Promise<string>

  // Validation
  validate(response: any, expectedType: string): ValidationResult

  // Error handling
  private handleError(error: Error): void
}
```

### URI Template Expansion
Use RFC 6570 compliant library or implement custom expansion for DTS templates.

## Error Handling Strategy

### Error Types
1. **Network Errors:** Connection failures, timeouts
2. **Validation Errors:** Malformed responses, spec violations
3. **HTTP Errors:** 400, 404, 500 responses
4. **Parsing Errors:** Invalid JSON, XML parsing failures

### User-Facing Error Messages
- Clear, non-technical language
- Actionable suggestions
- Option to view technical details
- Report issue button

### Error Boundaries
- React Error Boundaries for component failures
- Graceful degradation
- Error state components

## Accessibility Requirements

- [ ] Semantic HTML elements
- [ ] ARIA labels for interactive elements
- [ ] Keyboard navigation:
  - Tab through interactive elements
  - Arrow keys for tree navigation
  - Enter/Space for activation
  - Escape to close modals
- [ ] Focus management
- [ ] Screen reader announcements for dynamic content
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Text resizing support

## Responsive Design Breakpoints

```css
/* Mobile-first approach */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Layout Adaptations
- **Mobile (<768px):** Single column, collapsible sidebar, bottom sheet for metadata
- **Tablet (768-1024px):** Two column, overlay sidebar
- **Desktop (>1024px):** Three column layout (sidebar, ToC, content)

## URL Routing Strategy

Enable deep-linking to support:
- Specific collections: `/collection/:id`
- Specific resources: `/resource/:id`
- Specific passages: `/resource/:id/ref/:ref`
- Range selections: `/resource/:id/range/:start/:end`

**Example Routes:**
```
/
/entry?endpoint=https://dracor.org/api/v1/dts
/collection/ger000087
/resource/ger000087/chapter/1
/resource/ger000087/range/1.1/1.5
/validation
```

## Performance Optimizations

- [ ] Code splitting (lazy load routes)
- [ ] Memoization for expensive renders
- [ ] Virtualized lists for large collections
- [ ] Debounced search/filter
- [ ] Request caching (stale-while-revalidate)
- [ ] Progressive image loading (if applicable)
- [ ] Service Worker for offline support (future)

## Testing Strategy

### Unit Tests
- API client functions
- Validation logic
- URI template expansion
- Citation link generation

### Integration Tests
- Component interactions
- State management flows
- API mock responses

### E2E Tests (with Playwright/Cypress)
- Entry point to reading flow
- Collection navigation
- Citation copying
- Download functionality

### Test Coverage Goals
- Minimum 70% code coverage
- 100% coverage for critical paths (validation, API clients)

## Documentation

### Developer Documentation
- [ ] README.md with setup instructions
- [ ] CONTRIBUTING.md with development guidelines
- [ ] API.md documenting service modules
- [ ] ARCHITECTURE.md explaining design decisions

### User Documentation
- [ ] User guide with screenshots
- [ ] FAQ for common issues
- [ ] Tutorial: "Getting Started with DTS Viewer"
- [ ] Video demo (optional)

## Deployment

### Build Configuration
- [ ] Environment variables for configuration
- [ ] Production build optimization
- [ ] Source maps for debugging
- [ ] Bundle size analysis

### Hosting Options
- Static hosting: Netlify, Vercel, GitHub Pages
- CDN distribution
- Custom domain support

### CI/CD Pipeline
- [ ] Automated tests on PR
- [ ] Build verification
- [ ] Deploy preview environments
- [ ] Production deployment on merge to main

## Future Enhancements (Post-MVP)

1. **Multi-endpoint comparison:** Side-by-side view of same text from different endpoints
2. **Advanced search:** Full-text search across collections
3. **User accounts:** Save favorites, annotations, reading history
4. **Annotation storage:** Backend service for persistent annotations
5. **Export formats:** PDF generation, EPUB export
6. **Collaboration:** Share reading sessions, collaborative annotations
7. **Themes:** Dark mode, customizable color schemes, reading modes
8. **i18n:** Multi-language UI support
9. **Analytics:** Usage tracking, popular collections
10. **Plugin system:** Extensibility for custom renderers, metadata displays

## Risk Mitigation

### Known Challenges

**Challenge 1: DTS Spec Instability**
- Risk: Endpoints may not conform to spec
- Mitigation: Validation with graceful degradation, permissive mode, comprehensive testing with real endpoints

**Challenge 2: Large Documents**
- Risk: Performance issues with massive texts
- Mitigation: Progressive loading, virtualization, pagination, caching

**Challenge 3: TEI Complexity**
- Risk: Diverse TEI encoding practices
- Mitigation: Configurable CETEIcean behaviors, fallback rendering, extensible styling

**Challenge 4: Browser Compatibility**
- Risk: Custom elements support
- Mitigation: Polyfills for older browsers, feature detection, graceful degradation

## Timeline Estimate

**Note:** Deliberately avoiding specific time estimates per project guidelines. Priorities indicate implementation order.

**Phase 1-4:** Foundation + Entry + Validation + Collections (Core MVP)
**Phase 5-8:** Navigation + Reading + TEI Rendering (Full Reader)
**Phase 9-11:** Citations + Progressive Loading + Download (Enhanced UX)
**Phase 12:** Annotations (Future-ready)

## Success Metrics

- Successfully connects to all three example endpoints
- Renders collections and navigates hierarchies
- Displays TEI content with proper formatting
- Generates valid citation links
- Provides useful validation feedback
- Responsive on mobile, tablet, desktop
- Accessible (passes WAVE/axe audits)
- Fast initial load (<3s on 3G)
- Positive user feedback from early testers

## Reference Links

- [DTS Specification 1.0 RC](https://distributed-text-services.github.io/specifications/versions/1.0rc1/)
- [DTS Validator Repository](https://github.com/mromanello/DTS-validator)
- [CETEIcean Documentation](https://github.com/TEIC/CETEIcean)
- [DraCor Discussion: DTS Viewer Concept](https://github.com/dracor-org/dracor-api/discussions/297)
- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/)
- [RFC 6570: URI Template](https://tools.ietf.org/html/rfc6570)
- [TEI Guidelines](https://tei-c.org/release/doc/tei-p5-doc/en/html/)

---

**Project Status:** Planning Phase
**Last Updated:** 2026-01-30
