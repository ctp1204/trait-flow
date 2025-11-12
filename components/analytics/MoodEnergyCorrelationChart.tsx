'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { MoodEnergyCorrelation } from '@/lib/types/analytics';

interface MoodEnergyCorrelationChartProps {
  correlationData: MoodEnergyCorrelation[];
}

const COLORS = {
  Low: '#ef4444',
  Mid: '#f59e0b',
  High: '#10b981',
};

const LABELS = {
  Low: 'Thấp',
  Mid: 'Trung bình',
  High: 'Cao',
};

/**
 * MoodEnergyCorrelationChart Component
 * Displays correlation between mood and energy levels
 */
export function MoodEnergyCorrelationChart({
  correlationData,
}: MoodEnergyCorrelationChartProps) {
  const chartData = correlationData.map((item) => ({
    ...item,
    label: LABELS[item.energyLevel],
  }));

  // Generate insight
  const highestCorrelation = correlationData.reduce((prev, current) =>
    current.averageMood > prev.averageMood ? current : prev
  );

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Năng lượng: {data.label}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tâm trạng TB: {data.averageMood.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.count} check-ins
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Mối tương quan Tâm trạng - Năng lượng
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, 5]}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            label={{
              value: 'Tâm trạng TB',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="averageMood" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.energyLevel]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {highestCorrelation.count > 0 && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <span className="font-semibold">💡 Insight:</span> Khi bạn có năng
            lượng {LABELS[highestCorrelation.energyLevel].toLowerCase()}, tâm
            trạng trung bình là {highestCorrelation.averageMood.toFixed(1)}/5
          </p>
        </div>
      )}
    </div>
  );
}
