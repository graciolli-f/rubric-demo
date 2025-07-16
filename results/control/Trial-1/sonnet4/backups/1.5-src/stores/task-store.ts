import { TaskModel, ITask, SyncStatus } from '../models/task';
import { 
  ICommand, 
  TaskStoreState, 
  AddTaskCommand, 
  DeleteTaskCommand, 
  ToggleTaskCommand, 
  UpdateTaskTitleCommand, 
  UpdateTaskDescriptionCommand 
} from './commands';

const API_BASE_URL = 'https://api.example.com/tasks';
const AUTO_SAVE_DEBOUNCE_MS = 1000; // 1 second debounce
const MAX_HISTORY_SIZE = 10; // Maximum number of operations to keep for undo

// New: Bulk delete command for handling multiple tasks at once
class BulkDeleteCommand implements ICommand {
  private _taskIds: string[];
  private _deletedTasks: Map<string, TaskModel> = new Map();
  private _store: TaskStore;

  constructor(store: TaskStore, taskIds: string[]) {
    this._store = store;
    this._taskIds = taskIds;
  }

  execute(): void {
    // Store deleted tasks for undo
    this._taskIds.forEach(id => {
      const task = this._store.tasks.get(id);
      if (task) {
        this._deletedTasks.set(id, task);
        this._store.tasks.delete(id);
      }
    });
  }

  undo(): void {
    this._deletedTasks.forEach((task, id) => {
      this._store.tasks.set(id, task);
    });
  }

  getDescription(): string {
    return `Delete ${this._taskIds.length} tasks`;
  }
}

export class TaskStore implements TaskStoreState {
  private _tasks: Map<string, TaskModel> = new Map();     
  private _listeners: Set<() => void> = new Set();       
  private _nextId: number = 1;
  private _autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  // Undo/Redo functionality
  private _history: ICommand[] = [];
  private _redoStack: ICommand[] = [];

  // New: Search and filter state
  private _searchQuery: string = '';
  private _filteredTasks: ITask[] = [];
  private _taskCounts: {
    total: number;
    completed: number;
    pending: number;
    synced: number;
    syncing: number;
    error: number;
  } = {
    total: 0,
    completed: 0,
    pending: 0,
    synced: 0,
    syncing: 0,
    error: 0
  };

  // Expose state for commands
  get tasks(): Map<string, TaskModel> { return this._tasks; }
  get nextId(): number { return this._nextId; }
  set nextId(value: number) { this._nextId = value; }

  // New: Get search query
  get searchQuery(): string { return this._searchQuery; }

  // New: Get task counts
  get taskCounts() { return { ...this._taskCounts }; }

