import React, { useState, useEffect } from 'react';
import { taskStore } from '../stores/task-store';

export const TaskView: React.FC = () => {
  const [tasks, setTasks] = useState(taskStore.getTasks());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
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
      taskStore.addTask(newTaskTitle.trim());
      setNewTaskTitle('');
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
          </li>
        ))}
      </ul>
    </div>
  );
};