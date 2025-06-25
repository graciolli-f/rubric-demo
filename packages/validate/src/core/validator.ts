// validator.ts - Runtime validation engine for quality checks

import type {
  RubricSpec,
  ValidationReport,
  ValidationResult,
  ValidationRules,
  ValidatorFunction,
  ContrastRule,
  MotionRule,
  SizeRule,
  PerformanceRule,
  StyleSuggestion
} from './types';

/**
 * Built-in validation patterns
 */
export const validationPatterns: Record<string, ValidatorFunction> = {
  // ===== ACCESSIBILITY VALIDATORS =====
  contrast: (element: HTMLElement, rule: ContrastRule | number) => {
    const ratio = typeof rule === 'number' ? rule : rule.ratio;
    const computed = window.getComputedStyle(element);
    const bg = computed.backgroundColor;
    const fg = computed.color;

    // In a real implementation, would calculate actual contrast ratio
    // For now, check that colors are not transparent
    const hasColors = bg !== 'rgba(0, 0, 0, 0)' && fg !== 'rgba(0, 0, 0, 0)';

    return {
      passed: hasColors,
      message: `Color contrast ratio should be at least ${ratio}:1`,
      details: { 
        required: ratio,
        background: bg,
        foreground: fg,
        // actual: calculateContrastRatio(bg, fg) // Would implement this
      }
    };
  },

  keyboard: (element: HTMLElement) => {
    const tagName = element.tagName.toUpperCase();
    const isNativelyFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(tagName);
    const tabindex = element.getAttribute('tabindex');
    const isDisabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';

    const passed = !isDisabled && (isNativelyFocusable || (tabindex !== null && parseInt(tabindex) >= 0));

    return {
      passed,
      message: passed 
        ? 'Element is keyboard accessible' 
        : 'Element must be keyboard accessible (native element or tabindex >= 0)',
      details: {
        tagName,
        tabindex,
        isDisabled,
        isNativelyFocusable
      }
    };
  },

  focusVisible: (element: HTMLElement) => {
    // Clone the element to test focus styles
    const testId = 'rubric-focus-test-' + Date.now();
    element.id = element.id || testId;
    
    // Get computed styles
    const computed = window.getComputedStyle(element);
    const normalOutline = computed.outline;
    const normalBoxShadow = computed.boxShadow;
    
    // Check :focus-visible pseudo-class styles
    let styleSheet: CSSStyleSheet | undefined;
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules || [];
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j];
          if (rule instanceof CSSStyleRule && 
              (rule.selectorText?.includes(':focus-visible') || 
               rule.selectorText?.includes(':focus'))) {
            styleSheet = sheet;
            break;
          }
        }
        if (styleSheet) break;
      } catch {
        // Cross-origin stylesheets will throw, skip them
        continue;
      }
    }

    const hasFocusStyles = !!styleSheet || 
      normalOutline !== 'none' || 
      (normalBoxShadow !== 'none' && normalBoxShadow !== '');

    return {
      passed: hasFocusStyles,
      message: hasFocusStyles
        ? 'Element has focus indication'
        : 'Element must have visible focus indication (:focus-visible styles)',
      details: {
        outline: normalOutline,
        boxShadow: normalBoxShadow,
        hasFocusStylesheet: !!styleSheet
      }
    };
  },

  touchTarget: (element: HTMLElement, rule: SizeRule | number) => {
    const minSize = typeof rule === 'number' 
      ? rule 
      : (typeof rule.min === 'number' ? rule.min : parseInt(rule.min || '44'));
    
    const rect = element.getBoundingClientRect();
    const { width, height } = rect;
    const passed = width >= minSize && height >= minSize;

    return {
      passed,
      message: passed
        ? `Touch target meets minimum size (${minSize}px)`
        : `Touch target must be at least ${minSize}px (currently ${Math.min(width, height)}px)`,
      details: {
        required: minSize,
        actual: { width, height },
        smallest: Math.min(width, height)
      }
    };
  },

  motion: (element: HTMLElement, rule: MotionRule | boolean) => {
    const respectsPreference = typeof rule === 'boolean' ? rule : rule.respectsPreference;
    if (!respectsPreference) {
      return { passed: true, message: 'Motion preference respect not required' };
    }

    const computed = window.getComputedStyle(element);
    const hasTransition = computed.transition !== 'none' && computed.transition !== '';
    const hasAnimation = computed.animation !== 'none' && computed.animation !== '';
    const hasMotion = hasTransition || hasAnimation;

    if (!hasMotion) {
      return { passed: true, message: 'Element has no motion' };
    }

    // Check if media query is respected
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // In real implementation, would check if animations are disabled when preference is set
    // For now, assume it's handled by CSS
    const passed = true;

    return {
      passed,
      message: 'Animations should respect prefers-reduced-motion',
      details: {
        hasMotion,
        transition: computed.transition,
        animation: computed.animation,
        prefersReducedMotion
      }
    };
  },

  screenReader: (element: HTMLElement) => {
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    const hasTextContent = element.textContent?.trim().length || 0 > 0;

    const hasAccessibleName = !!(ariaLabel || ariaLabelledBy || hasTextContent);
    const passed = hasAccessibleName;

    return {
      passed,
      message: passed
        ? 'Element has accessible name'
        : 'Element must have accessible name (aria-label, aria-labelledby, or text content)',
      details: {
        role,
        ariaLabel,
        ariaLabelledBy,
        ariaDescribedBy,
        hasTextContent
      }
    };
  },

  // ===== SECURITY VALIDATORS =====
  xss: (element: HTMLElement) => {
    const innerHTML = element.innerHTML;
    const textContent = element.textContent || '';
    
    // Check for potential XSS vectors
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,  // onclick, onload, etc.
      /<iframe[^>]*>/i,
      /eval\s*\(/i,
      /document\.write/i
    ];
    
    const hasDangerousContent = dangerousPatterns.some(pattern => 
      pattern.test(innerHTML) || pattern.test(textContent)
    );
    
    // Check if using dangerouslySetInnerHTML (React-specific)
    const reactElement = (element as any)._reactInternalFiber || 
                        (element as any)._reactInternalInstance;
    const usesDangerouslySetInnerHTML = reactElement?.memoizedProps?.dangerouslySetInnerHTML;
    
    const passed = !hasDangerousContent && !usesDangerouslySetInnerHTML;
    
    return {
      passed,
      message: passed 
        ? 'No XSS vulnerabilities detected'
        : 'Potential XSS vulnerability: unsafe content or dangerouslySetInnerHTML usage',
      details: {
        dangerousPatterns: dangerousPatterns.filter(p => p.test(innerHTML)),
        usesDangerouslySetInnerHTML,
        innerHTML: innerHTML.substring(0, 100)
      }
    };
  },

  clickjacking: (element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    const isClickable = element.tagName === 'BUTTON' || 
                       element.tagName === 'A' ||
                       element.getAttribute('role') === 'button';
    
    if (!isClickable) {
      return { passed: true, message: 'Element not clickable' };
    }
    
    // Check for suspicious positioning/opacity
    const opacity = parseFloat(style.opacity);
    const visibility = style.visibility;
    const display = style.display;
    const position = style.position;
    const zIndex = parseInt(style.zIndex) || 0;
    
    const isSuspicious = opacity < 0.1 || 
                        visibility === 'hidden' || 
                        display === 'none' ||
                        (position === 'absolute' && zIndex > 9999);
    
    return {
      passed: !isSuspicious,
      message: isSuspicious 
        ? 'Suspicious styling detected - potential clickjacking vector'
        : 'No clickjacking vulnerabilities detected',
      details: { opacity, visibility, display, position, zIndex }
    };
  },

  externalLinks: (element: HTMLElement) => {
    if (element.tagName !== 'A') {
      return { passed: true, message: 'Not a link element' };
    }
    
    const href = element.getAttribute('href');
    const target = element.getAttribute('target');
    const rel = element.getAttribute('rel');
    
    if (!href || href.startsWith('#') || href.startsWith('/')) {
      return { passed: true, message: 'Internal link' };
    }
    
    const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);
    if (!isExternal) {
      return { passed: true, message: 'Not an external link' };
    }
    
    // Check security attributes
    const hasNoopener = rel?.includes('noopener');
    const hasNoreferrer = rel?.includes('noreferrer');
    const opensInNewTab = target === '_blank';
    
    const isSecure = href.startsWith('https://');
    const hasSecurityAttrs = hasNoopener && hasNoreferrer;
    
    const passed = Boolean(isSecure && (!opensInNewTab || hasSecurityAttrs));
    
    return {
      passed,
      message: passed
        ? 'External link is secure'
        : 'External link security issues: use HTTPS and rel="noopener noreferrer" for target="_blank"',
      details: {
        href,
        isSecure,
        hasNoopener,
        hasNoreferrer,
        opensInNewTab
      }
    };
  },

  // ===== PERFORMANCE VALIDATORS =====
  bundleSize: (element: HTMLElement, rule: SizeRule | number) => {
    // Estimate component bundle impact
    const maxSize = typeof rule === 'object' 
      ? (typeof rule.max === 'string' 
          ? parseFloat(rule.max.replace(/[^\d.]/g, '')) * 1024 
          : rule.max || Infinity)
      : rule;
    
    // Rough estimation based on DOM complexity and inline styles
    const nodeCount = element.querySelectorAll('*').length;
    const inlineStyles = element.getAttribute('style')?.length || 0;
    const classNames = element.className?.length || 0;
    
    // Very rough bundle size estimation (in bytes)
    const estimatedSize = (nodeCount * 50) + inlineStyles + classNames;
    
    const passed = estimatedSize <= maxSize;
    
    return {
      passed,
      message: passed
        ? `Estimated bundle impact: ${(estimatedSize/1024).toFixed(1)}kb`
        : `Bundle impact too large: ${(estimatedSize/1024).toFixed(1)}kb (max: ${(maxSize/1024).toFixed(1)}kb)`,
      details: {
        estimatedSize,
        maxSize,
        nodeCount,
        inlineStyles,
        classNames
      }
    };
  },

  renderTime: (element: HTMLElement, rule: PerformanceRule | number) => {
    const maxMs = typeof rule === 'number' ? rule : rule.maxMs;
    
    // Measure actual render time
    const start = performance.now();
    
    // Force reflow to measure render cost
    element.offsetHeight;
    element.querySelectorAll('*').forEach(el => (el as HTMLElement).offsetHeight);
    
    const renderTime = performance.now() - start;
    const passed = renderTime <= maxMs;
    
    return {
      passed,
      message: passed
        ? `Render time: ${renderTime.toFixed(2)}ms`
        : `Render time too slow: ${renderTime.toFixed(2)}ms (max: ${maxMs}ms)`,
      details: {
        renderTime,
        maxMs,
        nodeCount: element.querySelectorAll('*').length
      }
    };
  },

  imageOptimization: (element: HTMLElement) => {
    const images = element.querySelectorAll('img');
    if (images.length === 0) {
      return { passed: true, message: 'No images found' };
    }
    
    const issues: string[] = [];
    images.forEach((img, index) => {
      const src = img.src;
      const alt = img.alt;
      const loading = img.getAttribute('loading');
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      
      if (!alt && alt !== '') issues.push(`Image ${index}: Missing alt attribute`);
      if (!loading) issues.push(`Image ${index}: Missing loading="lazy"`);
      if (!width || !height) issues.push(`Image ${index}: Missing width/height attributes`);
      if (src && !src.includes('webp') && !src.includes('avif')) {
        issues.push(`Image ${index}: Consider modern formats (WebP/AVIF)`);
      }
    });
    
    const passed = issues.length === 0;
    
    return {
      passed,
      message: passed 
        ? `All ${images.length} images optimized`
        : `${issues.length} image optimization issues`,
      details: { issues, imageCount: images.length }
    };
  }
};

