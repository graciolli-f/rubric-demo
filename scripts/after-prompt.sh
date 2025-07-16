#!/bin/bash
# after-prompt.sh - Run analysis after each prompt completion

if [ -z "$1" ]; then
    echo "Usage: ./scripts/after-prompt.sh <prompt-number>"
    echo "Example: ./scripts/after-prompt.sh 1.1"
    exit 1
fi

PROMPT=$1
EXPERIMENT_TYPE="control"
MODEL="sonnet4"
TRIAL="1"
BASE_DIR="results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "=== ANALYZING PROMPT $PROMPT ==="
echo "Timestamp: $TIMESTAMP"
echo "================================"

# 1. Commit changes
echo "📝 Committing changes..."
git add .
git commit -m "After prompt $PROMPT" || {
    echo "❌ No changes to commit"
    exit 1
}

# 2. Run ESLint complexity analysis
echo "🔍 Running complexity analysis..."
npx eslint src --format json > $BASE_DIR/complexity/$PROMPT-complexity.json 2>/dev/null || true

# 3. Generate complexity summary
echo "📊 Generating complexity summary..."
node scripts/complexity-summary.js \
    $BASE_DIR/complexity/$PROMPT-complexity.json \
    $BASE_DIR/complexity/$PROMPT-metrics.json

# 4. Analyze code changes
echo "🔬 Analyzing code changes..."
node scripts/analyze-changes.js $PROMPT $BASE_DIR > $BASE_DIR/metrics/$PROMPT-analysis.json

# 5. Generate architecture diagram
echo "🎨 Generating architecture diagram..."
if command -v madge &> /dev/null; then
    madge src --image $BASE_DIR/diagrams/$PROMPT-architecture.png
    # Also generate circular dependencies check
    madge src --circular --image $BASE_DIR/diagrams/$PROMPT-circular.png 2>/dev/null || true
else
    echo "⚠️  Skipping diagram generation (madge not installed)"
fi

# 6. Backup current source state
echo "💾 Backing up source files..."
rm -rf $BASE_DIR/backups/$PROMPT-src
cp -r src $BASE_DIR/backups/$PROMPT-src/

# 7. Update main metrics file
echo "📈 Updating metrics tracking..."
node scripts/update-metrics.js $PROMPT $BASE_DIR

# 8. Generate quick summary
echo ""
echo "=== QUICK SUMMARY ==="
node scripts/show-summary.js $PROMPT $BASE_DIR

echo ""
echo "✅ Analysis complete for prompt $PROMPT"
echo ""
echo "📁 Results saved to: $BASE_DIR"
echo "📊 Complexity report: $BASE_DIR/complexity/$PROMPT-metrics.json"
echo "🎨 Architecture diagram: $BASE_DIR/diagrams/$PROMPT-architecture.png"
echo ""
echo "Next: Run prompt $(echo $PROMPT | awk -F. '{print $1"."($2+1)}')"
echo ""