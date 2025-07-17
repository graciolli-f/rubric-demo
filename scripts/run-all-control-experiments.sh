#!/bin/bash
# run-all-control-experiments.sh - Run all control experiments across all models and trials

echo "╔══════════════════════════════════════════════════════╗"
echo "║     RUBRIC DSL - COMPLETE CONTROL EXPERIMENTS         ║"
echo "║                                                        ║"
echo "║  Models: Claude Sonnet 4, GPT-4o, Gemini 2.5          ║"
echo "║  Trials: 1 (Progressive), 2 (Complex), 3 (Stress)     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Configuration
EXPERIMENT_TYPE="control"
MODELS=("sonnet4" "gpt4o" "gemini-2.5")
TRIALS=("1" "2" "3")
BASE_BRANCH="main"  # Change this to your baseline branch

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to setup experiment directories and prompts
setup_experiment() {
    local MODEL=$1
    local TRIAL=$2
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local BRANCH_NAME="${EXPERIMENT_TYPE}-${MODEL}-trial${TRIAL}-${TIMESTAMP}"
    local BASE_DIR="results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL"
    
    echo -e "${BLUE}Setting up: Model=$MODEL, Trial=$TRIAL${NC}"
    
    # Create directory structure
    mkdir -p $BASE_DIR/{complexity,backups,metrics,diagrams,prompts}
    
    # Initialize metrics file
    local STRATEGY=""
    case $TRIAL in
        "1") STRATEGY="progressive" ;;
        "2") STRATEGY="complex-from-start" ;;
        "3") STRATEGY="architectural-stress-test" ;;
    esac
    
    cat > $BASE_DIR/metrics.json << EOF
{
  "experiment": "$EXPERIMENT_TYPE",
  "model": "$MODEL",
  "trial": $TRIAL,
  "strategy": "$STRATEGY",
  "branch": "$BRANCH_NAME",
  "timestamp": "$TIMESTAMP",
  "startTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "prompts": {}
}
EOF
    
    # Create prompts based on trial
    case $TRIAL in
        "1")
            # Trial 1: Progressive prompts
            cat > $BASE_DIR/prompts/1.1.txt << 'EOF'
Add a task description field to the existing task model and display it in the UI.
EOF
            cat > $BASE_DIR/prompts/1.2.txt << 'EOF'
Add logging for all task operations (create, toggle, delete). 
Log to console: "[timestamp] Action: [action] Task: [id]"
EOF
            cat > $BASE_DIR/prompts/1.3.txt << 'EOF'
Add real-time sync - tasks should auto-save to the backend as users type.
Use fetch() to POST to https://api.example.com/tasks
Include optimistic updates and error handling.
EOF
            cat > $BASE_DIR/prompts/1.4.txt << 'EOF'
Add undo/redo functionality for all task operations.
Users should be able to undo the last 10 actions.
EOF
            cat > $BASE_DIR/prompts/1.5.txt << 'EOF'
The app needs to handle 10,000 tasks. Add:
- Virtual scrolling for the task list
- Search with debouncing
- Bulk operations (select all, delete selected)
- Task counts by status
EOF
            ;;
        "2")
            # Trial 2: Complex feature
            cat > $BASE_DIR/prompts/2.1.txt << 'EOF'
Transform this into a collaborative task app:
- Multiple users can edit tasks simultaneously  
- Show who is currently editing each task
- Real-time cursor positions
- Conflict resolution when two users edit the same task
- Use WebSockets: ws://api.example.com/collaborate

Implement this in the existing codebase.
EOF
            ;;
        "3")
            # Trial 3: Stress test
            cat > $BASE_DIR/prompts/3.1.txt << 'EOF'
Add a plugin system that allows third-party developers to:
- Add custom task fields
- Hook into task lifecycle events  
- Add custom UI sections
- Access task data safely

Implement this without breaking existing functionality.
EOF
            cat > $BASE_DIR/prompts/3.2.txt << 'EOF'
The app needs to support multiple storage backends:
- LocalStorage for offline
- REST API for online  
- WebSocket for real-time
- IndexedDB for large datasets

The user can switch between modes. Implement this.
EOF
            ;;
    esac
    
    echo -e "${GREEN}✓ Setup complete for $MODEL Trial $TRIAL${NC}"
}

