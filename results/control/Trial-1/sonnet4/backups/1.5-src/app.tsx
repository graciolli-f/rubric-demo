import React from 'react';
import { TaskView } from './views/task-view';

// Import sample data utilities for development testing
import './utils/populate-sample-data';

export const App: React.FC = () => {
  return (
    <TaskView />
  );
};