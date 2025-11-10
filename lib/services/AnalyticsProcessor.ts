import type {
  CheckinWithIntervention,
  AnalyticsSummary,
  MoodTrendData,
  EnergyDistribution,
  WeeklyPattern,
  AdviceQuality,
  MoodEnergyCorrelation,
  StreakResult,
  EnergyLevel,
} from '@/lib/types/analytics';

/**
 * AnalyticsProcessor Service
 * Processes raw check-in and intervention data into analytics insights
 */
export class AnalyticsProcessor {
  /**
   * Calculate summary statistics
   */
  calculateSummary(data: CheckinWithIntervention[]): AnalyticsSummary {
    if (data.length === 0) {
      return {
        averageMood: 0,
        totalCheckins: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageRating: 0,
        totalInterventions: 0,
      };
    }

    // Calculate average mood
    const totalMood = data.reduce((sum, item) => sum + item.mood_score, 0);
    const averageMood = totalMood / data.length;

    // Count interventions with feedback
    const interventionsWithFeedback = data.filter(
      (item) => item.intervention?.feedback_score != null
    );
    const totalInterventions = interventionsWithFeedback.length;

    // Calculate average rating
    const totalRating = interventionsWithFeedback.reduce(
      (sum, item) => sum + (item.intervention?.feedback_score || 0),
      0
    );
    const averageRating =
      totalInterventions > 0 ? totalRating / totalInterventions : 0;

    // Calculate streaks
    const { current, longest } = this.calculateStreak(data);

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      totalCheckins: data.length,
      currentStreak: current,
      longestStreak: longest,
      averageRating: Math.round(averageRating * 10) / 10,
      totalInterventions,
    };
  }

  /**
   * Process mood trend data
   */
  processMoodTrend(data: CheckinWithIntervention[]): MoodTrendData[] {
    return data
      .filter((item) => item.energy_level) // Filter out items without energy_level
      .map((item) => ({
        date: item.created_at,
        moodScore: item.mood_score,
        energyLevel: item.energy_level,
        notes: item.free_text,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate energy distribution
   */
  calculateEnergyDistribution(
    data: CheckinWithIntervention[]
  ): EnergyDistribution {
    const distribution = { low: 0, mid: 0, high: 0 };

    data.forEach((item) => {
      if (!item.energy_level) return;

      const level = item.energy_level.toLowerCase();
      if (level === 'low') distribution.low++;
      else if (level === 'mid') distribution.mid++;
      else if (level === 'high') distribution.high++;
    });

    return distribution;
  }

  /**
   * Analyze weekly patterns
   */
  analyzeWeeklyPatterns(data: CheckinWithIntervention[]): WeeklyPattern[] {
    const dayNames = [
      'Chủ nhật',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
    ];

    // Group by day of week
    const weeklyData: Record<
      number,
      { moods: number[]; energies: number[]; count: number }
    > = {};

    data.forEach((item) => {
      if (!item.energy_level) return;

      const date = new Date(item.created_at);
      const dayOfWeek = date.getDay(); // 0-6

      if (!weeklyData[dayOfWeek]) {
        weeklyData[dayOfWeek] = { moods: [], energies: [], count: 0 };
      }

      weeklyData[dayOfWeek].moods.push(item.mood_score);
      weeklyData[dayOfWeek].energies.push(this.energyToNumber(item.energy_level));
      weeklyData[dayOfWeek].count++;
    });

    // Calculate averages
    const patterns: WeeklyPattern[] = [];
    for (let day = 0; day < 7; day++) {
      const dayData = weeklyData[day] || { moods: [], energies: [], count: 0 };
      const avgMood =
        dayData.moods.length > 0
          ? dayData.moods.reduce((a, b) => a + b, 0) / dayData.moods.length
          : 0;
      const avgEnergy =
        dayData.energies.length > 0
          ? dayData.energies.reduce((a, b) => a + b, 0) / dayData.energies.length
          : 0;

      patterns.push({
        dayOfWeek: day,
        dayName: dayNames[day],
        averageMood: Math.round(avgMood * 10) / 10,
        averageEnergy: Math.round(avgEnergy * 10) / 10,
        count: dayData.count,
      });
    }

    return patterns;
  }

  /**
   * Calculate mood-energy correlation
   */
  calculateCorrelation(
    data: CheckinWithIntervention[]
  ): MoodEnergyCorrelation[] {
    const correlationData: Record<
      EnergyLevel,
      { moods: number[]; count: number }
    > = {
      Low: { moods: [], count: 0 },
      Mid: { moods: [], count: 0 },
      High: { moods: [], count: 0 },
    };

    data.forEach((item) => {
      if (!item.energy_level) return;

      const level = item.energy_level as EnergyLevel;
      if (correlationData[level]) {
        correlationData[level].moods.push(item.mood_score);
        correlationData[level].count++;
      }
    });

    return (['Low', 'Mid', 'High'] as EnergyLevel[]).map((level) => {
      const levelData = correlationData[level];
      const avgMood =
        levelData.moods.length > 0
          ? levelData.moods.reduce((a, b) => a + b, 0) / levelData.moods.length
          : 0;

      return {
        energyLevel: level,
        averageMood: Math.round(avgMood * 10) / 10,
        count: levelData.count,
      };
    });
  }

  /**
   * Calculate advice quality analytics
   */
  calculateAdviceQuality(data: CheckinWithIntervention[]): AdviceQuality {
    const interventions = data.filter((item) => item.intervention);

    // Rating distribution
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let totalRating = 0;
    let ratingCount = 0;

    interventions.forEach((item) => {
      const score = item.intervention?.feedback_score;
      if (score != null && score >= 1 && score <= 5) {
        ratingDistribution[score]++;
        totalRating += score;
        ratingCount++;
      }
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Enhancement stats
    const enhancedInterventions = interventions.filter(
      (item) => item.intervention?.enhanced_prompt_used === true
    );
    const nonEnhancedInterventions = interventions.filter(
      (item) => item.intervention?.enhanced_prompt_used === false
    );

    const enhancedRatings = enhancedInterventions
      .map((item) => item.intervention?.feedback_score)
      .filter((score): score is number => score != null);

    const nonEnhancedRatings = nonEnhancedInterventions
      .map((item) => item.intervention?.feedback_score)
      .filter((score): score is number => score != null);

    const avgRatingBefore =
      nonEnhancedRatings.length > 0
        ? nonEnhancedRatings.reduce((a, b) => a + b, 0) /
          nonEnhancedRatings.length
        : 0;

    const avgRatingAfter =
      enhancedRatings.length > 0
        ? enhancedRatings.reduce((a, b) => a + b, 0) / enhancedRatings.length
        : 0;

    const improvementRate =
      avgRatingBefore > 0
        ? ((avgRatingAfter - avgRatingBefore) / avgRatingBefore) * 100
        : 0;

    return {
      ratingDistribution,
      averageRating: Math.round(averageRating * 10) / 10,
      enhancementStats: {
        totalEnhanced: enhancedInterventions.length,
        averageRatingBefore: Math.round(avgRatingBefore * 10) / 10,
        averageRatingAfter: Math.round(avgRatingAfter * 10) / 10,
        improvementRate: Math.round(improvementRate * 10) / 10,
      },
    };
  }

  /**
   * Calculate current and longest streak
   */
  calculateStreak(data: CheckinWithIntervention[]): StreakResult {
    if (data.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Get unique dates (YYYY-MM-DD format)
    const dates = Array.from(
      new Set(
        data.map((item) => {
          const date = new Date(item.created_at);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        })
      )
    ).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Calculate longest streak
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak
    const lastDate = dates[dates.length - 1];
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      currentStreak = 1;
      for (let i = dates.length - 2; i >= 0; i--) {
        const prevDate = new Date(dates[i]);
        const currDate = new Date(dates[i + 1]);
        const diffDays = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Helper: Convert energy level to number for averaging
   */
  private energyToNumber(level: EnergyLevel): number {
    switch (level) {
      case 'Low':
        return 1;
      case 'Mid':
        return 2;
      case 'High':
        return 3;
      default:
        return 2;
    }
  }
}

// Export singleton instance
export const analyticsProcessor = new AnalyticsProcessor();
