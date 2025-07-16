# Control Experiment Automation Setup

## Prerequisites

1. **Install madge** (for architecture diagrams):
```bash
npm install -g madge
# or with yarn
yarn global add madge
```

2. **Install graphviz** (required by madge):
```bash
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows (use Chocolatey)
choco install graphviz
```

3. **Ensure you have jq** (for JSON manipulation):
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

## Setup Instructions

1. **Create scripts directory**:
```bash
mkdir -p scripts
```

2. **Copy all scripts to the scripts directory**:
- `setup-experiment.sh`
- `after-prompt.sh`
- `analyze-changes.js`
- `update-metrics.js`
- `show-summary.js`
- `run-experiment.sh`

3. **Make scripts executable**:
```bash
chmod +x scripts/*.sh
```

4. **Ensure you're on a clean branch**:
```bash
git checkout main  # or your base branch
git pull
```

## Running the Experiment

### Option 1: Full Interactive Mode
```bash
./scripts/run-experiment.sh
```
This will guide you through the entire experiment step by step.

### Option 2: Manual Mode

1. **Initial setup**:
```bash
./scripts/setup-experiment.sh
```

2. **For each prompt**:
```bash
# Copy prompt text from results/control/trial-1/sonnet4/prompts/1.X.txt
# Paste into Cursor and wait for completion
# Then run:
./scripts/after-prompt.sh 1.X
```

## What Gets Collected Automatically

1. **Git commits** - After each prompt
2. **Complexity metrics** - Max, average, distribution
3. **Boundary violations** - Cross-layer imports
4. **Private exposures** - Access to _private members
5. **File modifications** - Which files changed
6. **Architecture diagrams** - Visual dependency graphs
7. **Code backups** - Full source snapshots

## What You Must Record Manually

1. **Feature completion** - full/partial/failed
2. **AI behaviors** - Did it examine files first? Follow patterns?
3. **Unusual decisions** - Anything unexpected
4. **Response time** - How long did AI take?

## Output Structure

```
results/control/trial-1/sonnet4/
├── metrics.json          # Main tracking file
├── prompts/             # Prompt texts
│   ├── 1.1.txt
│   └── ...
├── complexity/          # ESLint reports
│   ├── 1.1-complexity.json
│   ├── 1.1-metrics.json
│   └── ...
├── metrics/             # Per-prompt analysis
│   ├── 1.1-analysis.json
│   └── ...
├── diagrams/            # Architecture visualizations
│   ├── 0.0-initial.png
│   ├── 1.1-architecture.png
│   └── ...
└── backups/             # Code snapshots
    ├── 1.1-src/
    └── ...
```

## Troubleshooting

### "madge: command not found"
Install madge globally: `npm install -g madge`

### "Cannot find module complexity-summary.js"
This uses the complexity-summary.js from your earlier setup. Make sure it's in the correct location.

### Git diff shows no changes
Make sure to save all files in your editor before running after-prompt.sh

### Diagrams not generating
Check that both madge and graphviz are installed correctly:
```bash
madge --version
dot -V  # graphviz
```

## Tips

1. **Commit message convention**: The scripts auto-commit with "After prompt X.X"
2. **Branch naming**: Includes timestamp for uniqueness
3. **Incremental analysis**: Each prompt builds on previous data
4. **Manual override**: You can edit metrics.json directly if needed

## Next Steps

After completing the control experiment:
1. Analyze the architecture decay pattern
2. Compare complexity growth rates
3. Document violation patterns
4. Use this baseline for Rubric comparison