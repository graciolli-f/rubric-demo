import React, { useState, useEffect } from 'react';
import { taskStore } from '../stores/task-store';
import { SyncStatus } from '../models/task';

interface EditingState {
  [taskId: string]: {
    title?: boolean;
    description?: boolean;
  };
}

export const TaskView: React.FC = () => {
  const [tasks, setTasks] = useState(taskStore.getTasks());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editing, setEditing] = useState<EditingState>({});
  const [canUndo, setCanUndo] = useState(taskStore.canUndo());
  const [canRedo, setCanRedo] = useState(taskStore.canRedo());
  const [lastOperation, setLastOperation] = useState(taskStore.getLastOperation());
  const [nextRedoOperation, setNextRedoOperation] = useState(taskStore.getNextRedoOperation());
  
  const _isValidTitle = (title: string): boolean => {
    return title.trim().length > 0 && title.trim().length < 100;
  };

  useEffect(() => {
    const unsubscribe = taskStore.subscribe(() => {
      setTasks(taskStore.getTasks());
      setCanUndo(taskStore.canUndo());
      setCanRedo(taskStore.canRedo());
      setLastOperation(taskStore.getLastOperation());
      setNextRedoOperation(taskStore.getNextRedoOperation());
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      taskStore.cleanup();
    };
  }, []);

  // Separate useEffect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (taskStore.canUndo()) {
          taskStore.undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (taskStore.canRedo()) {
          taskStore.redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const handleDelete = (id: string) => {
    taskStore.deleteTask(id);
  };

  const handleTitleEdit = (id: string, newTitle: string) => {
    if (_isValidTitle(newTitle)) {
      taskStore.updateTaskTitle(id, newTitle);
    }
  };

  const handleDescriptionEdit = (id: string, newDescription: string) => {
    taskStore.updateTaskDescription(id, newDescription);
  };

  const handleRetrySync = (id: string) => {
    taskStore.retrySyncTask(id);
  };

  const handleUndo = () => {
    taskStore.undo();
  };

  const handleRedo = () => {
    taskStore.redo();
  };

  const startEditing = (taskId: string, field: 'title' | 'description') => {
    setEditing(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: true
      }
    }));
  };

  const stopEditing = (taskId: string, field: 'title' | 'description') => {
    setEditing(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: false
      }
    }));
  };

  const getSyncStatusIcon = (syncStatus?: SyncStatus): string => {
    switch (syncStatus) {
      case 'synced': return '✅';
      case 'syncing': return '🔄';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const getSyncStatusColor = (syncStatus?: SyncStatus): string => {
    switch (syncStatus) {
      case 'synced': return '#28a745';
      case 'syncing': return '#007bff';
      case 'error': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#ffc107';
    }
  };

  return (
    <div className="task-view">
      <h1>Tasks</h1>
      
      {/* Undo/Redo Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <button 
          onClick={handleUndo}
          disabled={!canUndo}
          style={{
            backgroundColor: canUndo ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: canUndo ? 'pointer' : 'not-allowed'
          }}
          title={lastOperation ? `Undo: ${lastOperation}` : 'Nothing to undo'}
        >
          ↶ Undo
        </button>
        
        <button 
          onClick={handleRedo}
          disabled={!canRedo}
          style={{
            backgroundColor: canRedo ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: canRedo ? 'pointer' : 'not-allowed'
          }}
          title={nextRedoOperation ? `Redo: ${nextRedoOperation}` : 'Nothing to redo'}
        >
          ↷ Redo
        </button>
        
        {lastOperation && (
          <span style={{ fontSize: '12px', color: '#6c757d' }}>
            Last: {lastOperation}
          </span>
        )}
      </div>
      
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
          <li key={task.id} style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            borderLeft: `4px solid ${getSyncStatusColor(task.syncStatus)}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <label style={{ flex: 1 }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task.id)}
                />
                
                {editing[task.id]?.title ? (
                  <input
                    type="text"
                    defaultValue={task.title}
                    style={{
                      marginLeft: '8px',
                      fontWeight: 'bold',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      padding: '2px 4px'
                    }}
                    onBlur={(e) => {
                      handleTitleEdit(task.id, e.target.value);
                      stopEditing(task.id, 'title');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTitleEdit(task.id, e.currentTarget.value);
                        stopEditing(task.id, 'title');
                      } else if (e.key === 'Escape') {
                        stopEditing(task.id, 'title');
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span 
                    style={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      fontWeight: 'bold',
                      marginLeft: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => startEditing(task.id, 'title')}
                    title="Click to edit"
                  >
                    {task.title}
                  </span>
                )}
              </label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{ 
                    fontSize: '16px',
                    cursor: task.syncStatus === 'error' ? 'pointer' : 'default'
                  }}
                  title={task.syncStatus === 'error' ? `Error: ${task.lastSyncError}. Click to retry.` : `Status: ${task.syncStatus}`}
                  onClick={() => task.syncStatus === 'error' && handleRetrySync(task.id)}
                >
                  {getSyncStatusIcon(task.syncStatus)}
                </span>
                
                <button 
                  onClick={() => handleDelete(task.id)}
                  style={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            
            {editing[task.id]?.description ? (
              <textarea
                defaultValue={task.description}
                style={{
                  marginTop: '5px',
                  marginLeft: '24px',
                  width: 'calc(100% - 24px)',
                  minHeight: '60px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  padding: '4px'
                }}
                onBlur={(e) => {
                  handleDescriptionEdit(task.id, e.target.value);
                  stopEditing(task.id, 'description');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    stopEditing(task.id, 'description');
                  } else if (e.key === 'Enter' && e.ctrlKey) {
                    handleDescriptionEdit(task.id, e.currentTarget.value);
                    stopEditing(task.id, 'description');
                  }
                }}
                autoFocus
              />
            ) : (
              task.description && (
                <div 
                  style={{
                    marginTop: '5px',
                    marginLeft: '24px',
                    color: '#666',
                    fontSize: '14px',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    backgroundColor: '#f8f9fa'
                  }}
                  onClick={() => startEditing(task.id, 'description')}
                  title="Click to edit"
                >
                  {task.description}
                </div>
              )
            )}
            
            {!task.description && !editing[task.id]?.description && (
              <div 
                style={{
                  marginTop: '5px',
                  marginLeft: '24px',
                  color: '#999',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
                onClick={() => startEditing(task.id, 'description')}
                title="Click to add description"
              >
                + Add description
              </div>
            )}

            {task.syncStatus === 'error' && (
              <div style={{
                marginTop: '5px',
                marginLeft: '24px',
                color: '#dc3545',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>
                Sync failed: {task.lastSyncError}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};