'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestRatingUpdatePage() {
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

  const testRatingUpdate = async () => {
    if (!user) return

    setLoading(true)
    setLogs([])

    try {
      addLog('🧪 Testing rating update with existing interventions...')

      // Step 1: Check current interventions with feedback
      const { data: interventions } = await supabase
        .from('interventions')
        .select('id, feedback_score, created_at')
        .eq('user_id', user.id)
        .not('feedback_score', 'is', null)
        .order('created_at', { ascending: false })

      addLog(`📊 Found ${interventions?.length || 0} interventions with feedback`)
      interventions?.forEach((intervention, index) => {
        addLog(`  ${index + 1}. ID: ${intervention.id.substring(0, 8)}... Rating: ${intervention.feedback_score}`)
      })

      if (!interventions || interventions.length === 0) {
        addLog('❌ No interventions with feedback found. Please rate some advice first.')
        setLoading(false)
        return
      }

      // Step 2: Check current user_rating_stats
      const { data: currentStats } = await supabase
        .from('user_rating_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (currentStats) {
        addLog(`📈 Current stats: avg=${currentStats.average_rating}, total=${currentStats.total_ratings}`)
      } else {
        addLog('⚠️ No current stats record found')
      }

      // Step 3: Calculate what stats SHOULD be
      const ratings = interventions.map(i => i.feedback_score)
      const expectedAverage = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      const expectedBelow25 = ratings.filter(r => r < 2.5).length

      addLog(`🎯 Expected stats: avg=${expectedAverage.toFixed(2)}, total=${ratings.length}, below2.5=${expectedBelow25}`)

      // Step 4: Call the update API manually
      addLog('🔄 Calling update-rating-stats API...')

      // Use the last intervention for testing
      const lastIntervention = interventions[0]

      const response = await fetch('/api/update-rating-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interventionId: lastIntervention.id,
          feedbackScore: lastIntervention.feedback_score
        }),
      })

      const result = await response.json()

      if (response.ok) {
        addLog(`✅ API Response: ${JSON.stringify(result.updatedStats)}`)
      } else {
        addLog(`❌ API Error: ${result.error}`)
      }

      // Step 5: Check updated stats
      const { data: updatedStats } = await supabase
        .from('user_rating_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (updatedStats) {
        addLog(`📊 Updated stats: avg=${updatedStats.average_rating}, total=${updatedStats.total_ratings}`)

        // Compare with expected
        if (updatedStats.total_ratings === ratings.length) {
          addLog('✅ Total ratings matches expected!')
        } else {
          addLog(`❌ Total ratings mismatch! Expected: ${ratings.length}, Got: ${updatedStats.total_ratings}`)
        }

        if (Math.abs(updatedStats.average_rating - expectedAverage) < 0.01) {
          addLog('✅ Average rating matches expected!')
        } else {
          addLog(`❌ Average rating mismatch! Expected: ${expectedAverage.toFixed(2)}, Got: ${updatedStats.average_rating}`)
        }
      } else {
        addLog('❌ No updated stats found!')
      }

    } catch (error) {
      addLog(`❌ Test failed: ${error}`)
    }

    setLoading(false)
  }

  const manualRecalculate = async () => {
    if (!user) return

    setLoading(true)
    addLog('🔧 Manual recalculation...')

    try {
      // Get all interventions with feedback
      const { data: interventions } = await supabase
        .from('interventions')
        .select('feedback_score')
        .eq('user_id', user.id)
        .not('feedback_score', 'is', null)

      if (!interventions || interventions.length === 0) {
        addLog('❌ No interventions found')
        setLoading(false)
        return
      }

      const ratings = interventions.map(i => i.feedback_score)
      const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      const belowThreshold = ratings.filter(r => r < 2.5).length

      addLog(`📊 Manual calculation: ${ratings.length} ratings, avg=${average.toFixed(2)}`)

      // Manually upsert correct data
      const { data: result, error } = await supabase
        .from('user_rating_stats')
        .upsert({
          user_id: user.id,
          average_rating: average,
          total_ratings: ratings.length,
          ratings_below_threshold: belowThreshold,
          last_rating_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()

      if (error) {
        addLog(`❌ Manual upsert error: ${error.message}`)
      } else {
        addLog(`✅ Manual upsert successful: ${JSON.stringify(result)}`)
      }

    } catch (error) {
      addLog(`❌ Manual recalculation failed: ${error}`)
    }

    setLoading(false)
  }

  if (!user) {
    return <div className="p-8">Please log in to test rating updates</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Test Rating Update Logic</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Info</h2>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <div className="space-x-4 mb-6">
        <button
          onClick={testRatingUpdate}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          🧪 Test Rating Update
        </button>

        <button
          onClick={manualRecalculate}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          🔧 Manual Recalculate
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
