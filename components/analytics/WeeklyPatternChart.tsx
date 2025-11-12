'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { WeeklyPattern } from '@/lib/types/analytics';

interface WeeklyPatternChartProps {
  weeklyData: WeeklyPattern[];
}

/**
 * WeeklyPatternChart Component
 * Displays mood and energy patterns by day of week
 */
export function WeeklyPatternChart({ weeklyData }: WeeklyPatternChartProps) {
  // Find highest and lowest mood days
  const highestMoodDay = weeklyData.reduce((prev, current) =>
    current.averageMood > prev.averageMood ? current : prev
  );
  const lowestMoodDay = weeklyData.reduce((prev, current) =>
    current.averageMood < prev.averageMood && current.count > 0 ? current : prev
  );

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Tâm trạng TB: {payload[0].value.toFixed(1)}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Năng lượng TB: {payload[1].value.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {payload[0].payload.count} check-ins
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Mẫu hàng tuần
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="dayName" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            domain={[0, 5]}
            stroke="#3b82f6"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 3]}
            stroke="#10b981"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="averageMood"
            fill="#3b82f6"
            name="Tâm trạng TB"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="averageEnergy"
            fill="#10b981"
            name="Năng lượng TB"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      {weeklyData.some((d) => d.count > 0) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
              Ngày tốt nhất
            </p>
            <p className="text-sm font-semibold text-green-900 dark:text-green-300 mt-1">
              {highestMoodDay.dayName} ({highestMoodDay.averageMood.toFixed(1)})
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
              Ngày cần chú ý
            </p>
            <p className="text-sm font-semibold text-red-900 dark:text-red-300 mt-1">
              {lowestMoodDay.dayName} ({lowestMoodDay.averageMood.toFixed(1)})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
