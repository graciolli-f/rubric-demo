 // parser.ts - Parses .rux content into structured specifications

import type { 
    RubricSpec, 
    Requirement,
    ValidationRules,
    PropDefinition,
    StyleGuidelines 
  } from './types';
  
  /**
   * Parse Rubric specification content into structured data
   */
  export function parseRubric(content: string): RubricSpec {
    const spec: RubricSpec = {
      metadata: {
        name: 'Component'
      },
      requirements: [],
      recommendations: []
    };
  
    // Extract metadata
    const metadataMatch = content.match(/Component:\s*(\w+)/);
    if (metadataMatch?.[1]) {
      spec.metadata.name = metadataMatch[1];
    }
  
    const descMatch = content.match(/Description:\s*"([^"]+)"/);
    if (descMatch?.[1]) {
      spec.metadata.description = descMatch[1];
    }
  
    const categoryMatch = content.match(/Category:\s*"([^"]+)"/);
    if (categoryMatch?.[1]) {
      spec.metadata.category = categoryMatch[1];
    }
  
    // Extract structured blocks
    const blockRegex = /@(\w+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = blockRegex.exec(content)) !== null) {
      const [, blockName, blockContent] = match;
      switch (blockName.toLowerCase()) {
        case 'structure':
          spec.structure = parseStructureBlock(blockContent);
          break;
        case 'validation':
          spec.validation = parseValidationBlock(blockContent);
          break;
        case 'props':
          spec.props = parsePropsBlock(blockContent);
          break;
        case 'style':
          spec.style = parseStyleBlock(blockContent);
          break;
        default:
          // Store unknown blocks as-is
          (spec as any)[blockName.toLowerCase()] = parseGenericBlock(blockContent);
      }
    }
  
    // Extract natural language sections
    const lines = content.split('\n');
    let currentSection: 'requirements' | 'recommendations' | null = null;
  
    for (const line of lines) {
      const trimmed = line.trim();
  
      // Section headers
      if (trimmed.match(/^!Requirements:/i)) {
        currentSection = 'requirements';
        continue;
      } else if (trimmed.match(/^\?Recommendations:/i)) {
        currentSection = 'recommendations';
        continue;
      }
  
      // Content lines
      if (trimmed.startsWith('!') && currentSection === 'requirements') {
        spec.requirements.push(parseRequirement(trimmed));
      } else if (trimmed.startsWith('?') && currentSection === 'recommendations') {
        spec.recommendations.push(trimmed.substring(1).trim());
      }
    }
  
    return spec;
  }
  
  /**
   * Parse @Structure block
   */
  function parseStructureBlock(content: string): Record<string, any> {
    return parseKeyValuePairs(content);
  }
  
  /**
   * Parse @Validation block with special handling for rules
   */
  function parseValidationBlock(content: string): ValidationRules {
    const rules: ValidationRules = {};
    const lines = content.trim().split('\n');
  
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
  
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > -1) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
  
        // Parse validation-specific values
        if (key === 'contrast') {
          const parsed = parseValue(value);
          if (typeof parsed === 'object' && 'ratio' in parsed) {
            rules.contrast = parsed as any;
          } else if (typeof parsed === 'number') {
            rules.contrast = { ratio: parsed };
          }
        } else if (key === 'touchTarget' || key === 'bundleSize') {
          const parsed = parseValue(value);
          if (typeof parsed === 'object' && ('min' in parsed || 'max' in parsed)) {
            rules[key] = parsed as any;
          } else if (typeof parsed === 'number' || typeof parsed === 'string') {
            rules[key] = { min: parsed };
          }
        } else if (key === 'motion') {
          const parsed = parseValue(value);
          if (typeof parsed === 'object' && 'respectsPreference' in parsed) {
            rules.motion = parsed as any;
          } else if (parsed === true || parsed === 'required') {
            rules.motion = { respectsPreference: true };
          }
        } else {
          // Generic rule
          rules[key as keyof ValidationRules] = parseValue(value) as any;
        }
      }
    }
  
    return rules;
  }
  
  /**
   * Parse @Props block with TypeScript-like syntax
   */
  function parsePropsBlock(content: string): Record<string, PropDefinition> {
    const props: Record<string, PropDefinition> = {};
    const lines = content.trim().split('\n');
  
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
  
      // Match prop definition: name?: type = default
      const propMatch = trimmed.match(/^(\w+)(\?)?\s*:\s*([^=]+?)(?:\s*=\s*(.+))?$/);
      if (propMatch) {
        const [, name, optional, type, defaultValue] = propMatch;
        const prop: PropDefinition = {
          type: type.trim(),
          required: !optional
        };
  
        // Handle enum types (value1 | value2 | value3)
        if (type.includes('|')) {
          prop.enum = type.split('|').map(v => v.trim());
          prop.type = 'enum';
        }
  
        // Parse default value
        if (defaultValue) {
          prop.default = parseValue(defaultValue.trim());
        }
  
        props[name] = prop;
      }
    }
  
    return props;
  }
  
  /**
   * Parse @Style block
   */
  function parseStyleBlock(content: string): StyleGuidelines {
    const style: StyleGuidelines = {};
    const parsed = parseKeyValuePairs(content);
  
    // Convert parsed data to StyleGuidelines structure
    if (parsed.guidelines) {
      style.guidelines = Array.isArray(parsed.guidelines) 
        ? parsed.guidelines 
        : [parsed.guidelines];
    }
  
    if (parsed.tokens) {
      style.tokens = parsed.tokens;
    }
  
    if (parsed.naming) {
      style.naming = parsed.naming;
    }
  
    return style;
  }
  
  /**
   * Parse generic block as key-value pairs
   */
  function parseGenericBlock(content: string): Record<string, any> {
    return parseKeyValuePairs(content);
  }
  
  /**
   * Parse key-value pairs with nested object support
   */
  function parseKeyValuePairs(content: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = content.trim().split('\n');
    let currentKey: string | null = null;
    let currentObject: any = null;
    let indent = 0;
  
    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
  
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
      const trimmed = line.trim();
  
      // Handle nested objects
      if (leadingSpaces > indent && currentKey) {
        if (!currentObject) {
          currentObject = {};
          result[currentKey] = currentObject;
        }
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > -1) {
          const key = trimmed.substring(0, colonIndex).trim();
          const value = trimmed.substring(colonIndex + 1).trim();
          currentObject[key] = parseValue(value);
        }
      } else {
        // Top-level key-value
        currentObject = null;
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > -1) {
          currentKey = trimmed.substring(0, colonIndex).trim();
          const value = trimmed.substring(colonIndex + 1).trim();
          
          if (value === '{' || !value) {
            // Start of nested object
            indent = leadingSpaces;
          } else {
            result[currentKey] = parseValue(value);
            currentKey = null;
          }
        }
      }
    }
  
    return result;
  }
  
  /**
   * Parse a requirement line with optional validation hint
   */
  function parseRequirement(line: string): Requirement {
    // Remove leading ! and trim
    let text = line.substring(1).trim();
    let validation: string | undefined;
    let severity: Requirement['severity'] = 'error';
  
    // Extract validation hint [@validate: ruleName]
    const validationMatch = text.match(/@validate:\s*([^\]]+)\]/);
    if (validationMatch?.[1]) {
      validation = validationMatch[1].trim();
      text = text.replace(/@validate:[^\]]+\]/, '').trim();
    }
  
    // Extract severity hint [@severity: warning]
    const severityMatch = text.match(/@severity:\s*(error|warning|info)\]/);
    if (severityMatch?.[1]) {
      severity = severityMatch[1] as Requirement['severity'];
      text = text.replace(/@severity:[^\]]+\]/, '').trim();
    }
  
    // Auto-categorize based on keywords
    const category = categorizeRequirement(text);
  
    return {
      text,
      validation,
      category,
      severity
    };
  }
  
  /**
   * Categorize requirement based on content
   */
  function categorizeRequirement(text: string): Requirement['category'] {
    const lower = text.toLowerCase();
    
    if (lower.match(/contrast|keyboard|focus|aria|screen reader|accessible/)) {
      return 'accessibility';
    }
    if (lower.match(/performance|render|bundle|load|optimize/)) {
      return 'performance';
    }
    if (lower.match(/browser|compatibility|support|fallback/)) {
      return 'compatibility';
    }
    
    return 'quality';
  }
  
  /**
   * Parse a value string into appropriate type
   */
  function parseValue(value: string): any {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
  
    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
  
    // Number
    if (/^\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }
  
    // Array (simple format)
    if (value.startsWith('[') && value.endsWith(']')) {
      return value
        .slice(1, -1)
        .split(',')
        .map(v => v.trim())
        .map(v => parseValue(v));
    }
  
    // Object (simple format: { key: value, key2: value2 })
    if (value.startsWith('{') && value.endsWith('}')) {
      const obj: Record<string, any> = {};
      const content = value.slice(1, -1);
      const pairs = content.split(',');
      
      for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > -1) {
          const k = pair.substring(0, colonIndex).trim();
          const v = pair.substring(colonIndex + 1).trim();
          obj[k] = parseValue(v);
        }
      }
      
      return obj;
    }
  
    // Comparison operators
    if (value.includes('>=') || value.includes('<=') || value.includes('>') || value.includes('<')) {
      const match = value.match(/^(>=|<=|>|<)\s*(.+)$/);
      if (match) {
        return {
          operator: match[1],
          value: parseValue(match[2])
        };
      }
    }
  
    // Default: return as string
    return value;
  }