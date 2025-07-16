#!/usr/bin/env node
// update-metrics.js - Update the main metrics tracking file

const fs = require('fs');
const path = require('path');

const promptNumber = process.argv[2];
const baseDir = process.argv[3];

if (!promptNumber || !baseDir) {
    console.error('Usage: node update-metrics.js <prompt-number> <base-dir>');
    process.exit(1);
}

// Load existing metrics
const metricsFile = path.join(baseDir, 'metrics.json');
const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

// Load analysis for this prompt
const analysisFile = path.join(baseDir, 'metrics', `${promptNumber}-analysis.json`);
const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

// Update metrics with this prompt's data
metrics.prompts[promptNumber] = {
    timestamp: analysis.timestamp,
    boundaryViolations: analysis.violations.boundary,
    constraintModAttempts: 0, // Always 0 for control
    filesModified: analysis.files.srcChanged,
    totalFiles: analysis.files.total,
    privateExposures: analysis.privateExposures.count,
    complexityMax: analysis.complexity.max,
    complexityAvg: analysis.complexity.average,
    featureComplete: 'pending', // Must be manually updated
    notes: ''
};

// Calculate cumulative stats
const promptKeys = Object.keys(metrics.prompts).sort();
if (promptKeys.length > 0) {
    const latestPrompt = promptKeys[promptKeys.length - 1];
    const stats = metrics.prompts[latestPrompt];
    
    metrics.summary = {
        totalPrompts: promptKeys.length,
        totalViolations: Object.values(metrics.prompts).reduce((sum, p) => sum + p.boundaryViolations, 0),
        totalFilesEverModified: new Set(
            Object.values(metrics.prompts).flatMap(p => analysis.files?.details || [])
        ).size,
        maxComplexityReached: Math.max(...Object.values(metrics.prompts).map(p => p.complexityMax)),
        lastUpdated: new Date().toISOString()
    };
}

// Save updated metrics
fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

console.log(`Updated metrics for prompt ${promptNumber}`);
console.log(`Remember to manually update 'featureComplete' status in metrics.json`);