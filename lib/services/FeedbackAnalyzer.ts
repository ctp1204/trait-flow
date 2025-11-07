import { createClient } from '@/lib/supabase/client'

export interface RatingStats {
  averageRating: number
  totalRatings: number
  recentRatings: number[]
  needsEnhancement: boolean
  enhancementStartDate?: Date
  ratingsBelow25: number
}

export interface UserRatingData {
  id: string
  user_id: string
  average_rating: number
  total_ratings: number
  ratings_below_threshold: number
  enhancement_triggered_at: string | null
  last_rating_at: string | null
}

export class FeedbackAnalyzer {
  private supabase: any
  private readonly RATING_THRESHOLD = 2.5
  private readonly MINIMUM_RATINGS = 3

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Calculate user's average rating from interventions table
   */
  async calculateUserAverageRating(userId: string): Promise<number> {
    try {
      console.log(`🔍 Calculating average rating for user: ${userId}`)

      const { data, error } = await this.supabase
        .from('interventions')
        .select('feedback_score')
        .eq('user_id', userId)
        .not('feedback_score', 'is', null)

      console.log(`📊 Query result:`, { data, error })

      if (error) {
        console.error('❌ Error calculating average rating:', error)
        return 0
      }

      if (!data || data.length === 0) {
        console.log(`⚠️ No interventions with feedback found for user ${userId}`)
        return 0
      }

      const ratings = data.map((item: any) => item.feedback_score as number)
      console.log(`📈 Found ratings:`, ratings)

      const sum = ratings.reduce((acc: number, rating: number) => acc + rating, 0)
      const average = sum / ratings.length

      console.log(`🎯 Calculated average: ${average} (from ${ratings.length} ratings)`)
      return Math.round(average * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      console.error('❌ Error in calculateUserAverageRating:', error)
      return 0
    }
  }

  /**
   * Determine if enhanced prompt should be used for this user
   */
  async shouldUseEnhancedPrompt(userId: string): Promise<boolean> {
    try {
      // Get user's rating statistics
      const stats = await this.getUserRatingStats(userId)

      // Check if user has minimum required ratings
      if (stats.totalRatings < this.MINIMUM_RATINGS) {
        return false
      }

      // Check if average rating is below threshold
      return stats.averageRating < this.RATING_THRESHOLD
    } catch (error) {
      console.error('Error in shouldUseEnhancedPrompt:', error)
      return false
    }
  }

  /**
   * Get comprehensive rating statistics for a user
   */
  async getUserRatingStats(userId: string): Promise<RatingStats> {
    try {
      console.log(`📊 Getting rating stats for user: ${userId}`)

      // First, try to get from user_rating_stats table (faster)
      const { data: cachedStats, error: cacheError } = await this.supabase
        .from('user_rating_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (cachedStats && !cacheError) {
        console.log(`⚡ Using cached rating stats:`, cachedStats)

        // Get recent ratings for recentRatings array
        const { data: recentInterventions } = await this.supabase
          .from('interventions')
          .select('feedback_score')
          .eq('user_id', userId)
          .not('feedback_score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5)

        const recentRatings = recentInterventions?.map((i: any) => i.feedback_score as number) || []

        return {
          averageRating: cachedStats.average_rating,
          totalRatings: cachedStats.total_ratings,
          recentRatings,
          needsEnhancement: cachedStats.total_ratings >= this.MINIMUM_RATINGS &&
                           cachedStats.average_rating < this.RATING_THRESHOLD,
          enhancementStartDate: cachedStats.enhancement_triggered_at ?
                               new Date(cachedStats.enhancement_triggered_at) : undefined,
          ratingsBelow25: cachedStats.ratings_below_threshold
        }
      }

      console.log(`🔄 No cached stats found, calculating from interventions...`)

      // Fallback: calculate from interventions table (slower but accurate)
      const { data: interventions, error: interventionsError } = await this.supabase
        .from('interventions')
        .select('feedback_score, created_at')
        .eq('user_id', userId)
        .not('feedback_score', 'is', null)
        .order('created_at', { ascending: false })

      if (interventionsError) {
        console.error('Error fetching interventions:', interventionsError)
        return this.getDefaultRatingStats()
      }

      const ratings = interventions?.map((item: any) => item.feedback_score as number) || []

      if (ratings.length === 0) {
        return this.getDefaultRatingStats()
      }

      // Calculate statistics
      const totalRatings = ratings.length
      const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / totalRatings
      const ratingsBelow25 = ratings.filter((rating: number) => rating < this.RATING_THRESHOLD).length
      const recentRatings = ratings.slice(0, 5) // Last 5 ratings

      // Check if enhancement is needed
      const needsEnhancement = totalRatings >= this.MINIMUM_RATINGS &&
                              averageRating < this.RATING_THRESHOLD

      // Get enhancement start date from user_rating_stats if exists
      let enhancementStartDate: Date | undefined

      if (needsEnhancement) {
        const { data: userStats } = await this.supabase
          .from('user_rating_stats')
          .select('enhancement_triggered_at')
          .eq('user_id', userId)
          .single()

        if (userStats?.enhancement_triggered_at) {
          enhancementStartDate = new Date(userStats.enhancement_triggered_at)
        }
      }

      return {
        averageRating: Math.round(averageRating * 100) / 100,
        totalRatings,
        recentRatings,
        needsEnhancement,
        enhancementStartDate,
        ratingsBelow25
      }
    } catch (error) {
      console.error('Error in getUserRatingStats:', error)
      return this.getDefaultRatingStats()
    }
  }

  /**
   * Calculate fresh rating statistics directly from interventions (bypass cache)
   */
  private async calculateFreshRatingStats(userId: string): Promise<RatingStats> {
    try {
      console.log(`🔄 Calculating FRESH rating stats for user: ${userId}`)

      // Always query interventions directly (no cache)
      const { data: interventions, error: interventionsError } = await this.supabase
        .from('interventions')
        .select('feedback_score, created_at')
        .eq('user_id', userId)
        .not('feedback_score', 'is', null)
        .order('created_at', { ascending: false })

      console.log(`🔍 Fresh interventions query result:`, { interventions, error: interventionsError })

      if (interventionsError) {
        console.error('❌ Error fetching fresh interventions:', interventionsError)
        return this.getDefaultRatingStats()
      }

      const ratings = interventions?.map((item: any) => item.feedback_score as number) || []
      console.log(`📈 Fresh extracted ratings:`, ratings)

      if (ratings.length === 0) {
        console.log(`⚠️ No fresh ratings found, returning default stats`)
        return this.getDefaultRatingStats()
      }

      // Calculate statistics
      const totalRatings = ratings.length
      const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / totalRatings
      const ratingsBelow25 = ratings.filter((rating: number) => rating < this.RATING_THRESHOLD).length
      const recentRatings = ratings.slice(0, 5) // Last 5 ratings

      // Check if enhancement is needed
      const needsEnhancement = totalRatings >= this.MINIMUM_RATINGS &&
                              averageRating < this.RATING_THRESHOLD

      console.log(`📊 Fresh calculated stats:`, {
        totalRatings,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingsBelow25,
        needsEnhancement
      })

      return {
        averageRating: Math.round(averageRating * 100) / 100,
        totalRatings,
        recentRatings,
        needsEnhancement,
        enhancementStartDate: undefined, // Will be set from existing record if needed
        ratingsBelow25
      }
    } catch (error) {
      console.error('❌ Error in calculateFreshRatingStats:', error)
      return this.getDefaultRatingStats()
    }
  }

  /**
   * Update user rating statistics in the database
   */
  async updateUserRatingStats(userId: string): Promise<void> {
    try {
      console.log(`🔄 Updating rating stats for user ${userId}`)

      // ALWAYS calculate fresh stats from interventions (not from cache)
      const stats = await this.calculateFreshRatingStats(userId)

      // Get existing record to preserve enhancement_triggered_at if already set
      const { data: existingRecord } = await this.supabase
        .from('user_rating_stats')
        .select('enhancement_triggered_at')
        .eq('user_id', userId)
        .single()

      // Prepare data for upsert
      const updateData: any = {
        user_id: userId,
        average_rating: stats.averageRating,
        total_ratings: stats.totalRatings,
        ratings_below_threshold: stats.ratingsBelow25,
        last_rating_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Only set enhancement_triggered_at if it's not already set and conditions are met
      if (stats.needsEnhancement && !existingRecord?.enhancement_triggered_at) {
        updateData.enhancement_triggered_at = new Date().toISOString()
        console.log(`🚨 Enhancement triggered for user ${userId} (avg: ${stats.averageRating})`)
      }

      console.log('📊 Upserting rating stats:', updateData)

      const { data, error } = await this.supabase
        .from('user_rating_stats')
        .upsert(updateData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('❌ Error updating user rating stats:', error)
        throw error
      } else {
        console.log('✅ Successfully updated rating stats:', data)
      }
    } catch (error) {
      console.error('❌ Error in updateUserRatingStats:', error)
      throw error
    }
  }

  /**
   * Get recent low-rated advice patterns for context
   */
  async getLowRatedAdvicePatterns(userId: string, limit: number = 3): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('interventions')
        .select('message_payload')
        .eq('user_id', userId)
        .lt('feedback_score', this.RATING_THRESHOLD)
        .not('feedback_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !data) {
        return []
      }

      return data.map((item: any) => item.message_payload?.advice || '').filter((advice: string) => advice.length > 0)
    } catch (error) {
      console.error('Error getting low-rated advice patterns:', error)
      return []
    }
  }

  /**
   * Check if user has shown improvement after enhancement
   */
  async hasRatingImproved(userId: string): Promise<boolean> {
    try {
      const { data: userStats } = await this.supabase
        .from('user_rating_stats')
        .select('enhancement_triggered_at, average_rating')
        .eq('user_id', userId)
        .single()

      if (!userStats?.enhancement_triggered_at) {
        return false
      }

      // Get ratings after enhancement was triggered
      const { data: recentInterventions } = await this.supabase
        .from('interventions')
        .select('feedback_score')
        .eq('user_id', userId)
        .gte('created_at', userStats.enhancement_triggered_at)
        .not('feedback_score', 'is', null)

      if (!recentInterventions || recentInterventions.length === 0) {
        return false
      }

      const recentRatings = recentInterventions.map((item: any) => item.feedback_score as number)
      const recentAverage = recentRatings.reduce((sum: number, rating: number) => sum + rating, 0) / recentRatings.length

      // Consider improved if recent average is above 3.0
      return recentAverage >= 3.0
    } catch (error) {
      console.error('Error checking rating improvement:', error)
      return false
    }
  }

  /**
   * Default rating stats for error cases
   */
  private getDefaultRatingStats(): RatingStats {
    return {
      averageRating: 0,
      totalRatings: 0,
      recentRatings: [],
      needsEnhancement: false,
      ratingsBelow25: 0
    }
  }
}

// Export singleton instance for client-side
export const feedbackAnalyzer = new FeedbackAnalyzer()
