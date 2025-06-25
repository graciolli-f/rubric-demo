// packages/validate/src/core/index.ts - Core module exports

export { parseRubric } from './parser';
export { validate, validationPatterns, logValidation } from './validator';
export { 
  withRubric, 
  useRubricValidation, 
  RubricReporter,
  enableVerboseLogging,
  getLastReport 
} from './react';

// Type exports
export type {
  // Core types
  RubricSpec,
  ValidationReport,
  ValidationResult,
  ValidationRules,
  ValidatorFunction,
  
  // Rule types
  ContrastRule,
  MotionRule,
  SizeRule,
  PerformanceRule,
  
  // Structure types
  StyleGuidelines,
  PropDefinition,
  Requirement,
  StyleSuggestion,
  
  // React types
  RubricComponent,
  RubricReporterProps
} from './types';