/**
 * Analytics Types and Interfaces
 * Defines all data structures for the Analytics Dashboard
 */

// Time range options for filtering analytics data
export type TimeRange = '7d' | '30d' | '90d' | 'all';

// Energy level categories
export type EnergyLevel = 'Low' | 'Mid' | 'High';

// Insight types for categorization
export type InsightType = 'positive' | 'neutral' | 'warning' | 'info';

/**
 * Summary statistics for the analytics dashboard
 */
export interface AnalyticsSummary {
  averageMood: number;
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  averageRating: number;
  totalInterventions: number;
}

/**
 * Mood trend data point
 */
export interface MoodTrendData {
  date: string;
  moodScore: number;
  energyLevel: EnergyLevel;
  notes: string | null;
}

/**
 * Energy distribution statistics
 */
export interface EnergyDistribution {
  low: number;
  mid: number;
  high: number;
}

/**
 * Weekly pattern data for a specific day
 */
export interface WeeklyPattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  averageMood: number;
  averageEnergy: number;
  count: number;
}

/**
 * Enhancement statistics for advice quality
 */
export interface EnhancementStats {
  totalEnhanced: number;
  averageRatingBefore: number;
  averageRatingAfter: number;
  improvementRate: number;
}

/**
 * Advice quality analytics
 */
export interface AdviceQuality {
  ratingDistribution: Record<number, number>; // 1-5 stars
  averageRating: number;
  enhancementStats: EnhancementStats;
}

/**
 * Mood-energy correlation data
 */
export interface MoodEnergyCorrelation {
  energyLevel: EnergyLevel;
  averageMood: number;
  count: number;
}

/**
 * Insight generated from analytics data
 */
export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: string;
  priority: number;
}

/**
 * Complete analytics data structure
 */
export interface AnalyticsData {
  summary: AnalyticsSummary;
  moodTrend: MoodTrendData[];
  energyDistribution: EnergyDistribution;
  weeklyPattern: WeeklyPattern[];
  adviceQuality: AdviceQuality;
  moodEnergyCorrelation: MoodEnergyCorrelation[];
  insights: Insight[];
}

/**
 * Check-in data from database
 */
export interface Checkin {
  id: string;
  created_at: string;
  mood_score: number;
  energy_level: EnergyLevel;
  free_text: string | null;
  user_id: string;
}

/**
 * Intervention data from database
 */
export interface Intervention {
  id: string;
  checkin_id: string;
  created_at: string;
  feedback_score: number | null;
  enhanced_prompt_used: boolean;
  template_type: string | null;
  user_id: string;
}

/**
 * Combined check-in with intervention data
 */
export interface CheckinWithIntervention extends Checkin {
  intervention?: Intervention;
}

/**
 * Props for AnalyticsSummaryCards component
 */
export interface SummaryCardsProps {
  averageMood: number;
  totalCheckins: number;
  currentStreak: number;
  averageRating: number;
  previousPeriodComparison: {
    moodChange: number;
    ratingChange: number;
  };
}

/**
 * Props for MoodTrendChart component
 */
export interface MoodTrendChartProps {
  data: MoodTrendData[];
  timeRange: TimeRange;
}

/**
 * Props for EnergyDistributionChart component
 */
export interface EnergyDistributionProps {
  distribution: EnergyDistribution;
  onSegmentClick: (level: EnergyLevel) => void;
}

/**
 * Props for WeeklyPatternChart component
 */
export interface WeeklyPatternProps {
  weeklyData: WeeklyPattern[];
}

/**
 * Props for AdviceQualitySection component
 */
export interface AdviceQualityProps {
  ratingDistribution: Record<number, number>;
  enhancementStats: EnhancementStats;
}

/**
 * Props for InsightsSection component
 */
export interface InsightsSectionProps {
  insights: Insight[];
}

/**
 * State for AnalyticsPage component
 */
export interface AnalyticsState {
  timeRange: TimeRange;
  loading: boolean;
  error: string | null;
  data: AnalyticsData | null;
}

/**
 * Return type for useAnalyticsData hook
 */
export interface UseAnalyticsDataReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * CSV export data structure
 */
export interface CSVExportData {
  date: string;
  mood_score: number;
  energy_level: EnergyLevel;
  notes: string;
  advice: string;
  feedback_score: number | null;
}

/**
 * Streak calculation result
 */
export interface StreakResult {
  current: number;
  longest: number;
}
