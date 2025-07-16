#!/usr/bin/env node
// analyze-changes.js - Extract metrics from git changes

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const promptNumber = process.argv[2];
const baseDir = process.argv[3];

if (!promptNumber || !baseDir) {
    console.error('Usage: node analyze-changes.js <prompt-number> <base-dir>');
    process.exit(1);
}

// Get list of changed files
const gitDiff = execSync('git diff HEAD~1 --name-only', { encoding: 'utf8' });
const allChangedFiles = gitDiff.trim().split('\n').filter(Boolean);
const srcFiles = allChangedFiles.filter(f => f.startsWith('src/') && (f.endsWith('.ts') || f.endsWith('.tsx')));

// Get detailed diff
const detailedDiff = execSync('git diff HEAD~1', { encoding: 'utf8' });

// Analyze for boundary violations
const violations = [];

srcFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    const layer = getLayer(file);
    
    // Check imports for violations
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const violation = checkImportViolation(layer, importPath, file);
        if (violation) {
            violations.push(violation);
        }
    }
    
    // Check for I/O operations in wrong layers
    if (layer === 'model' && content.includes('console.log')) {
        violations.push({
            type: 'io-in-model',
            file: file,
            description: 'Console.log found in model layer'
        });
    }
    
    if (layer === 'model' && (content.includes('fetch(') || content.includes('localStorage'))) {
        violations.push({
            type: 'external-io-in-model',
            file: file,
            description: 'External I/O (fetch/localStorage) found in model layer'
        });
    }
});

// Check for private member exposure
const privateExposures = [];

srcFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    
    // 1. Direct access to private members (e.g., object._private)
    const directAccessRegex = /\b\w+\._\w+/g;
    let match;
    while ((match = directAccessRegex.exec(content)) !== null) {
        if (!match[0].includes('this._')) {
            privateExposures.push({
                type: 'direct-access',
                match: match[0],
                file: file
            });
        }
    }
    
    // 2. Getters that expose private collections/objects
    const getterExposeRegex = /get\s+(\w+)\(\)[^{]*{\s*return\s+this\.(_\w+)\s*;?\s*}/g;
    while ((match = getterExposeRegex.exec(content)) !== null) {
        const publicName = match[1];
        const privateName = match[2];
        
        // Check if it's exposing a collection or mutable object
        if (content.includes(`${privateName}: Map<`) || 
            content.includes(`${privateName}: Set<`) ||
            content.includes(`${privateName}: Array<`) ||
            content.includes(`${privateName}[]`)) {
            privateExposures.push({
                type: 'getter-exposes-mutable',
                public: publicName,
                private: privateName,
                file: file
            });
        }
    }
    
    // 3. Setters for private members
    const setterRegex = /set\s+(\w+)\([^)]+\)[^{]*{\s*this\.(_\w+)\s*=/g;
    while ((match = setterRegex.exec(content)) !== null) {
        privateExposures.push({
            type: 'setter-for-private',
            public: match[1],
            private: match[2],
            file: file
        });
    }
});

// Count added/removed lines
const additions = (detailedDiff.match(/^\+[^+]/gm) || []).length;
const deletions = (detailedDiff.match(/^-[^-]/gm) || []).length;

// Load and analyze complexity data
let complexityData = { max: 0, average: 0, distribution: {} };
const complexityFile = path.join(baseDir, 'complexity', `${promptNumber}-metrics.json`);
if (fs.existsSync(complexityFile)) {
    complexityData = JSON.parse(fs.readFileSync(complexityFile, 'utf8'));
}

// Generate metrics
const metrics = {
    prompt: promptNumber,
    timestamp: new Date().toISOString(),
    files: {
        changed: allChangedFiles.length,
        srcChanged: srcFiles.length,
        total: 4, // app.tsx, task.ts, task-store.ts, task-view.tsx
        details: srcFiles
    },
    violations: {
        boundary: violations.length,
        details: violations
    },
    privateExposures: {
        count: privateExposures.length,
        details: privateExposures
    },
    complexity: {
        max: complexityData.max || 0,
        average: complexityData.average || 0,
        distribution: complexityData.distribution || {}
    },
    gitStats: {
        additions: additions,
        deletions: deletions,
        netChange: additions - deletions
    }
};

// Helper functions
function getLayer(filePath) {
    if (filePath.includes('/models/')) return 'model';
    if (filePath.includes('/stores/')) return 'store';
    if (filePath.includes('/views/')) return 'view';
    if (filePath.includes('app.')) return 'app';
    return 'unknown';
}

function checkImportViolation(fromLayer, importPath, file) {
    // Skip external imports
    if (!importPath.startsWith('.')) return null;
    
    // Determine target layer from import path
    let targetLayer = 'unknown';
    if (importPath.includes('/models/') || importPath.includes('models/')) targetLayer = 'model';
    if (importPath.includes('/stores/') || importPath.includes('stores/')) targetLayer = 'store';
    if (importPath.includes('/views/') || importPath.includes('views/')) targetLayer = 'view';
    
    // Check for violations
    if (fromLayer === 'view' && targetLayer === 'model') {
        return {
            type: 'view-imports-model',
            file: file,
            importPath: importPath,
            description: 'View should not directly import Model'
        };
    }
    
    if (fromLayer === 'model' && (targetLayer === 'store' || targetLayer === 'view')) {
        return {
            type: 'model-imports-upper-layer',
            file: file,
            importPath: importPath,
            description: 'Model should not import Store or View'
        };
    }
    
    if (fromLayer === 'store' && targetLayer === 'view') {
        return {
            type: 'store-imports-view',
            file: file,
            importPath: importPath,
            description: 'Store should not import View'
        };
    }
    
    return null;
}

// Output results
console.log(JSON.stringify(metrics, null, 2));