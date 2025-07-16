import { TaskModel } from '../models/task';

export interface ICommand {
  execute(): void;
  undo(): void;
  getDescription(): string;
}

export interface TaskStoreState {
  tasks: Map<string, TaskModel>;
  nextId: number;
}

export abstract class TaskCommand implements ICommand {
  protected store: TaskStoreState;
  
  constructor(store: TaskStoreState) {
    this.store = store;
  }
  
  abstract execute(): void;
  abstract undo(): void;
  abstract getDescription(): string;
}

export class AddTaskCommand extends TaskCommand {
  private task: TaskModel;
  
  constructor(store: TaskStoreState, title: string, description: string = '') {
    super(store);
    this.task = new TaskModel(
      `task_${store.nextId}`,
      title,
      description,
      false,
      'pending'
    );
  }
  
  execute(): void {
    this.store.tasks.set(this.task.id, this.task);
    this.store.nextId++;
  }
  
  undo(): void {
    this.store.tasks.delete(this.task.id);
    this.store.nextId--;
  }
  
  getDescription(): string {
    return `Add task: ${this.task.title}`;
  }
  
  getTaskId(): string {
    return this.task.id;
  }
}

export class DeleteTaskCommand extends TaskCommand {
  private taskId: string;
  private deletedTask: TaskModel | null = null;
  
  constructor(store: TaskStoreState, taskId: string) {
    super(store);
    this.taskId = taskId;
  }
  
  execute(): void {
    this.deletedTask = this.store.tasks.get(this.taskId) || null;
    this.store.tasks.delete(this.taskId);
  }
  
  undo(): void {
    if (this.deletedTask) {
      this.store.tasks.set(this.taskId, this.deletedTask);
    }
  }
  
  getDescription(): string {
    return `Delete task: ${this.deletedTask?.title || this.taskId}`;
  }
}

export class ToggleTaskCommand extends TaskCommand {
  private taskId: string;
  private originalTask: TaskModel | null = null;
  
  constructor(store: TaskStoreState, taskId: string) {
    super(store);
    this.taskId = taskId;
  }
  
  execute(): void {
    this.originalTask = this.store.tasks.get(this.taskId) || null;
    if (this.originalTask) {
      const toggledTask = this.originalTask.toggle();
      this.store.tasks.set(this.taskId, toggledTask);
    }
  }
  
  undo(): void {
    if (this.originalTask) {
      this.store.tasks.set(this.taskId, this.originalTask);
    }
  }
  
  getDescription(): string {
    const action = this.originalTask?.completed ? 'Mark incomplete' : 'Mark complete';
    return `${action}: ${this.originalTask?.title || this.taskId}`;
  }
}

export class UpdateTaskTitleCommand extends TaskCommand {
  private taskId: string;
  private newTitle: string;
  private originalTask: TaskModel | null = null;
  
  constructor(store: TaskStoreState, taskId: string, newTitle: string) {
    super(store);
    this.taskId = taskId;
    this.newTitle = newTitle;
  }
  
  execute(): void {
    this.originalTask = this.store.tasks.get(this.taskId) || null;
    if (this.originalTask) {
      const updatedTask = this.originalTask.updateTitle(this.newTitle);
      this.store.tasks.set(this.taskId, updatedTask);
    }
  }
  
  undo(): void {
    if (this.originalTask) {
      this.store.tasks.set(this.taskId, this.originalTask);
    }
  }
  
  getDescription(): string {
    return `Update title: ${this.originalTask?.title || this.taskId} → ${this.newTitle}`;
  }
}

export class UpdateTaskDescriptionCommand extends TaskCommand {
  private taskId: string;
  private newDescription: string;
  private originalTask: TaskModel | null = null;
  
  constructor(store: TaskStoreState, taskId: string, newDescription: string) {
    super(store);
    this.taskId = taskId;
    this.newDescription = newDescription;
  }
  
  execute(): void {
    this.originalTask = this.store.tasks.get(this.taskId) || null;
    if (this.originalTask) {
      const updatedTask = this.originalTask.updateDescription(this.newDescription);
      this.store.tasks.set(this.taskId, updatedTask);
    }
  }
  
  undo(): void {
    if (this.originalTask) {
      this.store.tasks.set(this.taskId, this.originalTask);
    }
  }
  
  getDescription(): string {
    return `Update description: ${this.originalTask?.title || this.taskId}`;
  }
} 