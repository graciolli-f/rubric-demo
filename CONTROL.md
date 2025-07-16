# Act 1 Experiment Protocol: No Constraints (Baseline Chaos)

## Objective
Establish baseline architectural quality when AI agents generate code without any constraints. Document the natural tendencies toward poor architecture across different models and prompt complexities.

## Setup for Each Trial

### 1. Branch Creation
```bash
git checkout baseline
git checkout -b act1-[model]-trial[N]-[timestamp]
# Example: act1-claude-trial1-20240115_143022
```

### 2. Environment Preparation
- Remove any `.rux` files
- Ensure `.cursorrules` contains only: `# No special rules`
- Clear Cursor chat history
- Fresh Cursor window

### 3. Initial State
- Empty `src/` directory with only folder structure:
  ```
  src/
  ├── models/
  ├── stores/
  └── views/
  ```

## Trial Structure

### Trials Per Model: 3
- **Trial 1**: Simple → Complex progression
- **Trial 2**: Complex from start
- **Trial 3**: Mixed complexity

### Models to Test
1. **Claude 3.5 Sonnet** (via Cursor)
2. **GPT-4** (via Cursor)
3. **Gemini** (if available in Cursor)

Total experiments: 9 (3 models × 3 trials)

## Prompt Sequences

### Trial 1: Progressive Complexity

#### Prompt 1.1 (Simple - Control)
```
Create a basic task model with id, title, and completed fields.
```
**Expected**: Should create clean model without issues

#### Prompt 1.2 (Simple - Control)
```
Add a method to toggle the completed status.
```
**Expected**: Should add method to existing model cleanly

#### Prompt 1.3 (Medium Complexity)
```
Create a task management app with:
- Task model (id, title, completed)
- TaskStore for state management
- TaskView React component to display tasks
```
**Expected**: May start mixing concerns, imports between layers

#### Prompt 1.4 (High Complexity - Architectural Stress)
```
Add real-time sync - tasks should auto-save to the backend as users type.
Use a WebSocket connection at ws://api.example.com/sync
```
**Expected**: Likely to add WebSocket code in wrong places

#### Prompt 1.5 (Maximum Complexity)
```
Add the following features:
- Task categories with filtering
- Undo/redo functionality
- Optimistic updates with rollback on sync failure
- Local storage backup when offline
```
**Expected**: Architectural chaos - mixed concerns everywhere

### Trial 2: Complex from Start

#### Prompt 2.1 (Immediate Complexity)
```
Build a real-time collaborative task management app with:
- Multiple users can edit tasks simultaneously
- Changes sync across all connected clients instantly
- Offline support with sync when reconnected
- Optimistic UI updates

Use React for the UI and WebSockets for real-time sync.
```
**Expected**: Likely to create monolithic component with everything mixed

#### Prompt 2.2 (Add Constraints Without Rules)
```
Ensure the app follows these requirements:
- Tasks should never be lost, even if connection fails
- UI should never freeze during sync operations
- Support undo/redo for all operations
- Show who is currently editing each task
```
**Expected**: More complexity stuffed into existing files

### Trial 3: Mixed Complexity

#### Prompt 3.1 (Simple - Control)
```
Create a function to validate task titles (not empty, max 100 chars).
```
**Expected**: Should be simple, but note WHERE it puts this

#### Prompt 3.2 (Architectural Decision Point)
```
Add a task priority system (low, medium, high) with visual indicators.
Where should the priority logic live?
```
**Expected**: Interesting to see if AI explains its architectural choice

#### Prompt 3.3 (Integration Complexity)
```
Integrate with an external API:
- POST /api/tasks to create
- PUT /api/tasks/:id to update
- GET /api/tasks to fetch all
- Handle errors gracefully
```
**Expected**: API calls likely scattered across components

#### Prompt 3.4 (Performance Concern)
```
Users complain the app is slow with 1000+ tasks. Add:
- Virtual scrolling for the task list
- Debounced search
- Lazy loading of task details
```
**Expected**: Performance code mixed with business logic

## Data Collection

### For Each Prompt Response:

1. **Screenshot Requirements**
   - File structure after implementation
   - Any particularly egregious code examples
   - Import statements showing coupling

2. **Code Metrics to Capture**
   ```bash
   # After each prompt, run:
   find src -name "*.ts" -o -name "*.tsx" | xargs wc -l > metrics/act1-[model]-trial[N]-prompt[X]-loc.txt
   
   # Count imports crossing boundaries
   grep -r "import.*from.*\.\./\.\." src/ > metrics/act1-[model]-trial[N]-prompt[X]-imports.txt
   ```

3. **Architectural Violations to Note**
   - [ ] API calls in components
   - [ ] Business logic in views
   - [ ] State management in models
   - [ ] Direct DOM manipulation in stores
   - [ ] Circular dependencies
   - [ ] God objects/components
   - [ ] Mixed sync/async patterns
   - [ ] No error boundaries

4. **AI Behavior Observations**
   - Does it explain architectural decisions?
   - Does it express uncertainty about where to put code?
   - Does it mention best practices but ignore them?
   - Does it refactor previous code or just add more?

### After Each Trial:

1. **Final State Analysis**
   ```bash
   # Generate dependency graph (if you have madge installed)
   npx madge --circular --image deps.png src/
   
   # Count total files
   find src -type f -name "*.ts" -o -name "*.tsx" | wc -l
   
   # Measure file sizes
   find src -type f -exec wc -l {} \; | sort -n
   ```

2. **Commit and Tag**
   ```bash
   git add .
   git commit -m "Act 1: [Model] Trial [N] - Final state"
   git tag act1-[model]-trial[N]-complete
   ```

## Key Architectural Smells to Document

### 1. **Mixed Concerns**
- Rendering logic in stores
- API calls in components
- Business rules in views

### 2. **Poor Encapsulation**
- Public members that should be private
- Leaky abstractions
- Direct state manipulation

### 3. **Coupling Issues**
- Circular dependencies
- Deep import paths
- Tight coupling between unrelated modules

### 4. **Scaling Problems**
- Everything in one file
- No clear module boundaries
- Hardcoded values throughout

## Comparison Points

After all Act 1 trials, create comparison table:

| Model | Trial | Total Files | Largest File (LOC) | Cross-boundary Imports | API calls in Views | Mixed Concerns |
|-------|-------|------------|-------------------|---------------------|-------------------|----------------|
| Claude | 1 | ? | ? | ? | Yes/No | High/Med/Low |
| Claude | 2 | ? | ? | ? | Yes/No | High/Med/Low |
| ... | ... | ... | ... | ... | ... | ... |

## Success Criteria

Act 1 is successful if we can demonstrate:
1. **Consistent** architectural problems across models
2. **Predictable** degradation as complexity increases
3. **Quantifiable** metrics showing poor structure
4. **Visual** evidence of tangled dependencies

## Notes

- If AI creates directories/structure on its own, document it
- If AI mentions architectural concerns but ignores them, screenshot
- Keep same system prompt for all trials within a model
- Note any model-specific tendencies (e.g., Claude more verbose, GPT more concise)