  private _logTaskOperation(action: string, taskId: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Action: ${action} Task: ${taskId}`);
  }

  // Command execution with history management
  private _executeCommand(command: ICommand): void {
    command.execute();
    
    // Add to history and maintain max size
    this._history.push(command);
    if (this._history.length > MAX_HISTORY_SIZE) {
      this._history.shift(); // Remove oldest command
    }
    
    // Clear redo stack when new command is executed
    this._redoStack = [];
    
    this._notifyListeners();
  }

  // Undo/Redo methods
  canUndo(): boolean {
    return this._history.length > 0;
  }

  canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    
    const command = this._history.pop()!;
    command.undo();
    this._redoStack.push(command);
    
    // Maintain max redo stack size
    if (this._redoStack.length > MAX_HISTORY_SIZE) {
      this._redoStack.shift();
    }
    
    this._notifyListeners();
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    
    const command = this._redoStack.pop()!;
    command.execute();
    this._history.push(command);
    
    this._notifyListeners();
    return true;
  }

  getLastOperation(): string | null {
    if (this._history.length === 0) return null;
    return this._history[this._history.length - 1].getDescription();
  }

  getNextRedoOperation(): string | null {
    if (this._redoStack.length === 0) return null;
    return this._redoStack[this._redoStack.length - 1].getDescription();
  }

  // API sync methods
  private async _syncTaskToAPI(task: TaskModel): Promise<void> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update sync status to synced
      const syncedTask = task.withSyncStatus('synced');
      this._tasks.set(task.id, syncedTask);
      this._logTaskOperation('synced', task.id);
      this._notifyListeners();
    } catch (error) {
      console.error('Sync failed:', error);
      // Update sync status to error
      const errorTask = task.withSyncStatus('error', error instanceof Error ? error.message : 'Sync failed');
      this._tasks.set(task.id, errorTask);
      this._logTaskOperation('sync_error', task.id);
      this._notifyListeners();
    }
  }

  private _scheduleAutoSave(taskId: string): void {
    // Clear existing timeout for this task
    const existingTimeout = this._autoSaveTimeouts.get(taskId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new auto-save
    const timeout = setTimeout(() => {
      const task = this._tasks.get(taskId);
      if (task && task.syncStatus === 'pending') {
        this._autoSaveTask(taskId);
      }
      this._autoSaveTimeouts.delete(taskId);
    }, AUTO_SAVE_DEBOUNCE_MS);

    this._autoSaveTimeouts.set(taskId, timeout);
  }

  private async _autoSaveTask(taskId: string): Promise<void> {
    const task = this._tasks.get(taskId);
    if (!task) return;

    // Set syncing status
    const syncingTask = task.withSyncStatus('syncing');
    this._tasks.set(taskId, syncingTask);
    this._logTaskOperation('auto_sync_start', taskId);
    this._notifyListeners();

    await this._syncTaskToAPI(syncingTask);
  }

  addTask(title: string, description: string = ''): ITask {
    const command = new AddTaskCommand(this, title, description);
    this._executeCommand(command);
    
    const taskId = (command as AddTaskCommand).getTaskId();
    this._logTaskOperation('create', taskId);
    
    // Schedule auto-save for new task
    this._scheduleAutoSave(taskId);
    
    return this._tasks.get(taskId)!; 
  }

  updateTaskTitle(id: string, title: string): void {
    const task = this._tasks.get(id);
    if (task && task.title !== title) {
      const command = new UpdateTaskTitleCommand(this, id, title);
      this._executeCommand(command);
      this._logTaskOperation('update_title', id);
      
      // Schedule auto-save
      this._scheduleAutoSave(id);
    }
  }

  updateTaskDescription(id: string, description: string): void {
    const task = this._tasks.get(id);
    if (task && task.description !== description) {
      const command = new UpdateTaskDescriptionCommand(this, id, description);
      this._executeCommand(command);
      this._logTaskOperation('update_description', id);
      
      // Schedule auto-save
      this._scheduleAutoSave(id);
    }
  }

  toggleTask(id: string): void {
    const task = this._tasks.get(id);
    if (task) {
      const command = new ToggleTaskCommand(this, id);
      this._executeCommand(command);
      this._logTaskOperation('toggle', id);
      
      // Schedule auto-save
      this._scheduleAutoSave(id);
    }
  }

  deleteTask(id: string): void {
    if (this._tasks.has(id)) {
      // Clear any pending auto-save
      const existingTimeout = this._autoSaveTimeouts.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this._autoSaveTimeouts.delete(id);
      }
      
      const command = new DeleteTaskCommand(this, id);
      this._executeCommand(command);
      this._logTaskOperation('delete', id);
    }
  }

  // Manual sync for retry functionality
  async retrySyncTask(id: string): Promise<void> {
    const task = this._tasks.get(id);
    if (task && task.syncStatus === 'error') {
      await this._autoSaveTask(id);
    }
  }

  // New: Search functionality with debouncing
  setSearchQuery(query: string): void {
    this._searchQuery = query.toLowerCase().trim();
    this._updateFilteredTasks();
    this._notifyListeners();
  }

  private _updateFilteredTasks(): void {
    const allTasks = Array.from(this._tasks.values()).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      syncStatus: task.syncStatus,
      lastSyncError: task.lastSyncError
    }));

    if (!this._searchQuery) {
      this._filteredTasks = allTasks;
    } else {
      this._filteredTasks = allTasks.filter(task => 
        task.title.toLowerCase().includes(this._searchQuery) ||
        task.description.toLowerCase().includes(this._searchQuery)
      );
    }

    this._updateTaskCounts();
  }

  private _updateTaskCounts(): void {
    const allTasks = Array.from(this._tasks.values());
    
    this._taskCounts = {
      total: allTasks.length,
      completed: allTasks.filter(t => t.completed).length,
      pending: allTasks.filter(t => t.syncStatus === 'pending').length,
      synced: allTasks.filter(t => t.syncStatus === 'synced').length,
      syncing: allTasks.filter(t => t.syncStatus === 'syncing').length,
      error: allTasks.filter(t => t.syncStatus === 'error').length
    };
  }

  // New: Bulk operations
  bulkDeleteTasks(taskIds: string[]): void {
    if (taskIds.length === 0) return;

    // Clear any pending auto-saves for these tasks
    taskIds.forEach(id => {
      const existingTimeout = this._autoSaveTimeouts.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this._autoSaveTimeouts.delete(id);
      }
    });

    const command = new BulkDeleteCommand(this, taskIds);
    this._executeCommand(command);
    this._logTaskOperation('bulk_delete', `${taskIds.length} tasks`);
  }

  bulkToggleTasks(taskIds: string[]): void {
    taskIds.forEach(id => {
      if (this._tasks.has(id)) {
        this.toggleTask(id);
      }
    });
  }

  // Enhanced getTasks to return filtered results
  getTasks(): ITask[] {
    return [...this._filteredTasks];
  }

  // New: Get all tasks (unfiltered) for bulk operations
  getAllTasks(): ITask[] {
    return Array.from(this._tasks.values()).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      syncStatus: task.syncStatus,
      lastSyncError: task.lastSyncError
    }));
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _generateId(): string {
    return `task_${this._nextId++}`;
  }

  private _notifyListeners(): void {
    this._updateFilteredTasks();
    this._listeners.forEach(listener => listener());
  }

  // Cleanup method for component unmount
  cleanup(): void {
    this._autoSaveTimeouts.forEach(timeout => clearTimeout(timeout));
    this._autoSaveTimeouts.clear();
  }
}

export const taskStore = new TaskStore();