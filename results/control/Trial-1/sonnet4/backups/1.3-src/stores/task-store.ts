import { TaskModel, ITask, SyncStatus } from '../models/task';

const API_BASE_URL = 'https://api.example.com/tasks';
const AUTO_SAVE_DEBOUNCE_MS = 1000; // 1 second debounce

export class TaskStore {
  private _tasks: Map<string, TaskModel> = new Map();     
  private _listeners: Set<() => void> = new Set();       
  private _nextId: number = 1;
  private _autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private _logTaskOperation(action: string, taskId: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Action: ${action} Task: ${taskId}`);
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
    const task = new TaskModel(
      this._generateId(),  
      title,
      description,
      false,
      'pending' // Start as pending sync
    );
    this._tasks.set(task.id, task);
    this._logTaskOperation('create', task.id);
    this._notifyListeners();
    
    // Schedule auto-save for new task
    this._scheduleAutoSave(task.id);
    
    return task; 
  }

  updateTaskTitle(id: string, title: string): void {
    const task = this._tasks.get(id);
    if (task && task.title !== title) {
      const updatedTask = task.updateTitle(title);
      this._tasks.set(id, updatedTask);
      this._logTaskOperation('update_title', id);
      this._notifyListeners();
      
      // Schedule auto-save
      this._scheduleAutoSave(id);
    }
  }

  updateTaskDescription(id: string, description: string): void {
    const task = this._tasks.get(id);
    if (task && task.description !== description) {
      const updatedTask = task.updateDescription(description);
      this._tasks.set(id, updatedTask);
      this._logTaskOperation('update_description', id);
      this._notifyListeners();
      
      // Schedule auto-save
      this._scheduleAutoSave(id);
    }
  }

  toggleTask(id: string): void {
    const task = this._tasks.get(id);
    if (task) {
      const toggledTask = task.toggle();
      this._tasks.set(id, toggledTask);
      this._logTaskOperation('toggle', id);
      this._notifyListeners();
      
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
      
      this._tasks.delete(id);
      this._logTaskOperation('delete', id);
      this._notifyListeners();
    }
  }

  // Manual sync for retry functionality
  async retrySyncTask(id: string): Promise<void> {
    const task = this._tasks.get(id);
    if (task && task.syncStatus === 'error') {
      await this._autoSaveTask(id);
    }
  }

  getTasks(): ITask[] {
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
    this._listeners.forEach(listener => listener());
  }

  // Cleanup method for component unmount
  cleanup(): void {
    this._autoSaveTimeouts.forEach(timeout => clearTimeout(timeout));
    this._autoSaveTimeouts.clear();
  }
}

export const taskStore = new TaskStore();