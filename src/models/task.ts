export type SyncStatus = 'synced' | 'syncing' | 'error' | 'pending';

export interface ITask {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    syncStatus?: SyncStatus;
    lastSyncError?: string;
  }
  
  export class TaskModel implements ITask {
    private _id: string;          
    private _title: string;
    private _description: string;       
    private _completed: boolean;
    private _syncStatus: SyncStatus;
    private _lastSyncError?: string;
    
    constructor(
      id: string, 
      title: string, 
      description: string = '', 
      completed: boolean = false,
      syncStatus: SyncStatus = 'pending',
      lastSyncError?: string
    ) {
      this._id = id;
      this._title = title;
      this._description = description;
      this._completed = completed;
      this._syncStatus = syncStatus;
      this._lastSyncError = lastSyncError;
    }
    
    get id(): string { return this._id; }
    get title(): string { return this._title; }
    get description(): string { return this._description; }
    get completed(): boolean { return this._completed; }
    get syncStatus(): SyncStatus { return this._syncStatus; }
    get lastSyncError(): string | undefined { return this._lastSyncError; }
    
    toggle(): TaskModel {
      return new TaskModel(
        this._id, 
        this._title, 
        this._description, 
        !this._completed, 
        'pending'
      );
    }

    updateTitle(title: string): TaskModel {
      return new TaskModel(
        this._id,
        title,
        this._description,
        this._completed,
        'pending'
      );
    }

    updateDescription(description: string): TaskModel {
      return new TaskModel(
        this._id,
        this._title,
        description,
        this._completed,
        'pending'
      );
    }

    withSyncStatus(syncStatus: SyncStatus, error?: string): TaskModel {
      return new TaskModel(
        this._id,
        this._title,
        this._description,
        this._completed,
        syncStatus,
        error
      );
    }
  }