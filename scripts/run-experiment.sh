#!/bin/bash
# run-experiment.sh - Main experiment runner

echo "╔══════════════════════════════════════════╗"
echo "║   RUBRIC DSL CONTROL EXPERIMENT          ║"
echo "║   Model: Sonnet 4, Trial: 1              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check if already set up
if [ ! -d "results/control/trial-1/sonnet4" ]; then
    echo "Running initial setup..."
    ./scripts/setup-experiment.sh
    echo ""
fi

BASE_DIR="results/control/trial-1/sonnet4"

# Function to run a prompt
run_prompt() {
    local PROMPT_NUM=$1
    
    echo ""
    echo "════════════════════════════════════════════"
    echo "PROMPT $PROMPT_NUM"
    echo "════════════════════════════════════════════"
    echo ""
    
    # Show the prompt
    echo "📋 Prompt text:"
    echo "---"
    cat $BASE_DIR/prompts/$PROMPT_NUM.txt
    echo "---"
    echo ""
    
    echo "👉 Steps:"
    echo "1. Copy the above prompt to Cursor"
    echo "2. Let AI complete the implementation"
    echo "3. Note any interesting behaviors"
    echo ""
    
    read -p "Press Enter when AI has completed the changes..."
    
    # Ask about saving response
    echo ""
    echo "💡 Did you export the AI response from Cursor?"
    echo "   (Click ⋮ in chat → Export → Save as 'prompt-response.md')"
    read -p "Press Enter when saved (or skip)..."
    
    # Run analysis
    echo ""
    ./scripts/after-prompt.sh $PROMPT_NUM
    
    # Manual observations
    echo ""
    echo "📝 Please record your observations:"
    echo "1. Was the feature complete? (full/partial/failed)"
    read -p "> " FEATURE_STATUS
    
    echo "2. Any notable AI behaviors?"
    read -p "> " AI_NOTES
    
    # Update metrics with manual observations
    TEMP_FILE=$(mktemp)
    jq --arg prompt "$PROMPT_NUM" \
       --arg status "$FEATURE_STATUS" \
       --arg notes "$AI_NOTES" \
       '.prompts[$prompt].featureComplete = $status | .prompts[$prompt].notes = $notes' \
       $BASE_DIR/metrics.json > $TEMP_FILE && mv $TEMP_FILE $BASE_DIR/metrics.json
    
    echo ""
    read -p "Ready to continue? Press Enter..."
}

# Main experiment loop
echo "Starting experiment..."
echo ""

# Show initial architecture
echo "📊 Initial architecture diagram available at:"
echo "   $BASE_DIR/diagrams/0.0-initial.png"
echo ""

read -p "Ready to begin? Press Enter..."

# Run each prompt
for i in 1 2 3 4 5; do
    run_prompt "1.$i"
done

# Generate final report
echo ""
echo "════════════════════════════════════════════"
echo "EXPERIMENT COMPLETE"
echo "════════════════════════════════════════════"
echo ""

# Show final summary
echo "📊 Final Statistics:"
jq '.summary' $BASE_DIR/metrics.json

echo ""
echo "📁 All results saved in: $BASE_DIR"
echo ""
echo "📈 Key outputs:"
echo "- Metrics summary: $BASE_DIR/metrics.json"
echo "- Architecture evolution: $BASE_DIR/diagrams/"
echo "- Complexity reports: $BASE_DIR/complexity/"
echo "- Code backups: $BASE_DIR/backups/"
echo ""
echo "✅ Experiment complete!"