/**
 * DTS Entry Endpoint Client
 * Handles discovery of DTS API endpoints
 */

import type { EntryPoint, EndpointTemplates } from '@/types/dts';
import { fetchJSON } from '@/services/utils/http';
import { isEntryPoint } from '@/types/dts';

/**
 * Fetch Entry Endpoint and extract URI templates
 */
export async function fetchEntryPoint(url: string): Promise<EntryPoint> {
  // Ensure URL doesn't have trailing slash for consistency
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

  const data = await fetchJSON<EntryPoint>(cleanUrl);

  // Validate response structure
  if (!isEntryPoint(data)) {
    throw new Error(
      'Invalid Entry Endpoint response: Missing required fields or incorrect @type'
    );
  }

  // Validate DTS version
  if (!data.dtsVersion) {
    console.warn('Entry Endpoint missing dtsVersion field');
  }

  // Validate URI templates
  if (!data.collection || !data.navigation || !data.document) {
    throw new Error(
      'Invalid Entry Endpoint: Missing required endpoint URI templates'
    );
  }

  return data;
}

/**
 * Extract endpoint templates from Entry Point response
 */
export function extractEndpointTemplates(
  entryPoint: EntryPoint
): EndpointTemplates {
  return {
    entry: entryPoint['@id'],
    collection: entryPoint.collection,
    navigation: entryPoint.navigation,
    document: entryPoint.document,
  };
}

/**
 * Validate Entry Point response against DTS specification
 */
export interface EntryPointValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEntryPoint(
  data: unknown
): EntryPointValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    errors.push('Response is not a valid JSON object');
    return { isValid: false, errors, warnings };
  }

  const entry = data as Partial<EntryPoint>;

  // Required fields
  if (!entry['@context']) {
    errors.push('Missing required field: @context');
  }

  if (!entry['@id']) {
    errors.push('Missing required field: @id');
  }

  if (entry['@type'] !== 'EntryPoint') {
    errors.push(
      `Invalid @type: Expected "EntryPoint", got "${entry['@type']}"`
    );
  }

  if (!entry.dtsVersion) {
    warnings.push('Missing recommended field: dtsVersion');
  } else if (!entry.dtsVersion.startsWith('1.0')) {
    warnings.push(
      `DTS version ${entry.dtsVersion} may not be fully compatible with this viewer (expects 1.0)`
    );
  }

  if (!entry.collection) {
    errors.push('Missing required field: collection (URI template)');
  }

  if (!entry.navigation) {
    errors.push('Missing required field: navigation (URI template)');
  }

  if (!entry.document) {
    errors.push('Missing required field: document (URI template)');
  }

  // Validate URI templates format (basic check)
  if (entry.collection && !entry.collection.includes('{')) {
    warnings.push(
      'Collection endpoint may not be a valid URI template (missing parameters)'
    );
  }

  if (entry.navigation && !entry.navigation.includes('{')) {
    warnings.push(
      'Navigation endpoint may not be a valid URI template (missing parameters)'
    );
  }

  if (entry.document && !entry.document.includes('{')) {
    warnings.push(
      'Document endpoint may not be a valid URI template (missing parameters)'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
