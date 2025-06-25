 // types.ts - Core type definitions for Rubric

// Main specification structure parsed from .rux files
export interface RubricSpec {
    metadata: {
      name: string;
      description?: string;
      category?: string;
    };
    structure?: Record<string, any>;
    validation?: ValidationRules;
    props?: Record<string, PropDefinition>;
    style?: StyleGuidelines;
    requirements: Requirement[];
    recommendations: string[];
  }
  
  // Validation rules for quality checks
  export interface ValidationRules {
    // Accessibility
    contrast?: ContrastRule | number;
    keyboard?: boolean | 'required';
    focusVisible?: boolean | 'required';
    touchTarget?: SizeRule | number;
    motion?: MotionRule | boolean;
    screenReader?: boolean | 'required';
    
    // Performance
    renderTime?: PerformanceRule | number;
    bundleSize?: SizeRule | number;
    
    // Custom rules
    [key: string]: any;
  }
  
  // Individual rule types
  export interface ContrastRule {
    ratio: number;
    largeText?: number;
  }
  
  export interface MotionRule {
    respectsPreference: boolean;
    maxDuration?: number;
  }
  
  export interface SizeRule {
    min?: number | string;
    max?: number | string;
  }
  
  export interface PerformanceRule {
    maxMs: number;
    budget?: string;
  }
  
  // Style guidelines (natural language)
  export interface StyleGuidelines {
    guidelines?: string[];
    tokens?: {
      colors?: string[];
      spacing?: string[];
      typography?: string[];
    };
    naming?: {
      pattern: string;
      example?: string;
    };
  }
  
  // Prop definitions from @Props block
  export interface PropDefinition {
    type: string;
    required?: boolean;
    default?: any;
    enum?: string[];
  }
  
  // Requirements with optional validation
  export interface Requirement {
    text: string;
    validation?: string;
    category?: 'accessibility' | 'performance' | 'compatibility' | 'quality';
    severity?: 'error' | 'warning' | 'info';
  }
  
  // Validation results
  export interface ValidationResult {
    rule: string;
    passed: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
    details?: any;
  }
  
  export interface ValidationReport {
    component: string;
    timestamp: Date;
    passed: ValidationResult[];
    failed: ValidationResult[];
    warnings: ValidationResult[];
    manual: string[];
    coverage: {
      total: number;
      automated: number;
      percentage: number;
    };
    suggestions?: StyleSuggestion[];
  }
  
  export interface StyleSuggestion {
    type: 'tokens' | 'naming' | 'pattern';
    message: string;
    example?: string;
  }
  
  // Validator function type
  export type ValidatorFunction = (
    element: HTMLElement,
    rule: any
  ) => {
    passed: boolean;
    message: string;
    details?: any;
  };
  
  // Component type for framework integration
  export interface RubricComponent<P = any> {
    (props: P): any;
    displayName?: string;
    rubricSpec?: RubricSpec;
  }
  
  // React Reporter component props
  export interface RubricReporterProps {
    spec: RubricSpec;
    targetRef: React.RefObject<HTMLElement>;
    verbose?: boolean;
    autoValidate?: boolean;
  }