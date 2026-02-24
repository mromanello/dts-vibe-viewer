/**
 * Validation Type Definitions
 * For DTS specification conformance checking
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ConformanceLevel = 'full' | 'partial' | 'minimal' | 'invalid';

export interface ValidationIssue {
  severity: ValidationSeverity;
  field?: string;
  message: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  specReference?: string; // Link to DTS spec section
}

export interface ValidationResult {
  isValid: boolean;
  conformanceLevel: ConformanceLevel;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  timestamp: string;
  endpoint?: string;
}

export interface ValidationContext {
  strict: boolean; // Strict mode vs permissive mode
  endpoint: string;
  endpointType: 'entry' | 'collection' | 'navigation' | 'document';
}

export interface ValidatorFunction<T> {
  (data: T, context: ValidationContext): ValidationIssue[];
}

/**
 * Validation mode
 */
export type ValidationMode = 'strict' | 'permissive';

/**
 * Validation statistics
 */
export interface ValidationStats {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Get statistics from validation result
 */
export function getValidationStats(result: ValidationResult): ValidationStats {
  return {
    totalIssues: result.errors.length + result.warnings.length + result.info.length,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    infoCount: result.info.length,
  };
}

/**
 * Determine conformance level from validation issues
 */
export function determineConformanceLevel(
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): ConformanceLevel {
  if (errors.length > 0) {
    // Critical errors mean invalid
    const hasCriticalError = errors.some(
      (e) => e.field?.includes('@type') || e.field?.includes('@context')
    );
    if (hasCriticalError) return 'invalid';

    // Non-critical errors mean minimal conformance
    return 'minimal';
  }

  if (warnings.length > 5) {
    return 'partial';
  }

  if (warnings.length > 0) {
    return 'partial';
  }

  return 'full';
}
