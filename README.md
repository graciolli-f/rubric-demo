 # Rubric Demo

A proof-of-concept demo showing how AI-generated code could be validated for accessibility, performance, and security issues.

## What This Is

This is a hardcoded Next.js demo that shows:
- Side-by-side comparison of "problematic" vs "fixed" React components
- Mock validation results categorized as accessibility (♿), performance (⚡), and security (🔒) issues
- Example integration code

**Note**: This is just a demo. The validation results are hardcoded, not real.

## What the Demo Shows

1. **AI Generated Components** - Intentionally problematic code:
   - Button with poor contrast and no focus states
   - Form with XSS vulnerabilities
   - Link with security issues

2. **"Validated" Components** - Fixed versions that would pass checks

3. **Mock Validation Results** - Hardcoded results showing what validation might look like

## Development

The validation logic is currently just checking a boolean flag. See `demo/src/app/page.tsx` for the mock implementation.

## License

MIT