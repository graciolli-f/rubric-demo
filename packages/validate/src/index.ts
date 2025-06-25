// packages/validate/src/index.ts - Main entry point for @rubric/validate

// Re-export core functionality
export * from './core/index';

// Import presets
import buttonPreset from './presets/button';
import formInputPreset from './presets/form-input';
import linkPreset from './presets/link';

// Preset map for easy access
const presets = {
  button: buttonPreset,
  'form-input': formInputPreset,
  link: linkPreset
} as const;

export type PresetName = keyof typeof presets;

/**
 * Simple validation wrapper for components
 * @param element - DOM element to validate
 * @param presetName - Name of the preset to use
 * @returns Validation report
 */
export async function validateComponent(
  element: HTMLElement,
  presetName: PresetName | string
): Promise<ReturnType<typeof import('./core/index').validate>> {
  const { parseRubric, validate } = await import('./core/index');
  
  let spec;
  if (presetName in presets) {
    // Use built-in preset
    const presetContent = presets[presetName as PresetName];
    spec = parseRubric(presetContent);
  } else {
    // Try to load custom preset
    try {
      const customPreset = await import(presetName);
      spec = parseRubric(customPreset.default || customPreset);
    } catch (error) {
      throw new Error(`Preset "${presetName}" not found. Available presets: ${Object.keys(presets).join(', ')}`);
    }
  }
  
  return validate(element, spec);
}

/**
 * React hook wrapper for easier integration
 */
export function useRubricValidation(presetName: PresetName | string) {
  const React = require('react');
  const { useRubricValidation: coreHook } = require('./core/react');
  const { parseRubric } = require('./core/parser');
  
  const spec = React.useMemo(() => {
    if (presetName in presets) {
      return parseRubric(presets[presetName as PresetName]);
    }
    // For custom presets, you'd need to handle this differently
    throw new Error(`Preset "${presetName}" must be loaded manually for hooks`);
  }, [presetName]);
  
  return coreHook(spec);
}

/**
 * HOC wrapper with preset support
 */
export function withRubricPreset<P extends object = {}>(
  presetName: PresetName
): (Component: React.ComponentType<P>) => React.ComponentType<P> {
  const { withRubric } = require('./core/react');
  const { parseRubric } = require('./core/parser');
  
  const spec = parseRubric(presets[presetName]);
  return withRubric(spec);
}

// Export preset names for TypeScript
export { presets };

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__RUBRIC__ = {
    validateComponent,
    presets: Object.keys(presets),
    version: '0.1.0'
  };
  
  console.log(
    '%c🔍 Rubric Validation Ready',
    'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px;',
    '\nAvailable at window.__RUBRIC__'
  );
}