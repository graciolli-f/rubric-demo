import { taskStore } from '../stores/task-store';
import { SyncStatus } from '../models/task';

const sampleTitles = [
  'Review project requirements',
  'Update documentation',
  'Fix login bug',
  'Implement user authentication',
  'Design new dashboard',
  'Optimize database queries',
  'Write unit tests',
  'Conduct code review',
  'Deploy to staging',
  'Update dependencies',
  'Refactor legacy code',
  'Create API endpoints',
  'Implement search feature',
  'Add error handling',
  'Improve performance',
  'Setup CI/CD pipeline',
  'Configure monitoring',
  'Update UI components',
  'Add data validation',
  'Implement caching',
  'Create user manual',
  'Fix responsive design',
  'Add analytics tracking',
  'Implement pagination',
  'Setup backup system',
  'Optimize images',
  'Add keyboard shortcuts',
  'Implement dark mode',
  'Create admin panel',
  'Add export feature'
];

const sampleDescriptions = [
  'This task requires careful attention to detail and thorough testing.',
  'Make sure to follow the coding standards and best practices.',
  'Consider the impact on existing functionality.',
  'Coordinate with the design team for UI specifications.',
  'Review the technical requirements before implementation.',
  'Test on multiple browsers and devices.',
  'Update the documentation after completion.',
  'Consider performance implications.',
  'Ensure backward compatibility.',
  'Follow security best practices.',
  '',
  'This is a high priority item.',
  'Low priority - can be done later.',
  'Needs approval from stakeholders.',
  'Complex task that may require multiple iterations.'
];

const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomSyncStatus = (): SyncStatus => {
  const statuses: SyncStatus[] = ['synced', 'syncing', 'error', 'pending'];
  const weights = [0.6, 0.1, 0.1, 0.2]; // 60% synced, 10% syncing, 10% error, 20% pending
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return statuses[i];
    }
  }
  
  return 'pending';
};

export function populateSampleData(count: number = 100): void {
  console.log(`Adding ${count} sample tasks...`);
  
  const startTime = performance.now();
  
  for (let i = 0; i < count; i++) {
    const title = `${getRandomItem(sampleTitles)} #${i + 1}`;
    const description = getRandomItem(sampleDescriptions);
    const completed = Math.random() < 0.3; // 30% chance of being completed
    
    // Add the task
    const task = taskStore.addTask(title, description);
    
    // Randomly complete some tasks
    if (completed) {
      taskStore.toggleTask(task.id);
    }
    
    // Simulate various sync statuses
    const syncStatus = getRandomSyncStatus();
    if (syncStatus !== 'pending') {
      // Directly update the task in the store to simulate different sync states
      const currentTask = taskStore.tasks.get(task.id);
      if (currentTask) {
        const updatedTask = currentTask.withSyncStatus(
          syncStatus, 
          syncStatus === 'error' ? 'Network timeout error' : undefined
        );
        taskStore.tasks.set(task.id, updatedTask);
      }
    }
    
    // Log progress every 1000 tasks
    if ((i + 1) % 1000 === 0) {
      console.log(`Created ${i + 1} tasks...`);
    }
  }
  
  const endTime = performance.now();
  console.log(`✅ Successfully created ${count} sample tasks in ${Math.round(endTime - startTime)}ms`);
  console.log(`Performance: ${Math.round(count / ((endTime - startTime) / 1000))} tasks/second`);
  
  // Trigger a re-render to show the new tasks
  taskStore['_notifyListeners']();
}

export function clearAllTasks(): void {
  console.log('Clearing all tasks...');
  const taskIds = Array.from(taskStore.tasks.keys());
  taskStore.bulkDeleteTasks(taskIds);
  console.log('✅ All tasks cleared');
}

// Helper function to create specific test scenarios
export function createTestScenarios(): void {
  console.log('Creating test scenarios...');
  
  // Clear existing tasks first
  clearAllTasks();
  
  // Add some specific test cases
  taskStore.addTask('🔍 Search Test - Performance Optimization', 'This task should be found when searching for "performance"');
  taskStore.addTask('🔍 Search Test - Database Query', 'Another searchable task with "database" keyword');
  taskStore.addTask('🎯 High Priority Task', 'This is a critical task that needs immediate attention');
  taskStore.addTask('📝 Documentation Update', 'Update the user manual and API documentation');
  taskStore.addTask('🐛 Bug Fix - Login Issue', 'Users cannot log in with special characters in password');
  
  // Add a batch of regular tasks
  populateSampleData(95); // Total will be 100 tasks for quick testing
  
  console.log('✅ Test scenarios created with 100 sample tasks');
}

// Function to simulate a large dataset for performance testing
export function createLargeDataset(): void {
  console.log('Creating large dataset for performance testing...');
  clearAllTasks();
  populateSampleData(10000);
  console.log('✅ Large dataset created with 10,000 tasks');
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).taskUtils = {
    populateSampleData,
    clearAllTasks,
    createTestScenarios,
    createLargeDataset
  };
  
  console.log(`
🔧 Task Utils Available:
- taskUtils.createTestScenarios() - Create 100 sample tasks for testing
- taskUtils.createLargeDataset() - Create 10,000 tasks for performance testing
- taskUtils.populateSampleData(count) - Create specific number of tasks
- taskUtils.clearAllTasks() - Remove all tasks
  `);
} 