# DTS Viewer

A modern web application for viewing DTS (Distributed Text Services) collections - similar to how Mirador works for IIIF, but for text collections.

## Overview

DTS Viewer is a production-ready web application that serves as a universal viewer for the DTS (Distributed Text Services) standard. It allows users to explore and read distributed text collections from any DTS-compliant endpoint.

## Features

- **Entry Point Interface**: Connect to any DTS endpoint by URL or use example endpoints
- **Collection Browser**: Navigate through hierarchical text collections
- **Reading Pane**: View documents with proper TEI rendering
- **Citation Management**: Generate and copy citation links
- **Validation & Error Handling**: Graceful degradation for non-conformant endpoints
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

## Tech Stack

- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **React Router** for client-side routing
- **CETEIcean** for TEI-XML rendering (to be integrated)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Type check
npm run type-check

# Build
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
src/
├── components/
│   ├── layout/           # Header, Sidebar, Layout components
│   ├── entry/            # Entry point components
│   ├── collections/      # Collection browser components
│   ├── reading/          # Reading pane components
│   ├── validation/       # Validation and error display
│   └── common/           # Reusable UI components
├── services/
│   ├── dts/              # DTS API client services
│   └── utils/            # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── context/              # React Context providers
├── constants/            # Configuration and constants
├── pages/                # Page components
└── App.tsx               # Main application component
```

## Example DTS Endpoints

The viewer comes pre-configured with these example endpoints:

- **DraCor**: `https://dracor.org/api/v1/dts` - Drama Corpora Platform
- **Heidelberg Digital Library**: `https://digi.ub.uni-heidelberg.de/editionService/dts/`
- **DOTS**: `https://dots.chartes.psl.eu/demo/api/dts/` - Digital Obvil Text Services

## DTS Specification

This viewer implements the [DTS 1.0 Release Candidate specification](https://distributed-text-services.github.io/specifications/versions/1.0rc1/).

For detailed specification information, see [DTS_SPECIFICATION.md](./DTS_SPECIFICATION.md).

## Implementation Plan

For detailed implementation phases and architecture, see [PROJECT_PLAN.md](./PROJECT_PLAN.md).

## Development Status

**Current Phase:** Phase 2 Complete - Entry Point & Endpoint Discovery

**Phase 1 - Foundation (Complete):**
- ✅ Project initialization with Vite + React + TypeScript
- ✅ Tailwind CSS configuration
- ✅ ESLint and Prettier setup
- ✅ Basic folder structure
- ✅ React Router configuration
- ✅ Basic layout components (Header, Sidebar, Layout)
- ✅ Responsive design implementation

**Phase 2 - Entry Point Discovery (Complete):**
- ✅ Entry point UI with URL input
- ✅ Example endpoints (DraCor, Heidelberg, DOTS)
- ✅ DTS Entry Endpoint client with validation
- ✅ HTTP client with error handling and timeout
- ✅ Complete TypeScript type system for DTS API
- ✅ Global state management with React Context
- ✅ Loading states with spinner
- ✅ Error handling with detailed messages
- ✅ Success state showing discovered endpoints
- ✅ Displays Collection, Navigation, Document URI templates

**Working Features:**
- Connect to any DTS Entry Endpoint
- Automatic endpoint discovery (URI templates)
- Validation of DTS responses
- Error handling with technical details
- One-click connection to example endpoints

**Next:** Phase 3 - Validation & Error Handling

For detailed progress tracking, see [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md)

## Contributing

Contributions are welcome! Please see the [PROJECT_PLAN.md](./PROJECT_PLAN.md) for implementation details and upcoming features.

## License

[To be determined]

## Acknowledgments

- [DTS Specification](https://distributed-text-services.github.io/specifications/) by the DTS community
- [CETEIcean](https://github.com/TEIC/CETEIcean) for TEI rendering
- Inspired by the [Mirador](https://projectmirador.org/) IIIF viewer

## References

- [DTS Specification](https://distributed-text-services.github.io/specifications/)
- [DTS Validator](https://github.com/mromanello/DTS-validator)
- [CETEIcean Documentation](https://github.com/TEIC/CETEIcean)
- [DraCor Discussion: DTS Viewer Concept](https://github.com/dracor-org/dracor-api/discussions/297)
