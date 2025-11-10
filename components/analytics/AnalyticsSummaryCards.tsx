import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import { StatCard } from './StatCard';
import type { AnalyticsSummary } from '@/lib/types/analytics';

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
  previousPeriodComparison?: {
    moodChange: number;
    ratingChange: number;
  };
}

/**
 * AnalyticsSummaryCards Component
 * Displays 4 key metrics in a responsive grid layout
 */
export function AnalyticsSummaryCards({
  summary,
  previousPeriodComparison,
}: AnalyticsSummaryCardsProps) {
  const { t } = useI18n();
  const moodTrend = previousPeriodComparison
    ? {
        value: Math.abs(previousPeriodComparison.moodChange),
        isPositive: previousPeriodComparison.moodChange > 0,
      }
    : undefined;

  const ratingTrend = previousPeriodComparison
    ? {
        value: Math.abs(previousPeriodComparison.ratingChange),
        isPositive: previousPeriodComparison.ratingChange > 0,
      }
    : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title={t('analytics.summary.averageMood')}
        value={summary.averageMood.toFixed(1)}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        trend={moodTrend}
        subtitle={t('analytics.summary.moodScale')}
      />

      <StatCard
        title={t('analytics.summary.totalCheckins')}
        value={summary.totalCheckins}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        }
        subtitle={t('analytics.summary.inThisPeriod')}
      />

      <StatCard
        title={t('analytics.summary.currentStreak')}
        value={summary.currentStreak}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
        subtitle={t('analytics.summary.longestStreak', {
          count: summary.longestStreak,
        })}
      />

      <StatCard
        title={t('analytics.summary.averageRating')}
        value={
          summary.averageRating > 0 ? summary.averageRating.toFixed(1) : 'N/A'
        }
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        }
        trend={ratingTrend}
        subtitle={t('analytics.summary.adviceCount', {
          count: summary.totalInterventions,
        })}
      />
    </div>
  );
}
