'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAnalyticsData } from '@/lib/hooks/useAnalyticsData';
import { useI18n } from '@/lib/i18n/context';
import Header from '@/components/Header';
import { TimeRangeFilter } from '@/components/analytics/TimeRangeFilter';
import { AnalyticsSummaryCards } from '@/components/analytics/AnalyticsSummaryCards';
import { MoodTrendChart } from '@/components/analytics/MoodTrendChart';
import { EnergyDistributionChart } from '@/components/analytics/EnergyDistributionChart';
import { WeeklyPatternChart } from '@/components/analytics/WeeklyPatternChart';
import { AdviceQualitySection } from '@/components/analytics/AdviceQualitySection';
import { MoodEnergyCorrelationChart } from '@/components/analytics/MoodEnergyCorrelationChart';
import type { TimeRange } from '@/lib/types/analytics';

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {t('analytics.empty.title')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {t('analytics.empty.description')}
      </p>
      <button
        onClick={() => (window.location.href = '/')}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {t('analytics.empty.action')}
      </button>
    </div>
  );
}

/**
 * Error Fallback Component
 */
function ErrorFallback({
  error,
  retry,
  t,
}: {
  error: string;
  retry: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {t('analytics.error.title')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {error}
      </p>
      <button
        onClick={retry}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {t('analytics.error.retry')}
      </button>
    </div>
  );
}

/**
 * Analytics Page Component
 */
export default function AnalyticsPage() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Get authenticated user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { data, loading, error, refetch } = useAnalyticsData(userId, timeRange);

  const { t } = useI18n();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('analytics.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('analytics.subtitle')}
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorFallback error={error} retry={refetch} t={t} />
        ) : !data || data.summary.totalCheckins === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <AnalyticsSummaryCards summary={data.summary} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MoodTrendChart data={data.moodTrend} timeRange={timeRange} />
              <EnergyDistributionChart
                distribution={data.energyDistribution}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyPatternChart weeklyData={data.weeklyPattern} />
              <MoodEnergyCorrelationChart
                correlationData={data.moodEnergyCorrelation}
              />
            </div>

            {/* Advice Quality Section */}
            {data.summary.totalInterventions > 0 && (
              <AdviceQualitySection adviceQuality={data.adviceQuality} />
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
