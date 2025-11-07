import { createClient } from '@/lib/supabase/client'
import { RatingStats, UserRatingData } from './FeedbackAnalyzer'

export interface RatingImprovement {
  userId: string
  triggerDate: Date
  averageRatingBefore: number
  enhancementAttempts: number
  currentAverageRating: number
  improvementAchieved: boolean
  lastEnhancedAdviceId: string
}

export class RatingStatsService {
  private supabase = createClient()

  /**
   * Update or insert user rating statistics
   */
  async updateUserRatingStats(
    userId: string,
    averageRating: number,
    totalRatings: number,
    ratingsBelow25: number
  ): Promise<UserRatingData | null> {
    try {
      const updateData = {
        user_id: userId,
        average_rating: averageRating,
        total_ratings: totalRatings,
        ratings_below_threshold: ratingsBelow25,
        last_rating_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Check if enhancement should be triggered (first time below threshold with enough ratings)
      const shouldTriggerEnhancement = totalRatings >= 3 && averageRating < 2.5

      // Get existing record to check if enhancement was already triggered
      const { data: existingRecord } = await this.supabase
        .from('user_rating_stats')
        .select('enhancement_triggered_at, average_rating')
        .eq('user_id', userId)
        .single()

      // Only set enhancement_triggered_at if it's not already set and conditions are met
      if (shouldTriggerEnhancement && !existingRecord?.enhancement_triggered_at) {
        updateData['enhancement_triggered_at'] = new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('user_rating_stats')
        .upsert(updateData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating user rating stats:', error)
        return null
      }

      return data as UserRatingData
    } catch (error) {
      console.error('Error in updateUserRatingStats:', error)
      return null
    }
  }

  /**
   * Get user rating statistics from database
   */
  async getUserRatingStatsFromDB(userId: string): Promise<UserRatingData | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_rating_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If no record exists, return null (not an error)
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching user rating stats:', error)
        return null
      }

      return data as UserRatingData
    } catch (error) {
      console.error('Error in getUserRatingStatsFromDB:', error)
      return null
    }
  }

  /**
   * Detect if user's rating has improved after enhancement
   */
  async detectRatingImprovement(userId: string): Promise<boolean> {
    try {
      const { data: userStats } = await this.supabase
        .from('user_rating_stats')
        .select('enhancement_triggered_at, average_rating')
        .eq('user_id', userId)
        .single()

      if (!userStats?.enhancement_triggered_at) {
        return false
      }

      // Get interventions created after enhancement was triggered
      const { data: recentInterventions } = await this.supabase
        .from('interventions')
        .select('feedback_score, created_at')
        .eq('user_id', userId)
        .gte('created_at', userStats.enhancement_triggered_at)
        .not('feedback_score', 'is', null)
        .order('created_at', { ascending: false })

      if (!recentInterventions || recentInterventions.length === 0) {
        return false
      }

      // Calculate average of recent ratings
      const recentRatings = recentInterventions.map(item => item.feedback_score as number)
      const recentAverage = recentRatings.reduce((sum, rating) => sum + rating, 0) / recentRatings.length

      // Consider improved if recent average is 3.0 or higher
      return recentAverage >= 3.0
    } catch (error) {
      console.error('Error detecting rating improvement:', error)
      return false
    }
  }

  /**
   * Get enhancement statistics for monitoring
   */
  async getEnhancementStats(userId: string): Promise<{
    enhancementTriggered: boolean
    enhancementDate?: Date
    improvementDetected: boolean
    enhancedAdviceCount: number
    averageRatingBeforeEnhancement?: number
    averageRatingAfterEnhancement?: number
  }> {
    try {
      const userStats = await this.getUserRatingStatsFromDB(userId)

      if (!userStats?.enhancement_triggered_at) {
        return {
          enhancementTriggered: false,
          improvementDetected: false,
          enhancedAdviceCount: 0
        }
      }

      const enhancementDate = new Date(userStats.enhancement_triggered_at)

      // Count enhanced advice given
      const { data: enhancedAdvice } = await this.supabase
        .from('interventions')
        .select('id')
        .eq('user_id', userId)
        .eq('enhanced_prompt_used', true)

      const enhancedAdviceCount = enhancedAdvice?.length || 0

      // Get ratings before and after enhancement
      const { data: ratingsBeforeEnhancement } = await this.supabase
        .from('interventions')
        .select('feedback_score')
        .eq('user_id', userId)
        .lt('created_at', userStats.enhancement_triggered_at)
        .not('feedback_score', 'is', null)

      const { data: ratingsAfterEnhancement } = await this.supabase
        .from('interventions')
        .select('feedback_score')
        .eq('user_id', userId)
        .gte('created_at', userStats.enhancement_triggered_at)
        .not('feedback_score', 'is', null)

      let averageRatingBeforeEnhancement: number | undefined
      let averageRatingAfterEnhancement: number | undefined

      if (ratingsBeforeEnhancement && ratingsBeforeEnhancement.length > 0) {
        const beforeRatings = ratingsBeforeEnhancement.map(r => r.feedback_score as number)
        averageRatingBeforeEnhancement = beforeRatings.reduce((sum, r) => sum + r, 0) / beforeRatings.length
      }

      if (ratingsAfterEnhancement && ratingsAfterEnhancement.length > 0) {
        const afterRatings = ratingsAfterEnhancement.map(r => r.feedback_score as number)
        averageRatingAfterEnhancement = afterRatings.reduce((sum, r) => sum + r, 0) / afterRatings.length
      }

      const improvementDetected = await this.detectRatingImprovement(userId)

      return {
        enhancementTriggered: true,
        enhancementDate,
        improvementDetected,
        enhancedAdviceCount,
        averageRatingBeforeEnhancement,
        averageRatingAfterEnhancement
      }
    } catch (error) {
      console.error('Error getting enhancement stats:', error)
      return {
        enhancementTriggered: false,
        improvementDetected: false,
        enhancedAdviceCount: 0
      }
    }
  }

  /**
   * Reset enhancement trigger (for testing or manual reset)
   */
  async resetEnhancementTrigger(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_rating_stats')
        .update({
          enhancement_triggered_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error resetting enhancement trigger:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in resetEnhancementTrigger:', error)
      return false
    }
  }

  /**
   * Batch process rating statistics updates (for maintenance)
   */
  async batchUpdateRatingStats(userIds: string[]): Promise<{
    successful: number
    failed: number
    errors: string[]
  }> {
    let successful = 0
    let failed = 0
    const errors: string[] = []

    for (const userId of userIds) {
      try {
        // This would typically call the FeedbackAnalyzer to recalculate stats
        // For now, we'll just verify the user exists
        const { data: user } = await this.supabase
          .from('user_rating_stats')
          .select('user_id')
          .eq('user_id', userId)
          .single()

        if (user) {
          successful++
        } else {
          failed++
          errors.push(`User ${userId} not found`)
        }
      } catch (error) {
        failed++
        errors.push(`Error processing user ${userId}: ${error}`)
      }
    }

    return { successful, failed, errors }
  }
}

// Export singleton instance
export const ratingStatsService = new RatingStatsService()
