'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MoodTrendData, TimeRange } from '@/lib/types/analytics';

interface MoodTrendChartProps {
  data: MoodTrendData[];
  timeRange: TimeRange;
}

/**
 * Custom Tooltip Component
 */
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {formattedDate}
        </p>
        <div className="space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Tâm trạng:</span>{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {data.moodScore}/5
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Năng lượng:</span>{' '}
            <span
              className={`font-semibold ${
                data.energyLevel === 'High'
                  ? 'text-green-600 dark:text-green-400'
                  : data.energyLevel === 'Mid'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {data.energyLevel}
            </span>
          </p>
          {data.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
              {data.notes.length > 100
                ? `${data.notes.substring(0, 100)}...`
                : data.notes}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * MoodTrendChart Component
 * Displays mood score trend over time with interactive tooltips
 */
export function MoodTrendChart({ data }: MoodTrendChartProps) {
  const { t } = useI18n();

  // Format data for chart
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
    }),
    fullDate: item.date,
  }));

  // Determine tick interval based on data length
  const tickInterval = Math.ceil(chartData.length / 7);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('analytics.charts.moodTrend')}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            interval={tickInterval}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="moodScore"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name={t('analytics.labels.moodScore')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
