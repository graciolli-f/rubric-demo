# Control Experiment Protocol: No Constraints & No Rules (Baseline)

## Objective
Document how AI agents modify a well-architected codebase when given feature requests WITHOUT any constraints. We start with clean architecture and observe how it progresses.

## Starting Codebase

Each trial begins with the **same clean codebase**:
```
src/
├── models/
│   └── task.ts         # Pure model with private members
├── stores/
│   └── task-store.ts   # State management with clear API
├── views/
│   └── task-view.tsx   # React component
└── app.tsx            # Simple entry point
```

This codebase already has:
- Clean separation of concerns
- Private members (with `_` prefix)
- Clear public APIs
- Proper imports structure

## Setup for Each Trial

### 1. Branch Creation
```bash
git checkout baseline
git checkout -b control-[model]-trial[N]-[timestamp]
# Example: act1-claude-trial1-20240115_143022
```

### 2. Environment Preparation
- Ensure NO `.rux` files exist
- NO .cursorrules
- Clear Cursor chat history
- Open the existing codebase in Cursor

### 3. Capture Initial State
```bash
# Document the clean starting point
git add .
git commit -m "Set up control baseline"
```

## Trial Structure

### Trials Per Model: 3
- **Trial 1**: Progressive feature additions
- **Trial 2**: Complex feature from start
- **Trial 3**: Architectural stress test

### Models to Test
1. **Claude 4 Sonnet (thinking)** (via Cursor)
2. **GPT-4o** (via Cursor)
3. **Gemini 2.5 Pro (thinking)** (via Cursor)

Total experiments: 9 (3 models × 3 trials)

## Prompt Sequences

### Trial 1: Progressive Feature Additions

#### Prompt 1.1 (Simple Addition)
```
Add a task description field to the existing task model and display it in the UI.
```
**Watch for**: 
- Does it maintain private `_description`?
- Does it update interfaces properly?
- Does it respect existing patterns?

#### Prompt 1.2 (Cross-Cutting Concern)
```
Add logging for all task operations (create, toggle, delete). 
Log to console: "[timestamp] Action: [action] Task: [id]"
```
**Watch for**: 
- WHERE does it add console.log statements?
- Does it violate the store's "no console" principle?
- Does it centralize or scatter logging?

#### Prompt 1.3 (External Integration)
```
Add real-time sync - tasks should auto-save to the backend as users type.
Use fetch() to POST to https://api.example.com/tasks
Include optimistic updates and error handling.
```
**Watch for**:
- WHERE does the fetch() code go?
- Does it add API calls directly in components?
- How does it handle the store-api boundary?

#### Prompt 1.4 (State Complexity)
```
Add undo/redo functionality for all task operations.
Users should be able to undo the last 10 actions.
```
**Watch for**:
- Does it modify private store state directly?
- Where does the undo stack live?
- Does it break existing encapsulation?

#### Prompt 1.5 (Performance + Features)
```
The app needs to handle 10,000 tasks. Add:
- Virtual scrolling for the task list
- Search with debouncing
- Bulk operations (select all, delete selected)
- Task counts by status
```
**Watch for**:
- Does performance code get mixed with business logic?
- Are concerns properly separated?
- File size explosion?

### Trial 2: Complex Feature from Start

#### Prompt 2.1 (Major Feature Addition)
```
Transform this into a collaborative task app:
- Multiple users can edit tasks simultaneously  
- Show who is currently editing each task
- Real-time cursor positions
- Conflict resolution when two users edit the same task
- Use WebSockets: ws://api.example.com/collaborate

Implement this in the existing codebase.
```
**Watch for**:
- Massive changes to existing clean architecture
- WebSocket code placement
- How it modifies the simple store pattern
- Whether it respects private members

### Trial 3: Architectural Stress Test

#### Prompt 3.1 (Plugin System)
```
Add a plugin system that allows third-party developers to:
- Add custom task fields
- Hook into task lifecycle events  
- Add custom UI sections
- Access task data safely

Implement this without breaking existing functionality.
```
**Watch for**:
- Does it expose private members?
- How does it modify the closed models?
- Where does plugin logic live?

#### Prompt 3.2 (Multi-Storage Backend)
```
The app needs to support multiple storage backends:
- LocalStorage for offline
- REST API for online  
- WebSocket for real-time
- IndexedDB for large datasets

The user can switch between modes. Implement this.
```
**Watch for**:
- Complete destruction of simple store pattern
- Mixing of storage concerns throughout codebase
- Violation of single responsibility

## Data Collection

### After Each Prompt:

1. **Immediate Commit**
   ```bash
   git add .
   git commit -m "After: [prompt description]"
   ```

2. **Vio