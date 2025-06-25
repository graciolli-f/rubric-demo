'use client';

import { useState } from 'react';
interface ValidationReportType {
  component: string;
  timestamp: Date;
  passed: Array<{
    rule: string;
    passed: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
    details?: any;
  }>;
  failed: Array<{
    rule: string;
    passed: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
    details?: any;
  }>;
  warnings: Array<{
    rule: string;
    passed: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
    details?: any;
  }>;
  manual: string[];
  coverage: {
    total: number;
    automated: number;
    percentage: number;
  };
  suggestions?: Array<{
    type: 'tokens' | 'naming' | 'pattern';
    message: string;
    example?: string;
  }>;
}

interface Props {
  report: ValidationReportType;
}

export default function ValidationReport({ report }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>('failed');
  
  const getCategoryIcon = (rule: string): string => {
    if (['contrast', 'keyboard', 'focusVisible', 'touchTarget', 'motion', 'screenReader'].includes(rule)) {
      return '♿';
    }
    if (['bundleSize', 'renderTime', 'imageOptimization'].includes(rule)) {
      return '⚡';
    }
    if (['xss', 'clickjacking', 'externalLinks'].includes(rule)) {
      return '🔒';
    }
    return '✓';
  };

  const getCategoryColor = (rule: string): string => {
    if (['contrast', 'keyboard', 'focusVisible', 'touchTarget', 'motion', 'screenReader'].includes(rule)) {
      return 'text-blue-600 bg-blue-50';
    }
    if (['bundleSize', 'renderTime', 'imageOptimization'].includes(rule)) {
      return 'text-yellow-600 bg-yellow-50';
    }
    if (['xss', 'clickjacking', 'externalLinks'].includes(rule)) {
      return 'text-red-600 bg-red-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {report.failed.length}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {report.warnings.length}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Warnings</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {report.passed.length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Passed</div>
        </div>
      </div>

      {/* Failed Checks */}
      {report.failed.length > 0 && (
        <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('failed')}
            className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-left flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <span className="font-semibold text-red-700 dark:text-red-300">
              Failed Checks ({report.failed.length})
            </span>
            <span className="text-red-600">
              {expandedSection === 'failed' ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSection === 'failed' && (
            <div className="p-4 space-y-3">
              {report.failed.map((check, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getCategoryColor(check.rule)}`}>
                    {getCategoryIcon(check.rule)}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {check.rule}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {check.message}
                    </div>
                    {check.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('warnings')}
            className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 text-left flex items-center justify-between hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <span className="font-semibold text-yellow-700 dark:text-yellow-300">
              Warnings ({report.warnings.length})
            </span>
            <span className="text-yellow-600">
              {expandedSection === 'warnings' ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSection === 'warnings' && (
            <div className="p-4 space-y-3">
              {report.warnings.map((check, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-yellow-600">⚠️</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {check.rule}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {check.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Passed Checks */}
      {report.passed.length > 0 && (
        <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('passed')}
            className="w-full px-4 py-3 bg-green-50 dark:bg-green-900/20 text-left flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <span className="font-semibold text-green-700 dark:text-green-300">
              Passed Checks ({report.passed.length})
            </span>
            <span className="text-green-600">
              {expandedSection === 'passed' ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSection === 'passed' && (
            <div className="p-4 space-y-3">
              {report.passed.map((check, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getCategoryColor(check.rule)}`}>
                    {getCategoryIcon(check.rule)}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {check.rule}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {check.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coverage */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Automation Coverage
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {report.coverage.percentage}%
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${report.coverage.percentage}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {report.coverage.automated} of {report.coverage.total} checks automated
        </div>
      </div>

      {/* Manual Checks */}
      {report.manual.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Manual Checks Required
          </h4>
          <ul className="space-y-1">
            {report.manual.map((check, index) => (
              <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <span>•</span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}