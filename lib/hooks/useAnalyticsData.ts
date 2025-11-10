'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { analyticsProcessor } from '@/lib/services/AnalyticsProcessor';
import type {
  TimeRange,
  AnalyticsData,
  UseAnalyticsDataReturn,
  CheckinWithIntervention,
} from '@/lib/types/analytics';

/**
 * Calculate date range based on time range filter
 */
function getDateRange(timeRange: TimeRange): Date | null {
  const now = new Date();

  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Fetch check-ins and interventions from Supabase
 */
async function fetchAnalyticsData(
  userId: string,
  timeRange: TimeRange
): Promise<CheckinWithIntervention[]> {
  const supabase = createClient();
  const startDate = getDateRange(timeRange);

  // Build query
  let query = supabase
    .from('checkins')
    .select(`
      id,
      created_at,
      mood_score,
      energy_level,
      free_text,
      user_id,
      interventions (
        id,
        checkin_id,
        created_at,
        feedback_score,
        enhanced_prompt_used,
        template_type,
        user_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Add date filter if not 'all'
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching analytics data:', error);
    throw new Error(`Failed to fetch analytics data: ${error.message}`);
  }

  console.log('Raw analytics data:', data);

  // Transform data to match our interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((checkin: any) => {
    console.log('Processing checkin:', checkin);
    return {
      id: checkin.id,
      created_at: checkin.created_at,
      mood_score: checkin.mood_score,
      energy_level: checkin.energy_level,
      free_text: checkin.free_text,
      user_id: checkin.user_id,
      intervention: checkin.interventions?.[0] || undefined,
    };
  });
}

/**
 * Custom hook to fetch and manage analytics data
 *
 * @param userId - The authenticated user's ID
 * @param timeRange - Time range filter (7d, 30d, 90d, all)
 * @returns Analytics data, loading state, error state, and refetch function
 */
export function useAnalyticsData(
  userId: string | undefined,
  timeRange: TimeRange
): UseAnalyticsDataReturn {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', userId, timeRange],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return fetchAnalyticsData(userId, timeRange);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Process raw data into analytics format using AnalyticsProcessor
  let processedData: AnalyticsData | null = null;

  if (rawData) {
    try {
      console.log('Processing analytics data, count:', rawData.length);
      processedData = {
        summary: analyticsProcessor.calculateSummary(rawData),
        moodTrend: analyticsProcessor.processMoodTrend(rawData),
        energyDistribution: analyticsProcessor.calculateEnergyDistribution(rawData),
        weeklyPattern: analyticsProcessor.analyzeWeeklyPatterns(rawData),
        adviceQuality: analyticsProcessor.calculateAdviceQuality(rawData),
        moodEnergyCorrelation: analyticsProcessor.calculateCorrelation(rawData),
        insights: [], // Will be populated by InsightGenerator in task 9
      };
      console.log('Processed data:', processedData);
    } catch (err) {
      console.error('Error processing analytics data:', err);
    }
  }

  return {
    data: processedData,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch: async () => {
      await refetch();
    },
  };
}
