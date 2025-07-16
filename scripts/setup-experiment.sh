#!/bin/bash
# setup-experiment.sh - Initialize control experiment

EXPERIMENT_TYPE="control"
MODEL="sonnet4"
TRIAL="1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BRANCH_NAME="${EXPERIMENT_TYPE}-${MODEL}-trial${TRIAL}-${TIMESTAMP}"

echo "=== RUBRIC DSL CONTROL EXPERIMENT SETUP ==="
echo "Type: $EXPERIMENT_TYPE"
echo "Model: $MODEL"
echo "Trial: $TRIAL"
echo "Branch: $BRANCH_NAME"
echo "=========================================="

# Create and checkout branch
echo "Creating experiment branch..."
git checkout -b $BRANCH_NAME

# Create results directory structure
echo "Creating directory structure..."
mkdir -p results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/{complexity,backups,metrics,diagrams,prompts}

# Initialize metrics tracking file
cat > results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/metrics.json << EOF
{
  "experiment": "$EXPERIMENT_TYPE",
  "model": "$MODEL",
  "trial": $TRIAL,
  "branch": "$BRANCH_NAME",
  "timestamp": "$TIMESTAMP",
  "startTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "prompts": {}
}
EOF

# Create prompts for easy access
cat > results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/prompts/1.1.txt << 'EOF'
Add a task description field to the existing task model and display it in the UI.
EOF

cat > results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/prompts/1.2.txt << 'EOF'
Add logging for all task operations (create, toggle, delete). 
Log to console: "[timestamp] Action: [action] Task: [id]"
EOF

cat > results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/prompts/1.3.txt << 'EOF'
Add real-time sync - tasks should auto-save to the backend as users type.
Use fetch() to POST to https://api.example.com/tasks
Include optimistic updates and error handling.
EOF

cat > results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/prompts/1.4.txt << 'EOF'
Add undo/redo functionality for all task operations.
Users should be able to undo the last 10 actions.
EOF

cat > results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/prompts/1.5.txt << 'EOF'
The app needs to handle 10,000 tasks. Add:
- Virtual scrolling for the task list
- Search with debouncing
- Bulk operations (select all, delete selected)
- Task counts by status
EOF

# Generate initial architecture diagram
echo "Generating initial architecture diagram..."
if command -v madge &> /dev/null; then
    madge src --image results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/diagrams/0.0-initial.png
else
    echo "Warning: madge not found. Install with: npm install -g madge"
fi

# Initial commit
git add .
git commit -m "Experiment setup - initial clean architecture"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📁 Results directory: results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/"
echo "📝 Prompts available in: results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL/prompts/"
echo ""
echo "Next steps:"
echo "1. Open Cursor"
echo "2. Copy prompt from prompts/1.1.txt"
echo "3. After AI completes, run: ./scripts/after-prompt.sh 1.1"
echo ""