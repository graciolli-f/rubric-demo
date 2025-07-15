#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Parse .rux files (simplified for demo)
function parseRuxFile(ruxPath) {
  const content = fs.readFileSync(ruxPath, 'utf8');
  const rules = {
    location: '',
    deniedImports: [],
    deniedOperations: []
  };
  
  // Extract location
  const locationMatch = content.match(/location:\s*"([^"]+)"/);
  if (locationMatch) rules.location = locationMatch[1];
  
  // Extract denied imports
  const denyImportsMatch = content.match(/deny imports\s*\[([^\]]+)\]/);
  if (denyImportsMatch) {
    rules.deniedImports = denyImportsMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''));
  }
  
  // Extract denied operations (io.*, etc)
  const denyMatches = content.matchAll(/deny\s+([\w.*]+)/g);
  for (const match of denyMatches) {
    if (!match[1].includes('imports')) {
      rules.deniedOperations.push(match[1]);
    }
  }
  
  return rules;
}

// Validate files against .rux rules
let violations = 0;

// Check each .rux file
const ruxFiles = [
  'rubric/models/task.rux',
  'rubric/stores/task-store.rux', 
  'rubric/views/task-view.rux'
];

ruxFiles.forEach(ruxFile => {
  if (!fs.existsSync(ruxFile)) return;
  
  const rules = parseRuxFile(ruxFile);
  const sourceFile = rules.location;
  
  if (!fs.existsSync(sourceFile)) return;
  
  const content = fs.readFileSync(sourceFile, 'utf8');
  
  // Check imports
  const imports = content.match(/import .* from ['"]([^'"]+)['"]/g) || [];
  imports.forEach(imp => {
    rules.deniedImports.forEach(denied => {
      if (imp.includes(denied)) {
        console.log(`❌ ${sourceFile}: Forbidden import: ${denied}`);
        violations++;
      }
    });
  });
  
  // Check operations (simplified)
  rules.deniedOperations.forEach(op => {
    if (op === 'io.*' && content.includes('fetch(')) {
      console.log(`❌ ${sourceFile}: Forbidden operation: network I/O`);
      violations++;
    }
    if (op === 'imports.*' && imports.length > 0) {
      console.log(`❌ ${sourceFile}: No imports allowed`);
      violations++;
    }
  });
});

if (violations === 0) {
  console.log('✅ All constraints passed!');
} else {
  console.log(`\n❌ Found ${violations} constraint violations`);
  process.exit(1);
}