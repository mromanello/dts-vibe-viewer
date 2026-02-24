/**
 * DTS Validation Service
 * Validates DTS responses against the specification with graceful degradation
 */

import type { EntryPoint, Collection, Resource, Navigation } from '@/types/dts';
import type {
  ValidationIssue,
  ValidationResult,
  ValidationContext,
  ValidationMode,
} from '@/types/validation';
import { determineConformanceLevel } from '@/types/validation';

const DTS_SPEC_URL = 'https://distributed-text-services.github.io/specifications/versions/1.0rc1/';

/**
 * Validate Entry Endpoint response
 */
export function validateEntryPoint(
  data: unknown,
  mode: ValidationMode = 'permissive'
): ValidationResult {
  const context: ValidationContext = {
    strict: mode === 'strict',
    endpoint: 'entry',
    endpointType: 'entry',
  };

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push({
      severity: 'error',
      message: 'Response is not a valid JSON object',
    });
    return {
      isValid: false,
      conformanceLevel: 'invalid',
      errors,
      warnings,
      info,
      timestamp: new Date().toISOString(),
    };
  }

  const entry = data as Partial<EntryPoint>;

  // Required fields per DTS spec
  validateRequiredField(entry, '@context', 'string', errors, context);
  validateRequiredField(entry, '@id', 'string', errors, context);
  validateRequiredField(entry, '@type', 'string', errors, context);

  // Validate @type value
  if (entry['@type'] && entry['@type'] !== 'EntryPoint') {
    errors.push({
      severity: 'error',
      field: '@type',
      message: `Invalid @type: Expected "EntryPoint", got "${entry['@type']}"`,
      expectedValue: 'EntryPoint',
      actualValue: entry['@type'],
      specReference: `${DTS_SPEC_URL}#entry-endpoint`,
    });
  }

  // DTS version - warning if missing, info if unexpected version
  if (!entry.dtsVersion) {
    warnings.push({
      severity: 'warning',
      field: 'dtsVersion',
      message: 'Missing recommended field: dtsVersion',
      specReference: `${DTS_SPEC_URL}#entry-endpoint`,
    });
  } else if (!entry.dtsVersion.startsWith('1.0')) {
    info.push({
      severity: 'info',
      field: 'dtsVersion',
      message: `DTS version ${entry.dtsVersion} may not be fully compatible (expected 1.0)`,
      actualValue: entry.dtsVersion,
    });
  }

  // Endpoint URI templates
  validateRequiredField(entry, 'collection', 'string', errors, context);
  validateRequiredField(entry, 'navigation', 'string', errors, context);
  validateRequiredField(entry, 'document', 'string', errors, context);

  // Validate URI template format
  if (entry.collection) {
    validateURITemplate(entry.collection, 'collection', warnings, context);
  }
  if (entry.navigation) {
    validateURITemplate(entry.navigation, 'navigation', warnings, context);
  }
  if (entry.document) {
    validateURITemplate(entry.document, 'document', warnings, context);
  }

  // Validate @context URL
  if (entry['@context']) {
    if (
      typeof entry['@context'] === 'string' &&
      !entry['@context'].includes('distributed-text-services')
    ) {
      warnings.push({
        severity: 'warning',
        field: '@context',
        message: 'Unexpected @context URL (expected DTS context)',
        actualValue: entry['@context'],
      });
    }
  }

  return {
    isValid: errors.length === 0,
    conformanceLevel: determineConformanceLevel(errors, warnings),
    errors,
    warnings,
    info,
    timestamp: new Date().toISOString(),
    endpoint: typeof entry['@id'] === 'string' ? entry['@id'] : undefined,
  };
}

/**
 * Validate Collection response
 */
