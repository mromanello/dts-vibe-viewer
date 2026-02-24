/**
 * Validation Report Component
 * Displays detailed validation results with errors, warnings, and info messages
 */

import { useState } from 'react';
import type { ValidationResult, ValidationIssue } from '@/types/validation';
import { getValidationStats } from '@/types/validation';
import { getValidationSummary } from '@/services/dts/validator';
import ConformanceIndicator from './ConformanceIndicator';

interface ValidationReportProps {
  result: ValidationResult;
  onClose?: () => void;
}

interface IssueGroupProps {
  title: string;
  issues: ValidationIssue[];
  icon: string;
  iconColor: string;
  defaultExpanded?: boolean;
}

function IssueGroup({ title, issues, icon, iconColor, defaultExpanded = false }: IssueGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className={`text-lg ${iconColor}`}>{icon}</span>
          <h3 className="font-medium text-gray-900">
            {title} ({issues.length})
          </h3>
        </div>
        <svg
          className={`h-5 w-5 transform text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <ul className="space-y-3">
            {issues.map((issue, index) => (
              <li key={index} className="rounded-lg bg-white p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 text-sm ${iconColor}`}>•</span>
                  <div className="flex-1">
                    {issue.field && (
                      <span className="font-mono text-xs font-medium text-gray-700">
                        {issue.field}:
                      </span>
                    )}{' '}
                    <span className="text-sm text-gray-900">{issue.message}</span>
                    {issue.actualValue !== undefined && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-600">Actual value:</span>{' '}
                        <code className="rounded bg-gray-100 px-1 text-xs text-gray-800">
                          {String(issue.actualValue)}
                        </code>
                      </div>
                    )}
                    {issue.expectedValue !== undefined && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-600">Expected:</span>{' '}
                        <code className="rounded bg-gray-100 px-1 text-xs text-gray-800">
                          {String(issue.expectedValue)}
                        </code>
                      </div>
                    )}
                    {issue.specReference && (
                      <div className="mt-2">
                        <a
                          href={issue.specReference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          View specification →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ValidationReport({ result, onClose }: ValidationReportProps) {
  const stats = getValidationStats(result);
  const summary = getValidationSummary(result);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Validation Report</h2>
            {result.endpoint && (
              <p className="mt-1 font-mono text-xs text-gray-600">{result.endpoint}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-gray-100"
              aria-label="Close validation report"
            >
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <ConformanceIndicator level={result.conformanceLevel} />
          <div className="flex-1">
            <p className="text-sm text-gray-700">{summary}</p>
          </div>
        </div>

        {stats.totalIssues > 0 && (
          <div className="mt-4 flex gap-4 text-sm">
            {stats.errorCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span className="text-gray-700">
                  {stats.errorCount} error{stats.errorCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {stats.warningCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                <span className="text-gray-700">
                  {stats.warningCount} warning{stats.warningCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {stats.infoCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-700">
                  {stats.infoCount} info message{stats.infoCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {stats.totalIssues === 0 ? (
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-2xl text-green-600">✓</div>
            <p className="mt-2 text-sm font-medium text-green-800">
              No conformance issues detected
            </p>
            <p className="mt-1 text-xs text-green-700">
              This endpoint fully conforms to the DTS specification
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <IssueGroup
              title="Errors"
              issues={result.errors}
              icon="✕"
              iconColor="text-red-600"
              defaultExpanded={result.errors.length > 0}
            />
            <IssueGroup
              title="Warnings"
              issues={result.warnings}
              icon="⚠"
              iconColor="text-yellow-600"
              defaultExpanded={result.errors.length === 0 && result.warnings.length > 0}
            />
            <IssueGroup
              title="Information"
              issues={result.info}
              icon="ℹ"
              iconColor="text-blue-600"
            />
          </div>
        )}

        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            Validated at {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
