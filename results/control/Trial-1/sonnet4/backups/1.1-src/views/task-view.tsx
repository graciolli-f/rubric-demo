import React, { useState, useEffect } from 'react';
import { taskStore } from '../stores/task-store';

export const TaskView: React.FC = () => {
  const [tasks, setTasks] = useState(taskStore.getTasks());
  const [newTaskTitle, setNewTaskTitle] = useState('');
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
      taskStore.addTask(newTaskTitle.trim(), newTaskDescription.trim());
      setNewTaskTitle('');
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
        <div>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            required
          />
        </div>
        <div>
          <textarea
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Task description (optional)..."
            rows={3}
          />
        </div>
        <button type="submit">Add</button>
      </form>

      <ul>
        {tasks.map(task => (
          <li key={task.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task.id)}
              />
              <span style={{
                textDecoration: task.completed ? 'line-through' : 'none',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {task.title}
              </span>
            </label>
            {task.description && (
              <div style={{
                marginTop: '5px',
                marginLeft: '24px',
                color: '#666',
                fontSize: '14px',
                textDecoration: task.completed ? 'line-through' : 'none'
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