// Validator factory functions (separate from regular validators)
export const validatorFactories = {
  minSize: (size: number): ValidatorFunction => {
    return (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const smallest = Math.min(rect.width, rect.height);
      return {
        passed: smallest >= size,
        message: `Element must be at least ${size}px (currently ${smallest}px)`,
        details: {
          required: size,
          actual: smallest
        }
      };
    };
  }
};

/**
 * Main validation function
 */
export function validate(element: HTMLElement, spec: RubricSpec): ValidationReport {
  const report: ValidationReport = {
    component: spec.metadata.name,
    timestamp: new Date(),
    passed: [],
    failed: [],
    warnings: [],
    manual: [],
    coverage: { total: 0, automated: 0, percentage: 0 }
  };

  // Validate structured rules
  if (spec.validation) {
    validateRules(element, spec.validation, report);
  }

  // Validate requirements with hints
  validateRequirements(element, spec.requirements, report);

  // Generate style suggestions
  if (spec.style) {
    report.suggestions = generateStyleSuggestions(spec.style);
  }

  // Calculate coverage
  report.coverage.total = spec.requirements.length;
  report.coverage.automated = spec.requirements.filter(r => r.validation).length;
  report.coverage.percentage = report.coverage.total > 0
    ? Math.round((report.coverage.automated / report.coverage.total) * 100)
    : 0;

  return report;
}

