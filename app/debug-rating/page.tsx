'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugRatingPage() {
  const [user, setUser] = useState<any>(null)
  const [interventions, setInterventions] = useState<any[]>([])
  const [ratingStats, setRatingStats] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get all interventions for this user
        const { data: interventionsData } = await supabase
          .from('interventions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        setInterventions(interventionsData || [])

        // Get rating stats
        const { data: statsData } = await supabase
          .from('user_rating_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setRatingStats(statsData)
      }
    }
    getUser()
  }, [supabase])

  const testDirectRatingUpdate = async () => {
    if (!user) return

    try {
      // Find an intervention without feedback
      const interventionWithoutFeedback = interventions.find(i => i.feedback_score === null)

      if (!interventionWithoutFeedback) {
        alert('No intervention without feedback found')
        return
      }

      console.log('🧪 Testing direct rating update for intervention:', interventionWithoutFeedback.id)

      // Update intervention with feedback directly
      const { data: updatedIntervention, error: updateError } = await supabase
        .from('interventions')
        .update({
          feedback_score: 2,
          feedback_at: new Date().toISOString()
        })
        .eq('id', interventionWithoutFeedback.id)
        .select()

      if (updateError) {
        console.error('❌ Error updating intervention:', updateError)
        return
      }

      console.log('✅ Intervention updated:', updatedIntervention)

      // Now manually calculate what the rating stats should be
      const { data: allRatedInterventions } = await supabase
        .from('interventions')
        .select('feedback_score')
        .eq('user_id', user.id)
        .not('feedback_score', 'is', null)

      console.log('📊 All rated interventions:', allRatedInterventions)

      if (allRatedInterventions && allRatedInterventions.length > 0) {
        const ratings = allRatedInterventions.map(i => i.feedback_score)
        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        const belowThreshold = ratings.filter(r => r < 2.5).length

        console.log('📈 Calculated stats:', {
          totalRatings: ratings.length,
          averageRating: average,
          ratingsBelow25: belowThreshold,
          needsEnhancement: ratings.length >= 3 && average < 2.5
        })

        // Now manually upsert to user_rating_stats
        const { data: upsertResult, error: upsertError } = await supabase
          .from('user_rating_stats')
          .upsert({
            user_id: user.id,
            average_rating: average,
            total_ratings: ratings.length,
            ratings_below_threshold: belowThreshold,
            last_rating_at: new Date().toISOString(),
            enhancement_triggered_at: (ratings.length >= 3 && average < 2.5) ? new Date().toISOString() : null
          }, {
            onConflict: 'user_id'
          })
          .select()

        if (upsertError) {
          console.error('❌ Error upserting rating stats:', upsertError)
        } else {
          console.log('✅ Rating stats upserted:', upsertResult)
          setRatingStats(upsertResult[0])
        }
      }

      // Refresh interventions
      const { data: refreshedInterventions } = await supabase
        .from('interventions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setInterventions(refreshedInterventions || [])

    } catch (error) {
      console.error('❌ Error in test:', error)
    }
  }

  if (!user) {
    return <div className="p-8">Please log in to debug rating system</div>
  }

  const interventionsWithFeedback = interventions.filter(i => i.feedback_score !== null)
  const interventionsWithoutFeedback = interventions.filter(i => i.feedback_score === null)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debug Rating System</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        {/* Rating Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Rating Stats Table</h2>
          {ratingStats ? (
            <div className="space-y-2">
              <p><strong>Average Rating:</strong> {ratingStats.average_rating}</p>
              <p><strong>Total Ratings:</strong> {ratingStats.total_ratings}</p>
              <p><strong>Below Threshold:</strong> {ratingStats.ratings_below_threshold}</p>
              <p><strong>Enhancement Triggered:</strong> {ratingStats.enhancement_triggered_at ? 'Yes' : 'No'}</p>
              <p><strong>Last Rating:</strong> {ratingStats.last_rating_at}</p>
            </div>
          ) : (
            <p className="text-gray-500">No rating stats record found</p>
          )}
        </div>

        {/* Interventions with Feedback */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Interventions with Feedback ({interventionsWithFeedback.length})</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {interventionsWithFeedback.map(intervention => (
              <div key={intervention.id} className="border-b pb-2">
                <p><strong>ID:</strong> {intervention.id.substring(0, 8)}...</p>
                <p><strong>Rating:</strong> {intervention.feedback_score}/5</p>
                <p><strong>Date:</strong> {new Date(intervention.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interventions without Feedback */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Interventions without Feedback ({interventionsWithoutFeedback.length})</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {interventionsWithoutFeedback.map(intervention => (
              <div key={intervention.id} className="border-b pb-2">
                <p><strong>ID:</strong> {intervention.id.substring(0, 8)}...</p>
                <p><strong>Date:</strong> {new Date(intervention.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div className="mt-8 text-center">
        <button
          onClick={testDirectRatingUpdate}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          🧪 Test Direct Rating Update
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will add a rating of 2/5 to the first intervention without feedback
        </p>
      </div>

      {/* Manual Calculation */}
      {interventionsWithFeedback.length > 0 && (
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Manual Calculation</h3>
          <div className="space-y-2">
            <p><strong>Ratings:</strong> {interventionsWithFeedback.map(i => i.feedback_score).join(', ')}</p>
            <p><strong>Average:</strong> {(interventionsWithFeedback.reduce((sum, i) => sum + i.feedback_score, 0) / interventionsWithFeedback.length).toFixed(2)}</p>
            <p><strong>Below 2.5:</strong> {interventionsWithFeedback.filter(i => i.feedback_score < 2.5).length}</p>
            <p><strong>Should trigger enhancement:</strong> {interventionsWithFeedback.length >= 3 && (interventionsWithFeedback.reduce((sum, i) => sum + i.feedback_score, 0) / interventionsWithFeedback.length) < 2.5 ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
