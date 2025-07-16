export interface ITask {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }
  
  export class TaskModel implements ITask {
    private _id: string;          
    private _title: string;
    private _description: string;       
    private _completed: boolean;  
    
    constructor(id: string, title: string, description: string = '', completed: boolean = false) {
      this._id = id;
      this._title = title;
      this._description = description;
      this._completed = completed;
    }
    
    get id(): string { return this._id; }
    get title(): string { return this._title; }
    get description(): string { return this._description; }
    get completed(): boolean { return this._completed; }
    
    toggle(): TaskModel {
      return new TaskModel(this._id, this._title, this._description, !this._completed);
    }
  }