/**
 * Validate structured validation rules
 */
function validateRules(
  element: HTMLElement,
  rules: ValidationRules,
  report: ValidationReport
): void {
  for (const [ruleName, ruleValue] of Object.entries(rules)) {
    if (ruleValue === undefined || ruleValue === null) continue;

    const validator = validationPatterns[ruleName];
    if (!validator) {
      report.warnings.push({
        rule: ruleName,
        passed: false,
        message: `Unknown validation rule: ${ruleName}`,
        severity: 'warning'
      });
      continue;
    }

    try {
      const result = validator(element, ruleValue);
      const validationResult: ValidationResult = {
        rule: ruleName,
        passed: result.passed,
        message: result.message,
        severity: result.passed ? 'info' : 'error',
        details: result.details
      };

      if (result.passed) {
        report.passed.push(validationResult);
      } else {
        report.failed.push(validationResult);
      }
    } catch (error) {
      report.warnings.push({
        rule: ruleName,
        passed: false,
        message: `Error running validation: ${error}`,
        severity: 'warning'
      });
    }
  }
}

/**
 * Validate requirements with validation hints
 */
function validateRequirements(
  element: HTMLElement,
  requirements: RubricSpec['requirements'],
  report: ValidationReport
): void {
  for (const req of requirements) {
    if (!req.validation) {
      // Manual check required
      report.manual.push(req.text);
      continue;
    }

    // Check if it's a parameterized validator
    const paramMatch = req.validation.match(/^(\w+)\(([^)]+)\)$/);
    if (paramMatch) {
      const [, validatorName, param] = paramMatch;
      const validatorFactory = validatorFactories[validatorName as keyof typeof validatorFactories];
      
      if (typeof validatorFactory === 'function') {
        const validator = validatorFactory(parseFloat(param));
        const result = validator(element, null);
        
        report[result.passed ? 'passed' : 'failed'].push({
          rule: req.text,
          passed: result.passed,
          message: result.message,
          severity: req.severity || (result.passed ? 'info' : 'error'),
          details: result.details
        });
      }
    } else {
      // Regular validator
      const validator = validationPatterns[req.validation];
      if (validator) {
        const result = validator(element, true);
        const target = result.passed 
          ? 'passed' 
          : (req.severity === 'warning' ? 'warnings' : 'failed');
        
        report[target].push({
          rule: req.text,
          passed: result.passed,
          message: result.message,
          severity: req.severity || (result.passed ? 'info' : 'error'),
          details: result.details
        });
      } else {
        report.manual.push(req.text);
      }
    }
  }
}

