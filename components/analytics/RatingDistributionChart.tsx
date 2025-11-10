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
} from 'recharts';

interface RatingDistributionChartProps {
  ratingDistribution: Record<number, number>;
  averageRating: number;
}

/**
 * RatingDistributionChart Component
 * Displays feedback score distribution
 */
export function RatingDistributionChart({
  ratingDistribution,
  averageRating,
}: RatingDistributionChartProps) {
  const chartData = [1, 2, 3, 4, 5].map((rating) => ({
    rating: `${rating} ⭐`,
    count: ratingDistribution[rating] || 0,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {payload[0].payload.rating}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {payload[0].value} lời khuyên
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Phân bố đánh giá
        </h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {averageRating.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Điểm trung bình
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="rating" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
