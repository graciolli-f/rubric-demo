'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  AIGeneratedButton, 
  AIGeneratedForm, 
  AIGeneratedLink 
} from '@/components/demo/AIGeneratedComponents';
import { 
  SecureButton, 
  SecureForm, 
  SecureLink 
} from '@/components/demo/SecureComponents';
import ValidationReport from '@/components/demo/ValidationReport';
import CodeExample from '@/components/ui/CodeExample';
import CategoryBadge from '@/components/ui/CategoryBadge';
type ValidationState = {
  button: any;
  form: any;
  link: any;
};

export default function Home() {
  const [activeDemo, setActiveDemo] = useState<'button' | 'form' | 'link'>('button');
  const [showFixed, setShowFixed] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationState>({
    button: null,
    form: null,
    link: null
  });

  // Refs for validation
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const secureButtonRef = useRef<HTMLButtonElement>(null);
  const aiFormRef = useRef<HTMLFormElement>(null);
  const secureFormRef = useRef<HTMLFormElement>(null);
  const aiLinkRef = useRef<HTMLAnchorElement>(null);
  const secureLinkRef = useRef<HTMLAnchorElement>(null);

  // Simulated validation function
  const validateComponent = async (element: HTMLElement, presetName: string, isSecureVersion: boolean) => {
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (isSecureVersion) {
      return {
        component: presetName,
        timestamp: new Date(),
        passed: [
          { rule: 'contrast', passed: true, message: 'Color contrast ratio meets WCAG AAA (7:1)', severity: 'info' as const },
          { rule: 'keyboard', passed: true, message: 'Element is keyboard accessible', severity: 'info' as const },
          { rule: 'focusVisible', passed: true, message: 'Element has focus indication', severity: 'info' as const },
          { rule: 'touchTarget', passed: true, message: 'Touch target meets minimum size (44px)', severity: 'info' as const },
          { rule: 'xss', passed: true, message: 'No XSS vulnerabilities detected', severity: 'info' as const },
          { rule: 'bundleSize', passed: true, message: 'Estimated bundle impact: 1.2kb', severity: 'info' as const },
        ],
        failed: [],
        warnings: [],
        manual: ['Verify color contrast in high contrast mode', 'Test with screen reader'],
        coverage: { total: 8, automated: 6, percentage: 75 }
      };
    } else {
      return {
        component: presetName,
        timestamp: new Date(),
        passed: [
          { rule: 'renderTime', passed: true, message: 'Render time: 2.5ms', severity: 'info' as const }
        ],
        failed: [
          { rule: 'contrast', passed: false, message: 'Color contrast ratio should be at least 4.5:1', severity: 'error' as const, details: { required: 4.5, actual: 2.1 } },
          { rule: 'keyboard', passed: false, message: 'Element must be keyboard accessible (native element or tabindex >= 0)', severity: 'error' as const },
          { rule: 'focusVisible', passed: false, message: 'Element must have visible focus indication (:focus-visible styles)', severity: 'error' as const },
          { rule: 'touchTarget', passed: false, message: 'Touch target must be at least 44px (currently 32px)', severity: 'error' as const },
          { rule: 'xss', passed: false, message: 'Potential XSS vulnerability: unsafe content or dangerouslySetInnerHTML usage', severity: 'error' as const },
          { rule: 'clickjacking', passed: false, message: 'Suspicious styling detected - potential clickjacking vector', severity: 'error' as const },
          { rule: 'externalLinks', passed: false, message: 'External link security issues: use HTTPS and rel="noopener noreferrer" for target="_blank"', severity: 'error' as const },
        ],
        warnings: [
          { rule: 'bundleSize', passed: false, message: 'Bundle impact too large: 3.5kb (max: 2kb)', severity: 'warning' as const },
          { rule: 'imageOptimization', passed: false, message: '1 image optimization issues', severity: 'warning' as const }
        ],
        manual: ['Verify color contrast in high contrast mode', 'Test with screen reader', 'Review security headers'],
        coverage: { total: 12, automated: 9, percentage: 75 }
      };
    }
  };

  // Run validation when demo or version changes
  useEffect(() => {
    const validateCurrentDemo = async () => {
      console.log('Validating:', activeDemo, showFixed ? 'secure' : 'ai-generated');
      
      let ref, presetName;
      
      if (activeDemo === 'button') {
        ref = showFixed ? secureButtonRef : aiButtonRef;
        presetName = 'button';
      } else if (activeDemo === 'form') {
        ref = showFixed ? secureFormRef : aiFormRef;
        presetName = 'form-input';
      } else {
        ref = showFixed ? secureLinkRef : aiLinkRef;
        presetName = 'link';
      }

      if (ref.current) {
        try {
          const result = await validateComponent(ref.current, presetName, showFixed);
          console.log('Validation result:', result);
          setValidationResults((prev: ValidationState) => ({
            ...prev,
            [activeDemo]: result
          }));
        } catch (error) {
          console.error('Validation error:', error);
        }
      } else {
        console.log('Ref not ready yet');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(validateCurrentDemo, 100);
    return () => clearTimeout(timer);
  }, [activeDemo, showFixed]);

  const currentValidation = validationResults[activeDemo];

  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-16 animate-fade-in">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Rubric
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          AI Code Quality Validator
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          The missing quality layer between AI code generation and production. 
          Catch accessibility, performance, and security issues that LLMs commonly miss.
        </p>
      </section>

      {/* Demo Selector */}
      <section className="mb-8">
        <div className="flex justify-center gap-4 mb-8">
          {(['button', 'form', 'link'] as const).map((demo) => (
            <button
              key={demo}
              onClick={() => {
                console.log('Clicking demo:', demo);
                setActiveDemo(demo);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeDemo === demo
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              {demo.charAt(0).toUpperCase() + demo.slice(1)} Component
            </button>
          ))}
        </div>
      </section>

      {/* Version Toggle */}
      <section className="mb-12">
        <div className="flex justify-center items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <span className={`text-lg font-medium ${!showFixed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              AI Generated
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showFixed}
                onChange={(e) => setShowFixed(e.target.checked)}
                className="sr-only"
              />
              <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                showFixed ? 'translate-x-6 bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
            <span className={`text-lg font-medium ${showFixed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Rubric Validated
            </span>
          </label>
        </div>
      </section>

      {/* Main Demo Area */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Component Preview */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Component Preview
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
            {activeDemo === 'button' && (
              showFixed ? 
                <SecureButton ref={secureButtonRef} /> : 
                <AIGeneratedButton ref={aiButtonRef} />
            )}
            {activeDemo === 'form' && (
              showFixed ? 
                <SecureForm ref={secureFormRef} /> : 
                <AIGeneratedForm ref={aiFormRef} />
            )}
            {activeDemo === 'link' && (
              showFixed ? 
                <SecureLink ref={secureLinkRef} /> : 
                <AIGeneratedLink ref={aiLinkRef} />
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Component State:
            </h3>
            <div className="flex gap-2">
              <CategoryBadge category="accessibility" />
              <CategoryBadge category="performance" />
              <CategoryBadge category="security" />
            </div>
          </div>
        </section>

        {/* Validation Results */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Validation Results
          </h2>
          
          {currentValidation ? (
            <ValidationReport report={currentValidation} />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              Running validation...
            </div>
          )}
        </section>
      </div>

      {/* Integration Example */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Integration Example
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Add Rubric validation to your components with just a few lines of code:
        </p>
        
        <CodeExample 
          code={`// Install the package
npm install @rubric/validate

// Import and use
import { withRubric } from '@rubric/validate';
import buttonSpec from '@rubric/validate/presets/button';

// Wrap your component
const ValidatedButton = withRubric(buttonSpec)(MyButton);

// Or use the hook
import { useRubricValidation } from '@rubric/validate';

function MyComponent() {
  const { ref, validate, passed, report } = useRubricValidation(buttonSpec);
  
  return <button ref={ref}>Click me</button>;
}`}
        />
      </section>

      {/* Benefits */}
      <section className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">♿</span>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Accessibility First
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Catch WCAG violations, keyboard navigation issues, and screen reader problems 
            that AI often misses.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Performance Metrics
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor bundle size, render performance, and optimization opportunities 
            in real-time.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Security Built-in
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Detect XSS vulnerabilities, unsafe links, and other security issues 
            before they reach production.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Ready to validate your AI-generated code?
        </h2>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Get Started
          </button>
          <button className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:shadow-md transition-shadow">
            View Documentation
          </button>
        </div>
      </section>
    </main>
  );
}