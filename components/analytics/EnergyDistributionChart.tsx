'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { EnergyDistribution, EnergyLevel } from '@/lib/types/analytics';

interface EnergyDistributionChartProps {
  distribution: EnergyDistribution;
  onSegmentClick?: (level: EnergyLevel) => void;
}

const COLORS = {
  Low: '#ef4444', // red
  Mid: '#f59e0b', // yellow
  High: '#10b981', // green
};

const LABELS = {
  Low: 'Thấp',
  Mid: 'Trung bình',
  High: 'Cao',
};

/**
 * EnergyDistributionChart Component
 * Displays energy level distribution as a pie chart
 */
export function EnergyDistributionChart({
  distribution,
  onSegmentClick,
}: EnergyDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Prepare data for chart
  const chartData = [
    { name: 'Low', value: distribution.low, label: LABELS.Low },
    { name: 'Mid', value: distribution.mid, label: LABELS.Mid },
    { name: 'High', value: distribution.high, label: LABELS.High },
  ].filter((item) => item.value > 0);

  const total = distribution.low + distribution.mid + distribution.high;

  // Find most common energy level
  const mostCommon = (Object.entries(distribution).reduce((a, b) =>
    distribution[a[0] as keyof EnergyDistribution] >
    distribution[b[0] as keyof EnergyDistribution]
      ? a
      : b
  )[0] as 'low' | 'mid' | 'high') === 'low' ? 'Low' :
  (Object.entries(distribution).reduce((a, b) =>
    distribution[a[0] as keyof EnergyDistribution] >
    distribution[b[0] as keyof EnergyDistribution]
      ? a
      : b
  )[0] as 'low' | 'mid' | 'high') === 'mid' ? 'Mid' : 'High';

  const handleClick = (data: { name: string; value: number; label: string }) => {
    if (onSegmentClick) {
      onSegmentClick(data.name as EnergyLevel);
    }
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.payload.label}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.value} check-ins ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Phân bố năng lượng
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Chưa có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Phân bố năng lượng
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => {
              const { name, percent } = props;
              return `${LABELS[name as keyof typeof LABELS]} ${(percent * 100).toFixed(0)}%`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={handleClick}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name as keyof typeof COLORS]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mức năng lượng phổ biến nhất:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {LABELS[mostCommon]}
          </span>
        </p>
      </div>
    </div>
  );
}