# Function to run a single experiment
run_single_experiment() {
    local MODEL=$1
    local TRIAL=$2
    local BASE_DIR="results/$EXPERIMENT_TYPE/trial-$TRIAL/$MODEL"
    
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Running: $MODEL - Trial $TRIAL${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════${NC}"
    
    # Create new branch from baseline
    git checkout $BASE_BRANCH
    git checkout -b control-${MODEL}-trial${TRIAL}-$(date +%Y%m%d_%H%M%S)
    
    # Setup experiment
    setup_experiment $MODEL $TRIAL
    
    # Initial commit
    git add .
    git commit -m "Control experiment setup - $MODEL Trial $TRIAL"
    
    # Generate initial architecture diagram
    if command -v madge &> /dev/null; then
        madge src --image $BASE_DIR/diagrams/0.0-initial.png
    fi
    
    # Determine prompts to run based on trial
    local PROMPTS=()
    case $TRIAL in
        "1") PROMPTS=("1.1" "1.2" "1.3" "1.4" "1.5") ;;
        "2") PROMPTS=("2.1") ;;
        "3") PROMPTS=("3.1" "3.2") ;;
    esac
    
    # Run each prompt
    for PROMPT in "${PROMPTS[@]}"; do
        echo ""
        echo -e "${BLUE}Running Prompt $PROMPT${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Show prompt
        echo "📋 Prompt text:"
        cat $BASE_DIR/prompts/$PROMPT.txt
        echo ""
        
        # Model-specific instructions
        echo "🤖 Using $MODEL in Cursor:"
        case $MODEL in
            "sonnet4")
                echo "   Select: Claude 3.5 Sonnet"
                ;;
            "gpt4o")
                echo "   Select: GPT-4o"
                ;;
            "gemini-2.5")
                echo "   Select: Gemini 2.0 Pro"
                ;;
        esac
        echo ""
        
        echo "👉 Steps:"
        echo "1. Copy the prompt to Cursor"
        echo "2. Let AI complete the implementation"
        echo "3. Save the AI response as 'prompt-response.md'"
        echo ""
        
        read -p "Press Enter when complete..."
        
        # Run analysis
        ./scripts/after-prompt.sh $PROMPT
        
        # Quick metrics collection
        echo ""
        echo "📝 Quick assessment:"
        echo -n "Feature complete? (full/partial/failed): "
        read FEATURE_STATUS
        
        # Update metrics
        TEMP_FILE=$(mktemp)
        jq --arg prompt "$PROMPT" \
           --arg status "$FEATURE_STATUS" \
           '.prompts[$prompt].featureComplete = $status' \
           $BASE_DIR/metrics.json > $TEMP_FILE && mv $TEMP_FILE $BASE_DIR/metrics.json
    done
    
    echo -e "${GREEN}✓ Completed $MODEL Trial $TRIAL${NC}"
    
    # Generate final summary
    echo ""
    echo "📊 Trial Summary:"
    jq '.prompts | to_entries | map({prompt: .key, status: .value.featureComplete})' $BASE_DIR/metrics.json
}

# Main execution
echo "This will run ${#MODELS[@]} models × ${#TRIALS[@]} trials = $((${#MODELS[@]} * ${#TRIALS[@]})) experiments"
echo ""
echo "⚠️  IMPORTANT:"
echo "- Ensure you're on a clean baseline branch"
echo "- Each experiment starts fresh from baseline"
echo "- You'll need to manually interact with Cursor for each prompt"
echo ""
read -p "Ready to begin? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Track overall progress
TOTAL_EXPERIMENTS=$((${#MODELS[@]} * ${#TRIALS[@]}))
CURRENT=0

# Run all experiments
for MODEL in "${MODELS[@]}"; do
    for TRIAL in "${TRIALS[@]}"; do
        CURRENT=$((CURRENT + 1))
        echo ""
        echo "┌────────────────────────────────────────┐"
        echo "│  Progress: $CURRENT/$TOTAL_EXPERIMENTS                       │"
        echo "│  Model: $MODEL                      │"
        echo "│  Trial: $TRIAL                              │"
        echo "└────────────────────────────────────────┘"
        
        run_single_experiment $MODEL $TRIAL
        
        # Pause between experiments
        if [ $CURRENT -lt $TOTAL_EXPERIMENTS ]; then
            echo ""
            echo "Ready for next experiment?"
            read -p "Press Enter to continue (or Ctrl+C to stop)..."
        fi
    done
done

# Final summary
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║            ALL CONTROL EXPERIMENTS COMPLETE            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary Report:"
echo ""

# Generate summary across all experiments
for MODEL in "${MODELS[@]}"; do
    echo "=== $MODEL ==="
    for TRIAL in "${TRIALS[@]}"; do
        echo -n "  Trial $TRIAL: "
        if [ -f "results/control/trial-$TRIAL/$MODEL/metrics.json" ]; then
            PROMPTS_COUNT=$(jq '.prompts | length' "results/control/trial-$TRIAL/$MODEL/metrics.json")
            echo "$PROMPTS_COUNT prompts completed"
        else
            echo "Not found"
        fi
    done
    echo ""
done

echo "📁 All results saved in: results/control/"
echo ""
echo "Next steps:"
echo "1. Run complexity analysis across all experiments"
echo "2. Generate architectural diagrams for comparison"
echo "3. Create summary report of architectural decay patterns"
echo "4. Prepare for Rubric constraint experiments"