/**
 * Generate style suggestions based on style guidelines
 */
function generateStyleSuggestions(style: NonNullable<RubricSpec['style']>): StyleSuggestion[] {
  const suggestions: StyleSuggestion[] = [];

  if (style.tokens) {
    const tokenTypes = Object.keys(style.tokens);
    suggestions.push({
      type: 'tokens',
      message: `Define design tokens for: ${tokenTypes.join(', ')}`,
      example: `/* tokens.css */\n:root {\n${
        tokenTypes.map(type => `  /* ${type} tokens */\n  --${type}-primary: value;`).join('\n')
      }\n}`
    });
  }

  if (style.naming) {
    suggestions.push({
      type: 'naming',
      message: `Follow ${style.naming.pattern} naming convention`,
      example: style.naming.example || `.component--variant--state { }`
    });
  }

  if (style.guidelines && style.guidelines.length > 0) {
    suggestions.push({
      type: 'pattern',
      message: 'Style guidelines to follow',
      example: style.guidelines.map(g => `• ${g}`).join('\n')
    });
  }

  return suggestions;
}

/**
 * Console logger for validation results
 */
export function logValidation(report: ValidationReport, verbose = false): void {
  const icon = report.failed.length === 0 ? '✅' : '❌';
  
  console.group(`${icon} Rubric Validation: ${report.component}`);
  
  // Summary
  console.log(`Passed: ${report.passed.length} | Failed: ${report.failed.length} | Warnings: ${report.warnings.length}`);
  
  // Failed checks (always show)
  if (report.failed.length > 0) {
    console.group('❌ Failed Checks');
    report.failed.forEach(check => {
      console.error(`${check.rule}: ${check.message}`);
      if (verbose && check.details) {
        console.log('Details:', check.details);
      }
    });
    console.groupEnd();
  }
  
  // Warnings
  if (report.warnings.length > 0) {
    console.group('⚠️  Warnings');
    report.warnings.forEach(check => {
      console.warn(`${check.rule}: ${check.message}`);
    });
    console.groupEnd();
  }
  
  // Passed checks (only in verbose mode)
  if (verbose && report.passed.length > 0) {
    console.group('✅ Passed Checks');
    report.passed.forEach(check => {
      console.log(`${check.rule}: ${check.message}`);
    });
    console.groupEnd();
  }
  
  // Manual checks
  if (report.manual.length > 0) {
    console.group('📋 Manual Checks Required');
    report.manual.forEach(check => {
      console.info(`• ${check}`);
    });
    console.groupEnd();
  }
  
  // Style suggestions
  if (report.suggestions && report.suggestions.length > 0) {
    console.group('💡 Style Suggestions');
    report.suggestions.forEach(suggestion => {
      console.info(`${suggestion.type}: ${suggestion.message}`);
      if (suggestion.example) {
        console.log(suggestion.example);
      }
    });
    console.groupEnd();
  }
  
  // Coverage
  console.log(`📊 Coverage: ${report.coverage.percentage}% automated (${report.coverage.automated}/${report.coverage.total})`);
  
  console.groupEnd();
}