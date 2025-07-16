// metrics/scripts/complexity-summary.js (CommonJS version)
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

// Usage help
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`
Usage: node metrics/scripts/complexity-summary.js <input-file> [output-file]

Arguments:
  input-file   Path to ESLint JSON output (required)
  output-file  Path to save metrics summary (optional)
               If not provided, saves to same directory as input

Examples:
  # Basic usage (saves metrics next to input)
  node metrics/scripts/complexity-summary.js results/control/Trial-1/Sonnet/1.1-complexity.json

  # Specify output location
  node metrics/scripts/complexity-summary.js results/control/Trial-1/Sonnet/1.1-complexity.json results/control/Trial-1/Sonnet/1.1-metrics.json

  # Using npm script
  npm run complexity:summary -- results/control/Trial-1/Sonnet/1.1-complexity.json
`);
  process.exit(0);
}

// Get input and output paths
const inputPath = path.resolve(args[0]);
const outputPath = args[1] 
  ? path.resolve(args[1])
  : inputPath.replace(/complexity\.json$/, 'metrics.json').replace(/\.json$/, '-metrics.json');

// Check if input file exists
if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

// Read and parse the report
let report;
try {
  report = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (error) {
  console.error(`Error parsing JSON from ${inputPath}:`, error.message);
  process.exit(1);
}

const complexities = [];

// Extract complexity data
report.forEach(file => {
  if (!file.messages) return;
  
  file.messages.forEach(msg => {
    if (msg.ruleId === 'complexity') {
      const match = msg.message.match(/complexity of (\d+)/);
      if (match) {
        complexities.push({
          file: file.filePath.replace(process.cwd(), ''),
          line: msg.line,
          complexity: parseInt(match[1]),
          function: msg.nodeType || 'unknown'
        });
      }
    }
  });
});

if (complexities.length === 0) {
  console.log('No complexity data found. Make sure ESLint complexity rule is enabled.');
  process.exit(0);
}

// Sort by complexity (highest first)
complexities.sort((a, b) => b.complexity - a.complexity);

// Display results
console.log('\n=== Cyclomatic Complexity Report ===');
console.log(`Input: ${inputPath}\n`);
console.log(`Total functions analyzed: ${complexities.length}`);
console.log(`Max complexity: ${complexities[0]?.complexity || 0}`);
console.log(`Average complexity: ${(complexities.reduce((sum, c) => sum + c.complexity, 0) / complexities.length).toFixed(2)}`);

console.log('\n=== Top 5 Most Complex Functions ===');
complexities.slice(0, 5).forEach((c, i) => {
  console.log(`\n${i + 1}. Complexity: ${c.complexity}`);
  console.log(`   File: ${c.file}`);
  console.log(`   Line: ${c.line}`);
});

// Distribution
console.log('\n=== Complexity Distribution ===');
const distribution = {
  '1-3': complexities.filter(c => c.complexity <= 3).length,
  '4-7': complexities.filter(c => c.complexity >= 4 && c.complexity <= 7).length,
  '8-10': complexities.filter(c => c.complexity >= 8 && c.complexity <= 10).length,
  '11+': complexities.filter(c => c.complexity > 10).length
};

Object.entries(distribution).forEach(([range, count]) => {
  const percentage = ((count / complexities.length) * 100).toFixed(1);
  console.log(`${range}: ${count} functions (${percentage}%)`);
});

// Prepare metrics object
const metrics = {
  inputFile: path.basename(inputPath),
  timestamp: new Date().toISOString(),
  max: complexities[0]?.complexity || 0,
  average: parseFloat((complexities.reduce((sum, c) => sum + c.complexity, 0) / complexities.length).toFixed(2)),
  distribution,
  totalFunctions: complexities.length,
  topFunctions: complexities.slice(0, 5).map(c => ({
    file: c.file,
    complexity: c.complexity,
    line: c.line
  }))
};

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save metrics
try {
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
  console.log(`\nMetrics saved to: ${outputPath}`);
} catch (error) {
  console.error(`Error saving metrics:`, error.message);
  process.exit(1);
}