export function validateCollection(
  data: unknown,
  mode: ValidationMode = 'permissive'
): ValidationResult {
  const context: ValidationContext = {
    strict: mode === 'strict',
    endpoint: 'collection',
    endpointType: 'collection',
  };

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  if (typeof data !== 'object' || data === null) {
    errors.push({
      severity: 'error',
      message: 'Response is not a valid JSON object',
    });
    return {
      isValid: false,
      conformanceLevel: 'invalid',
      errors,
      warnings,
      info,
      timestamp: new Date().toISOString(),
    };
  }

  const collection = data as Partial<Collection | Resource>;

  // Required fields
  validateRequiredField(collection, '@id', 'string', errors, context);
  validateRequiredField(collection, '@type', 'string', errors, context);
  validateRequiredField(collection, 'title', 'string', errors, context);

  // Validate @type
  if (collection['@type']) {
    if (collection['@type'] !== 'Collection' && collection['@type'] !== 'Resource') {
      errors.push({
        severity: 'error',
        field: '@type',
        message: `Invalid @type: Expected "Collection" or "Resource", got "${collection['@type']}"`,
        expectedValue: 'Collection | Resource',
        actualValue: collection['@type'],
      });
    }
  }

  // totalParents and totalChildren should be numbers
  if ('totalParents' in collection && typeof collection.totalParents !== 'number') {
    warnings.push({
      severity: 'warning',
      field: 'totalParents',
      message: 'totalParents should be a number',
      actualValue: collection.totalParents,
    });
  }

  if ('totalChildren' in collection && typeof collection.totalChildren !== 'number') {
    warnings.push({
      severity: 'warning',
      field: 'totalChildren',
      message: 'totalChildren should be a number',
      actualValue: collection.totalChildren,
    });
  }

  // Resource-specific fields
  if (collection['@type'] === 'Resource') {
    validateRequiredField(collection, 'navigation', 'string', errors, context);
    validateRequiredField(collection, 'document', 'string', errors, context);
  }

  // Validate member array if present
  if ('member' in collection && collection.member) {
    if (!Array.isArray(collection.member)) {
      warnings.push({
        severity: 'warning',
        field: 'member',
        message: 'member should be an array',
        actualValue: typeof collection.member,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    conformanceLevel: determineConformanceLevel(errors, warnings),
    errors,
    warnings,
    info,
    timestamp: new Date().toISOString(),
    endpoint: typeof collection['@id'] === 'string' ? collection['@id'] : undefined,
  };
}

/**
 * Validate Navigation response
 */
export function validateNavigation(
  data: unknown,
  mode: ValidationMode = 'permissive'
): ValidationResult {
  const context: ValidationContext = {
    strict: mode === 'strict',
    endpoint: 'navigation',
    endpointType: 'navigation',
  };

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  if (typeof data !== 'object' || data === null) {
    errors.push({
      severity: 'error',
      message: 'Response is not a valid JSON object',
    });
    return {
      isValid: false,
      conformanceLevel: 'invalid',
      errors,
      warnings,
      info,
      timestamp: new Date().toISOString(),
    };
  }

  const navigation = data as Partial<Navigation>;

  // Required fields
  validateRequiredField(navigation, '@id', 'string', errors, context);
  validateRequiredField(navigation, '@type', 'string', errors, context);
  validateRequiredField(navigation, 'resource', 'object', errors, context);
  validateRequiredField(navigation, 'member', 'object', errors, context);

  // Validate @type
  if (navigation['@type'] && navigation['@type'] !== 'Navigation') {
    errors.push({
      severity: 'error',
      field: '@type',
      message: `Invalid @type: Expected "Navigation", got "${navigation['@type']}"`,
      expectedValue: 'Navigation',
      actualValue: navigation['@type'],
    });
  }

  // Validate member is array
  if (navigation.member && !Array.isArray(navigation.member)) {
    errors.push({
      severity: 'error',
      field: 'member',
      message: 'member must be an array',
      actualValue: typeof navigation.member,
    });
  }

  return {
    isValid: errors.length === 0,
    conformanceLevel: determineConformanceLevel(errors, warnings),
    errors,
    warnings,
    info,
    timestamp: new Date().toISOString(),
    endpoint: typeof navigation['@id'] === 'string' ? navigation['@id'] : undefined,
  };
}

/**
 * Helper: Validate required field
 */
function validateRequiredField(
  obj: Record<string, unknown>,
  field: string,
  expectedType: string,
  errors: ValidationIssue[],
  context: ValidationContext
): void {
  if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
    errors.push({
      severity: 'error',
      field,
      message: `Missing required field: ${field}`,
      specReference: `${DTS_SPEC_URL}#${context.endpointType}-endpoint`,
    });
    return;
  }

  // Type checking
  if (expectedType === 'object' && typeof obj[field] !== 'object') {
    errors.push({
      severity: 'error',
      field,
      message: `Field ${field} must be an object`,
      expectedValue: 'object',
      actualValue: typeof obj[field],
    });
  } else if (expectedType === 'string' && typeof obj[field] !== 'string') {
    errors.push({
      severity: 'error',
      field,
      message: `Field ${field} must be a string`,
      expectedValue: 'string',
      actualValue: typeof obj[field],
    });
  }
}

/**
 * Helper: Validate URI template format
 */
function validateURITemplate(
  template: string,
  field: string,
  warnings: ValidationIssue[],
  context: ValidationContext
): void {
  // Check if template contains parameter placeholders
  if (!template.includes('{')) {
    if (context.strict) {
      warnings.push({
        severity: 'warning',
        field,
        message: `${field} endpoint may not be a valid URI template (missing parameter placeholders)`,
        actualValue: template,
      });
    }
  }

  // Basic URI validation
  try {
    new URL(template.split('{')[0]); // Validate base URL part
  } catch {
    warnings.push({
      severity: 'warning',
      field,
      message: `${field} endpoint may not be a valid URL`,
      actualValue: template,
    });
  }
}

/**
 * Create a validation summary message
 */
export function getValidationSummary(result: ValidationResult): string {
  const { errors, warnings, info } = result;

  if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
    return 'Fully conformant with DTS specification';
  }

  const parts: string[] = [];

  if (errors.length > 0) {
    parts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`);
  }

  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
  }

  if (info.length > 0) {
    parts.push(`${info.length} info message${info.length !== 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}
