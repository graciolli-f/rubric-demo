import { TaskModel, ITask } from '../models/task';

export class TaskStore {
  private _tasks: Map<string, TaskModel> = new Map();     
  private _listeners: Set<() => void> = new Set();       
  private _nextId: number = 1;                           

  addTask(title: string): ITask {
    const task = new TaskModel(
      this._generateId(),  
      title,
      false
    );
    this._tasks.set(task.id, task);
    this._notifyListeners();
    return task; 
  }

  toggleTask(id: string): void {
    const task = this._tasks.get(id);
    if (task) {
      this._tasks.set(id, task.toggle());
      this._notifyListeners();
    }
  }

  getTasks(): ITask[] {
    return Array.from(this._tasks.values()).map(task => ({
      id: task.id,
      title: task.title,
      completed: task.completed
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
}

export const taskStore = new TaskStore();