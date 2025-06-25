// react.ts - React integration for Rubric validation

import * as React from 'react';
import { useRef, useEffect, forwardRef, ComponentType } from 'react';
import type { RubricSpec, RubricComponent } from './types';
import { validate, logValidation } from './validator';

/**
 * Higher-order component that adds Rubric validation
 */
export function withRubric<P extends object = {}>(
  spec: RubricSpec
): (Component: ComponentType<P>) => RubricComponent<P> {
  return function wrapComponent(Component: ComponentType<P>): RubricComponent<P> {
    const WrappedComponent = forwardRef<HTMLElement, P>((props, ref) => {
      const innerRef = useRef<HTMLElement>(null);
      const elementRef = (ref as any) || innerRef;
      const validatedRef = useRef(false);

      useEffect(() => {
        // Only validate in development
        if (process.env.NODE_ENV !== 'development') return;
        
        // Skip if no element or already validated
        if (!elementRef.current || validatedRef.current) return;

        // Mark as validated to prevent duplicate runs
        validatedRef.current = true;

        // Delay validation to ensure styles are applied
        const timeoutId = setTimeout(() => {
          if (!elementRef.current) return;

          try {
            const report = validate(elementRef.current, spec);
            
            // Only log if there are issues or in verbose mode
            const hasIssues = report.failed.length > 0 || report.warnings.length > 0;
            const isVerbose = typeof window !== 'undefined' && 
              (window as any).__RUBRIC_VERBOSE__ === true;
            
            if (hasIssues || isVerbose) {
              logValidation(report, isVerbose);
            }

            // Store report for debugging
            if (typeof window !== 'undefined') {
              (window as any).__RUBRIC_LAST_REPORT__ = report;
            }
          } catch (error) {
            console.error(`Rubric validation error for ${spec.metadata.name}:`, error);
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }, []);

      // Render component with ref
      // Fix: Use React.createElement instead of JSX to avoid type issues
      return React.createElement(Component, { ...props, ref: elementRef } as any);
    });

    // Set display name for debugging
    WrappedComponent.displayName = `Rubric(${Component.displayName || Component.name || 'Component'})`;
    
    // Attach spec for introspection
    (WrappedComponent as any).rubricSpec = spec;

    return WrappedComponent as any as RubricComponent<P>;
  };
}

/**
 * Hook for manual validation
 */
export function useRubricValidation(spec: RubricSpec) {
  const elementRef = useRef<HTMLElement>(null);
  const [validationState, setValidationState] = React.useState<{
    validated: boolean;
    passed: boolean;
    report?: ReturnType<typeof validate>;
  }>({
    validated: false,
    passed: true
  });

  const runValidation = React.useCallback(() => {
    if (!elementRef.current) return;

    try {
      const report = validate(elementRef.current, spec);
      const passed = report.failed.length === 0;
      
      setValidationState({
        validated: true,
        passed,
        report
      });

      if (process.env.NODE_ENV === 'development') {
        logValidation(report, false);
      }

      return report;
    } catch (error) {
      console.error('Rubric validation error:', error);
      setValidationState({
        validated: true,
        passed: false
      });
    }
  }, [spec]);

  // Auto-validate on mount in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && elementRef.current) {
      const timeoutId = setTimeout(runValidation, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [runValidation]);

  return {
    ref: elementRef,
    validate: runValidation,
    ...validationState
  };
}

/**
 * Validation reporter component for development
 */
export interface RubricReporterProps {
  spec: RubricSpec;
  targetRef: React.RefObject<HTMLElement>;
  verbose?: boolean;
  autoValidate?: boolean;
}

export function RubricReporter({ 
  spec, 
  targetRef, 
  verbose = false,
  autoValidate = true 
}: RubricReporterProps) {
  const [report, setReport] = React.useState<ReturnType<typeof validate> | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const runValidation = React.useCallback(() => {
    if (!targetRef.current) return;
    
    const newReport = validate(targetRef.current, spec);
    setReport(newReport);
    
    if (verbose) {
      logValidation(newReport, true);
    }
  }, [spec, targetRef, verbose]);

  useEffect(() => {
    if (autoValidate && targetRef.current) {
      const timeoutId = setTimeout(runValidation, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [autoValidate, runValidation]);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') return null;

  if (!report) return null;

  const hasIssues = report.failed.length > 0 || report.warnings.length > 0;
  const bgColor = hasIssues ? '#fee' : '#efe';
  const borderColor = hasIssues ? '#c00' : '#0c0';

  return React.createElement('div', {
    style: {
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: bgColor,
      border: `2px solid ${borderColor}`,
      borderRadius: 8,
      padding: '10px 15px',
      fontSize: 14,
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: 400,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  },
    React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer'
      },
      onClick: () => setIsOpen(!isOpen)
    },
      React.createElement('strong', {}, `Rubric: ${spec.metadata.name}`),
      React.createElement('span', {}, isOpen ? '▼' : '▶')
    ),
    
    isOpen && React.createElement('div', { style: { marginTop: 10 } },
      React.createElement('div', {}, `✅ Passed: ${report.passed.length}`),
      React.createElement('div', {}, `❌ Failed: ${report.failed.length}`),
      React.createElement('div', {}, `⚠️  Warnings: ${report.warnings.length}`),
      React.createElement('div', {}, `📊 Coverage: ${report.coverage.percentage}%`),
      
      report.failed.length > 0 && React.createElement('div', { style: { marginTop: 10 } },
        React.createElement('strong', {}, 'Failed:'),
        React.createElement('ul', { style: { margin: '5px 0', paddingLeft: 20 } },
          report.failed.map((check, i) => 
            React.createElement('li', { key: i, style: { color: '#c00' } }, check.rule)
          )
        )
      ),
      
      React.createElement('button', {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          runValidation();
        },
        style: {
          marginTop: 10,
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12
        }
      }, 'Re-validate')
    )
  );
}

/**
 * Enable verbose logging globally
 */
export function enableVerboseLogging() {
  if (typeof window !== 'undefined') {
    (window as any).__RUBRIC_VERBOSE__ = true;
  }
}

/**
 * Get last validation report
 */
export function getLastReport() {
  if (typeof window !== 'undefined') {
    return (window as any).__RUBRIC_LAST_REPORT__;
  }
  return null;
}