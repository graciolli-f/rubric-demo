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
git checkout -b act1-[model]-trial[N]-[timestamp]
# Example: act1-claude-trial1-20240115_143022
```

### 2. Environment Preparation
- Ensure NO `.rux` files exist
- NO `.cursorrules` 
- Clear Cursor chat history
- Open the existing codebase in Cursor

### 3. Capture Initial State
```bash
# Document the clean starting point
git add .
git commit -m "Act 1: Starting with clean architecture"
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

2. **Violation Checklist**
   - [ ] Added imports that cross architectural boundaries
   - [ ] Modified private members from outside the class
   - [ ] Added API calls in view components
   - [ ] Put UI logic in the store
   - [ ] Mixed business logic with infrastructure
   - [ ] Created circular dependencies
   - [ ] Broke single responsibility principle
   - [ ] Ignored existing patterns

3. **Code Metrics**
   ```bash
   # File sizes (watch for bloat)
   find src -name "*.ts" -o -name "*.tsx" | xargs wc -l
   
   # Count cross-boundary imports
   grep -r "import.*from.*\.\./\.\." src/
   
   # Find direct private member access
   grep -r "_[a-zA-Z]" src/ | grep -v "this\._"
   
   # Find API calls outside stores
   grep -r "fetch\|websocket\|ws://" src/views/
   ```

4. **Screenshot Evidence**
   - Most egregious code additions
   - File structure if new files added
   - Any comments where AI acknowledges but ignores architecture

### Specific Anti-Patterns to Document:

1. **Store Violations**
   ```typescript
   // Watch for console.log in stores
   console.log("Task added:", task);  // Was this avoided?
   
   // Watch for React imports in stores
   import { useState } from 'react';  // Big violation
   ```

2. **View Violations**
   ```typescript
   // Watch for direct API calls
   fetch('/api/tasks', { method: 'POST', body: ... })
   
   // Watch for business logic
   if (task.priority === 'high' && task.dueDate < today) { ... }
   ```

3. **Model Violations**
   ```typescript
   // Watch for external dependencies
   import { api } from '../services/api';
   
   // Watch for side effects
   save() { localStorage.setItem(...) }  // Models should be pure
   ```

4. **Encapsulation Violations**
   ```typescript
   // Watch for accessing private members
   store._tasks.set(id, task);  // Should use public API
   
   // Watch for exposing internals
   get tasks() { return this._tasks; }  // Exposing internal Map
   ```

## Comparison Analysis

After all Act 1 trials complete:

### 1. Architecture Degradation Timeline
For each trial, create a timeline:
- Starting point: Clean architecture
- After prompt 1: What degraded?
- After prompt 2: What further degraded?
- Final state: How bad did it get?

### 2. Model Behavioral Differences
| Behavior | Claude | GPT-4 | Gemini |
|----------|---------|--------|---------|
| Respects private members | ?% | ?% | ?% |
| Keeps API calls in stores | ?% | ?% | ?% |
| Maintains separation | ?% | ?% | ?% |
| File bloat tendency | High/Med/Low | ? | ? |

### 3. Common Violation Patterns
1. Most common violation: ___________
2. Most destructive change: __________
3. Fastest degradation: _____________

## Success Criteria

Act 1 is successful if we demonstrate:
1. **Clean architecture degrades** without constraints
2. **Private members get violated** when convenient
3. **Separation of concerns breaks down** under pressure
4. **Different models show similar** anti-patterns

## Key Evidence to Capture

The "money shots" for Act 1:
1. **API calls appearing in view components**
2. **Private member access from outside classes**
3. **Business logic creeping into models**
4. **Store importing React**
5. **Circular dependencies emerging**

## Notes

- Always start each trial from the same clean baseline
- Let AI complete each change before giving next prompt
- Don't guide or correct the AI
- Document any comments where AI "knows better" but does it anyway