'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { TimeRange } from '@/lib/types/analytics';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

/**
 * TimeRangeFilter Component
 * Allows users to select time range for analytics
 */
export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  const { t } = useI18n();

  const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: '7d', label: t('analytics.timeRange.7d') },
    { value: '30d', label: t('analytics.timeRange.30d') },
    { value: '90d', label: t('analytics.timeRange.90d') },
    { value: 'all', label: t('analytics.timeRange.all') },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === range.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
