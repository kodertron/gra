import React from 'react';

export default function DashboardCard({ title, children, className }) {
  return (
    <div className={`p-6 rounded-lg shadow-md bg-white dark:bg-gray-800 ${className}`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ProgressBar({ label, value, color = 'blue' }) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const getColorClasses = () => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="relative pt-1">
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-${color}-200 text-${color}-600`}>
            {label}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-xs font-semibold inline-block text-${color}-600`}>
            {percentage}%
          </span>
        </div>
      </div>
      <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded bg-${color}-200`}>
        <div
          style={{ width: `${percentage}%` }}
          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getColorClasses()}`}
        />
      </div>
    </div>
  );
}

export function StockLevel({ label, level, color = 'blue' }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <div className="mt-2 h-2 relative rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div
          className={`absolute top-0 h-full bg-${color}-500`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}