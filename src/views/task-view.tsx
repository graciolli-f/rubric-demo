import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { taskStore } from '../stores/task-store';
import { SyncStatus, ITask } from '../models/task';
import { VirtualList } from './virtual-list';
import { useDebouncedSearch } from '../hooks/use-debounced-search';

interface EditingState {
  [taskId: string]: {
    title?: boolean;
    description?: boolean;
  };
}

const ITEM_HEIGHT = 120; // Height per task item in pixels
const CONTAINER_HEIGHT = 600; // Height of virtual list container

export const TaskView: React.FC = () => {
  const [tasks, setTasks] = useState(taskStore.getTasks());
  const [allTasks, setAllTasks] = useState(taskStore.getAllTasks());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editing, setEditing] = useState<EditingState>({});
  const [canUndo, setCanUndo] = useState(taskStore.canUndo());
  const [canRedo, setCanRedo] = useState(taskStore.canRedo());
  const [lastOperation, setLastOperation] = useState(taskStore.getLastOperation());
  const [nextRedoOperation, setNextRedoOperation] = useState(taskStore.getNextRedoOperation());
  const [taskCounts, setTaskCounts] = useState(taskStore.taskCounts);
  
  // Search functionality
  const [searchInput, searchQuery, setSearchInput] = useDebouncedSearch('', 300);
  
  // Bulk selection state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const _isValidTitle = (title: string): boolean => {
    return title.trim().length > 0 && title.trim().length < 100;
  };

  // Update search query in store when debounced value changes
  useEffect(() => {
    taskStore.setSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribe = taskStore.subscribe(() => {
      setTasks(taskStore.getTasks());
      setAllTasks(taskStore.getAllTasks());
      setCanUndo(taskStore.canUndo());
      setCanRedo(taskStore.canRedo());
      setLastOperation(taskStore.getLastOperation());
      setNextRedoOperation(taskStore.getNextRedoOperation());
      setTaskCounts(taskStore.taskCounts);
      
      // Clear selection if tasks change
      setSelectedTasks(new Set());
      setSelectAll(false);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      taskStore.cleanup();
    };
  }, []);

  // Handle select all checkbox
  useEffect(() => {
    const filteredTaskIds = new Set(tasks.map(task => task.id));
    const selectedFromFiltered = Array.from(selectedTasks).filter(id => filteredTaskIds.has(id));
    
    if (selectedFromFiltered.length === tasks.length && tasks.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedTasks, tasks]);

  // Keyboard shortcuts
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
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === 'Delete' && selectedTasks.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTasks]);

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

  // Bulk operations
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  };

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedTasks.size > 0) {
      taskStore.bulkDeleteTasks(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
  };

  const handleBulkToggle = () => {
    if (selectedTasks.size > 0) {
      taskStore.bulkToggleTasks(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
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

  // Virtual list item renderer
  const renderTaskItem = useCallback((task: ITask, index: number) => {
    const isSelected = selectedTasks.has(task.id);
    
    return (
      <div style={{ 
        width: '100%',
        padding: '10px',
        borderBottom: '1px solid #eee',
        borderLeft: `4px solid ${getSyncStatusColor(task.syncStatus)}`,
        backgroundColor: isSelected ? '#e3f2fd' : 'white',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        {/* Bulk selection checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => handleTaskSelect(task.id, e.target.checked)}
          style={{ marginTop: '2px' }}
        />
        
        {/* Task content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task.id)}
                style={{ marginRight: '8px' }}
              />
              
              {editing[task.id]?.title ? (
                <input
                  type="text"
                  defaultValue={task.title}
                  style={{
                    fontWeight: 'bold',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    padding: '2px 4px',
                    flex: 1
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
                    cursor: 'pointer',
                    flex: 1
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
                minHeight: '40px',
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
        </div>
      </div>
    );
  }, [editing, selectedTasks]);

  return (
    <div className="task-view" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Task Manager - Handle 10,000+ Tasks</h1>
      
      {/* Task counts */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{taskCounts.total}</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>Total</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{taskCounts.completed}</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>Completed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{taskCounts.synced}</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>Synced</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{taskCounts.pending}</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>Pending</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{taskCounts.syncing}</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>Syncing</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{taskCounts.error}</div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>Errors</div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tasks by title or description..."
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
        />
        {searchQuery && (
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            Found {tasks.length} task{tasks.length !== 1 ? 's' : ''} matching "{searchQuery}"
            <button 
              onClick={() => setSearchInput('')}
              style={{ 
                marginLeft: '8px', 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                cursor: 'pointer' 
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
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

      {/* Bulk operations */}
      {tasks.length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '5px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            Select All ({tasks.length} tasks)
          </label>
          
          {selectedTasks.size > 0 && (
            <>
              <span style={{ color: '#856404' }}>
                {selectedTasks.size} selected
              </span>
              
              <button 
                onClick={handleBulkToggle}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '6px 12px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Toggle Selected
              </button>
              
              <button 
                onClick={handleBulkDelete}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '6px 12px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Delete Selected
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Add new task form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            required
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Task description (optional)..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              resize: 'vertical'
            }}
          />
        </div>
        <button 
          type="submit"
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Add Task
        </button>
      </form>

      {/* Virtual list for tasks */}
      <div>
        <h3>
          Tasks ({tasks.length} {searchQuery ? 'filtered' : 'total'})
          {searchQuery && (
            <span style={{ fontWeight: 'normal', color: '#666' }}>
              {' '}from {taskCounts.total} total
            </span>
          )}
        </h3>
        
        {tasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {searchQuery ? `No tasks found matching "${searchQuery}"` : 'No tasks yet. Add one above!'}
          </div>
        ) : (
          <VirtualList
            items={tasks}
            itemHeight={ITEM_HEIGHT}
            containerHeight={CONTAINER_HEIGHT}
            renderItem={renderTaskItem}
          />
        )}
      </div>
      
      {/* Keyboard shortcuts help */}
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '5px',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        <strong>Keyboard shortcuts:</strong> 
        Ctrl/Cmd+Z (Undo), Ctrl/Cmd+Y (Redo), Ctrl/Cmd+A (Select All), Delete (Delete Selected)
      </div>
    </div>
  );
};