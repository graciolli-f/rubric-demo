 'use client';

import { forwardRef } from 'react';

/**
 * AI-generated button with common issues:
 * - Poor contrast ratio
 * - No focus indicators
 * - Small touch target
 * - Missing keyboard support
 * - Inline styles (performance)
 */
export const AIGeneratedButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <div 
      ref={ref as any}
      style={{
        display: 'inline-block',
        padding: '6px 12px',
        backgroundColor: '#e0e0e0',
        color: '#666666',
        borderRadius: '4px',
        fontSize: '14px',
        cursor: 'pointer',
        border: 'none',
        outline: 'none'
      }}
      onClick={() => alert('Clicked!')}
    >
      Submit
    </div>
  );
});

AIGeneratedButton.displayName = 'AIGeneratedButton';

/**
 * AI-generated form with issues:
 * - XSS vulnerability (dangerouslySetInnerHTML)
 * - No ARIA labels
 * - Poor error handling
 * - Inline event handlers
 */
export const AIGeneratedForm = forwardRef<HTMLFormElement>((props, ref) => {
  const userContent = '<img src=x onerror="alert(\'XSS\')">';
  
  return (
    <form 
      ref={ref}
      style={{ width: '300px' }}
      onSubmit={(e) => {
        e.preventDefault();
        eval('console.log("Form submitted")'); // Security issue
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <input 
          type="text" 
          placeholder="Enter your name"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <input 
          type="password"
          placeholder="Password"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>
      
      <div 
        dangerouslySetInnerHTML={{ __html: userContent }}
        style={{ marginBottom: '10px', color: '#666' }}
      />
      
      <button 
        type="submit"
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Submit
      </button>
    </form>
  );
});

AIGeneratedForm.displayName = 'AIGeneratedForm';

/**
 * AI-generated link with issues:
 * - External link without security attributes
 * - Opens in new tab without noopener/noreferrer
 * - HTTP instead of HTTPS
 * - Clickjacking vulnerability (transparent overlay)
 */
export const AIGeneratedLink = forwardRef<HTMLAnchorElement>((props, ref) => {
  return (
    <div style={{ position: 'relative' }}>
      <a 
        ref={ref}
        href="http://external-site.com/promo"
        target="_blank"
        style={{
          color: '#1a73e8',
          textDecoration: 'underline',
          fontSize: '16px'
        }}
      >
        Check out this amazing offer!
      </a>
      
      {/* Invisible overlay - clickjacking risk */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.01,
          cursor: 'pointer',
          zIndex: 10000
        }}
        onClick={() => window.location.href = 'http://malicious-site.com'}
      />
    </div>
  );
});

AIGeneratedLink.displayName = 'AIGeneratedLink';