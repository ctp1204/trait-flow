import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FeedbackAnalyzer } from '@/lib/services/FeedbackAnalyzer'
import { logRatingImprovement, logLowRating, logApiError, logSuccess } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { interventionId, feedbackScore } = await request.json()

    // Validate input
    if (!interventionId || typeof feedbackScore !== 'number' || feedbackScore < 1 || feedbackScore > 5) {
      return NextResponse.json(
        { error: 'Invalid intervention ID or feedback score' },
        { status: 400 }
      )
    }

    // Get user ID from authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Create FeedbackAnalyzer with server client
    const feedbackAnalyzer = new FeedbackAnalyzer(supabase)

    // Verify the intervention belongs to the user
    const { data: intervention, error: interventionError } = await supabase
      .from('interventions')
      .select('user_id, feedback_score')
      .eq('id', interventionId)
      .single()

    if (interventionError || !intervention) {
      return NextResponse.json(
        { error: 'Intervention not found' },
        { status: 404 }
      )
    }

    if (intervention.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to intervention' },
        { status: 403 }
      )
    }

    // Check if feedback already exists
    if (intervention.feedback_score !== null) {
      return NextResponse.json(
        { error: 'Feedback already provided for this intervention' },
        { status: 400 }
      )
    }

    // Update the intervention with feedback
    const { error: updateError } = await supabase
      .from('interventions')
      .update({
        feedback_score: feedbackScore,
        feedback_at: new Date().toISOString()
      })
      .eq('id', interventionId)

    if (updateError) {
      console.error('Error updating intervention feedback:', updateError)
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      )
    }

    // Update user rating statistics
    try {
      await feedbackAnalyzer.updateUserRatingStats(userId)
      console.log('✅ Rating statistics updated successfully for user:', userId)
    } catch (statsError) {
      console.error('❌ Error updating rating statistics:', statsError)
      // Don't fail the whole request if stats update fails
    }

    // Get updated rating statistics
    const updatedStats = await feedbackAnalyzer.getUserRatingStats(userId)

    // Check if rating has improved after enhancement
    const hasImproved = await feedbackAnalyzer.hasRatingImproved(userId)

    // Log rating improvement if detected
    if (hasImproved) {
      logRatingImprovement(userId, {
        previousAverage: 0, // We don't have previous average here, could be enhanced
        newAverage: updatedStats.averageRating,
        feedbackScore,
        totalRatings: updatedStats.totalRatings
      })
    }

    // Log if this is a low rating that might trigger enhancement
    if (feedbackScore < 2.5) {
      logLowRating(userId, {
        feedbackScore,
        currentAverage: updatedStats.averageRating,
        totalRatings: updatedStats.totalRatings,
        willTriggerEnhancement: updatedStats.needsEnhancement
      })
    }

    // Log successful rating update
    logSuccess('rating', 'Rating statistics updated successfully', {
      userId,
      feedbackScore,
      newAverage: updatedStats.averageRating,
      totalRatings: updatedStats.totalRatings
    })

    return NextResponse.json({
      success: true,
      message: 'Rating statistics updated successfully',
      updatedStats: {
        averageRating: updatedStats.averageRating,
        totalRatings: updatedStats.totalRatings,
        needsEnhancement: updatedStats.needsEnhancement,
        hasImproved
      }
    })

  } catch (error) {
    logApiError('rating', error, { endpoint: 'update-rating-stats' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
