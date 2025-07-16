export interface ITask {
    id: string;
    title: string;
    // Added description field to support more detailed task information
    description: string;
    completed: boolean;
  }
  
  export class TaskModel implements ITask {
    private _id: string;          
    private _title: string;       
    // Added private description field to store task details
    private _description: string;
    private _completed: boolean;  
    
    // Updated constructor to accept description parameter
    constructor(id: string, title: string, description: string = '', completed: boolean = false) {
      this._id = id;
      this._title = title;
      this._description = description;
      this._completed = completed;
    }
    
    get id(): string { return this._id; }
    get title(): string { return this._title; }
    // Added getter for description field
    get description(): string { return this._description; }
    get completed(): boolean { return this._completed; }
    
    // Updated toggle method to preserve description when creating new instance
    toggle(): TaskModel {
      return new TaskModel(this._id, this._title, this._description, !this._completed);
    }
  }