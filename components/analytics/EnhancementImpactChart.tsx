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
import type { EnhancementStats } from '@/lib/types/analytics';

interface EnhancementImpactChartProps {
  enhancementStats: EnhancementStats;
}

/**
 * EnhancementImpactChart Component
 * Displays before/after comparison of enhanced prompts
 */
export function EnhancementImpactChart({
  enhancementStats,
}: EnhancementImpactChartProps) {
  const chartData = [
    {
      name: 'Trước',
      rating: enhancementStats.averageRatingBefore,
    },
    {
      name: 'Sau',
      rating: enhancementStats.averageRatingAfter,
    },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {payload[0].payload.name} cải thiện
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Đánh giá TB: {payload[0].value.toFixed(1)} ⭐
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Tác động của cải thiện prompt
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, 5]}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="rating"
            fill="#10b981"
            name="Đánh giá TB"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
            Đã cải thiện
          </p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-300 mt-1">
            {enhancementStats.totalEnhanced}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
            Tỷ lệ cải thiện
          </p>
          <p className="text-lg font-bold text-green-900 dark:text-green-300 mt-1">
            {enhancementStats.improvementRate > 0 ? '+' : ''}
            {enhancementStats.improvementRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
