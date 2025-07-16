import React, { useState, useEffect } from 'react';
import { taskStore } from '../stores/task-store';

export const TaskView: React.FC = () => {
  const [tasks, setTasks] = useState(taskStore.getTasks());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  // Added state for task description input
  const [newTaskDescription, setNewTaskDescription] = useState('');
  
  const _isValidTitle = (title: string): boolean => {
    return title.trim().length > 0 && title.trim().length < 100;
  };

  useEffect(() => {
    return taskStore.subscribe(() => {
      setTasks(taskStore.getTasks());
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (_isValidTitle(newTaskTitle)) {
      // Updated to pass description when adding task
      taskStore.addTask(newTaskTitle.trim(), newTaskDescription.trim());
      setNewTaskTitle('');
      // Clear description input after adding task
      setNewTaskDescription('');
    }
  };

  const handleToggle = (id: string) => {
    taskStore.toggleTask(id);
  };

  return (
    <div className="task-view">
      <h1>Tasks</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
        />
        {/* Added description input field for more detailed task information */}
        <input
          type="text"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          placeholder="Task description (optional)..."
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task.id)}
              />
              <span style={{
                textDecoration: task.completed ? 'line-through' : 'none'
              }}>
                {task.title}
              </span>
            </label>
            {/* Display task description below title when description exists */}
            {task.description && (
              <div style={{
                marginLeft: '20px',
                fontSize: '0.9em',
                color: '#666',
                fontStyle: 'italic'
              }}>
                {task.description}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};