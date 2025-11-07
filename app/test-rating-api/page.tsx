'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestRatingAPIPage() {
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
    console.log(message)
  }

  const testCompleteFlow = async () => {
    if (!user) return

    setLoading(true)
    setLogs([])

    try {
      addLog('🚀 Starting complete rating flow test...')

      // Step 1: Create a test intervention
      addLog('📝 Step 1: Creating test intervention...')

      const { data: checkinData, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          mood_score: 3,
          energy_level: 'mid',
          free_text: 'Test checkin for rating'
        })
        .select('id')
        .single()

      if (checkinError) {
        addLog(`❌ Error creating checkin: ${checkinError.message}`)
        return
      }

      addLog(`✅ Checkin created: ${checkinData.id}`)

      const { data: interventionData, error: interventionError } = await supabase
        .from('interventions')
        .insert({
          user_id: user.id,
          checkin_id: checkinData.id,
          template_type: 'test_advice',
          message_payload: { advice: 'This is a test advice for rating' },
          fallback: false
        })
        .select('id')
        .single()

      if (interventionError) {
        addLog(`❌ Error creating intervention: ${interventionError.message}`)
        return
      }

      addLog(`✅ Intervention created: ${interventionData.id}`)

      // Step 2: Test the rating API
      addLog('📊 Step 2: Testing rating API...')

      const testRating = 2 // Low rating to trigger enhancement

      const response = await fetch('/api/update-rating-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interventionId: interventionData.id,
          feedbackScore: testRating
        }),
      })

      addLog(`📡 API Response status: ${response.status}`)

      const result = await response.json()
      addLog(`📡 API Response body: ${JSON.stringify(result, null, 2)}`)

      if (response.ok && result.success) {
        addLog('✅ API call successful!')
        addLog(`📈 Updated stats: ${JSON.stringify(result.updatedStats)}`)
      } else {
        addLog(`❌ API call failed: ${result.error}`)
      }

      // Step 3: Check if record was created in user_rating_stats
      addLog('🔍 Step 3: Checking user_rating_stats table...')

      const { data: statsRecord, error: statsError } = await supabase
        .from('user_rating_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (statsError) {
        if (statsError.code === 'PGRST116') {
          addLog('❌ No record found in user_rating_stats table!')
        } else {
          addLog(`❌ Error querying user_rating_stats: ${statsError.message}`)
        }
      } else {
        addLog('✅ Record found in user_rating_stats!')
        addLog(`📊 Stats: ${JSON.stringify(statsRecord, null, 2)}`)
      }

      // Step 4: Check intervention was updated
      addLog('🔍 Step 4: Checking intervention was updated...')

      const { data: updatedIntervention, error: checkError } = await supabase
        .from('interventions')
        .select('feedback_score, feedback_at')
        .eq('id', interventionData.id)
        .single()

      if (checkError) {
        addLog(`❌ Error checking intervention: ${checkError.message}`)
      } else {
        addLog(`✅ Intervention feedback_score: ${updatedIntervention.feedback_score}`)
        addLog(`✅ Intervention feedback_at: ${updatedIntervention.feedback_at}`)
      }

      // Step 5: Test FeedbackAnalyzer directly
      addLog('🧪 Step 5: Testing FeedbackAnalyzer directly...')

      try {
        // Import and test FeedbackAnalyzer
        const { feedbackAnalyzer } = await import('@/lib/services/FeedbackAnalyzer')

        const avgRating = await feedbackAnalyzer.calculateUserAverageRating(user.id)
        addLog(`📊 Calculated average rating: ${avgRating}`)

        const shouldUseEnhanced = await feedbackAnalyzer.shouldUseEnhancedPrompt(user.id)
        addLog(`🔧 Should use enhanced prompt: ${shouldUseEnhanced}`)

        const ratingStats = await feedbackAnalyzer.getUserRatingStats(user.id)
        addLog(`📈 Rating stats: ${JSON.stringify(ratingStats)}`)

        // Try manual update
        addLog('🔄 Trying manual updateUserRatingStats...')
        await feedbackAnalyzer.updateUserRatingStats(user.id)
        addLog('✅ Manual update completed')

      } catch (analyzerError) {
        addLog(`❌ FeedbackAnalyzer error: ${analyzerError}`)
      }

    } catch (error) {
      addLog(`❌ Test failed: ${error}`)
    }

    setLoading(false)
  }

  const checkCurrentState = async () => {
    if (!user) return

    setLoading(true)
    addLog('🔍 Checking current state...')

    try {
      // Check interventions with feedback
      const { data: interventions } = await supabase
        .from('interventions')
        .select('id, feedback_score, created_at')
        .eq('user_id', user.id)
        .not('feedback_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      addLog(`📊 Interventions with feedback: ${interventions?.length || 0}`)
      interventions?.forEach((intervention, index) => {
        addLog(`  ${index + 1}. ID: ${intervention.id.substring(0, 8)}... Rating: ${intervention.feedback_score}`)
      })

      // Check user_rating_stats
      const { data: statsRecord, error: statsError } = await supabase
        .from('user_rating_stats')
        .select('*')
        .eq('user_id', user.id)

      if (statsError) {
        addLog(`❌ Error querying user_rating_stats: ${statsError.message}`)
      } else if (!statsRecord || statsRecord.length === 0) {
        addLog('⚠️ No records in user_rating_stats table')
      } else {
        addLog(`✅ Found ${statsRecord.length} record(s) in user_rating_stats`)
        statsRecord.forEach((record, index) => {
          addLog(`  ${index + 1}. Avg: ${record.average_rating}, Total: ${record.total_ratings}`)
        })
      }

    } catch (error) {
      addLog(`❌ Error: ${error}`)
    }

    setLoading(false)
  }

  if (!user) {
    return <div className="p-8">Please log in to test rating API</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Test Rating API</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Info</h2>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <div className="space-x-4 mb-6">
        <button
          onClick={testCompleteFlow}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          🧪 Test Complete Flow
        </button>

        <button
          onClick={checkCurrentState}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          🔍 Check Current State
        </button>

        <button
          onClick={() => setLogs([])}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          🧹 Clear Logs
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
        <h3 className="text-white mb-2">Test Logs:</h3>
        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No logs yet. Click a test button to start.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
