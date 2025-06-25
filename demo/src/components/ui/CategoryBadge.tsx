 'use client';

interface Props {
  category: 'accessibility' | 'performance' | 'security';
  count?: number;
}

export default function CategoryBadge({ category, count }: Props) {
  const configs = {
    accessibility: {
      icon: '♿',
      label: 'Accessibility',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-500'
    },
    performance: {
      icon: '⚡',
      label: 'Performance',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      iconBg: 'bg-yellow-500'
    },
    security: {
      icon: '🔒',
      label: 'Security',
      bgColor: 'bg-red-100 dark:bg-red-900',
      textColor: 'text-red-700 dark:text-red-300',
      iconBg: 'bg-red-500'
    }
  };

  const config = configs[category];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor}`}>
      <span className={`category-icon ${category}`}>
        {config.icon}
      </span>
      <span className="text-sm font-medium">
        {config.label}
        {count !== undefined && (
          <span className="ml-1 opacity-75">({count})</span>
        )}
      </span>
    </div>
  );
}