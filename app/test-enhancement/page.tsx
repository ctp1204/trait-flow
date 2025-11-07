'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { feedbackAnalyzer } from '@/lib/services/FeedbackAnalyzer'
import { enhancementLogger } from '@/lib/utils/logger'

export default function TestEnhancementPage() {
  const [user, setUser] = useState<any>(null)
  const [ratingStats, setRatingStats] = useState<any>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const stats = await feedbackAnalyzer.getUserRatingStats(user.id)
        setRatingStats(stats)
      }
    }
    getUser()
  }, [supabase])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testRatingCalculation = async () => {
    if (!user) return

    setLoading(true)
    addTestResult('🧪 Testing rating calculation...')

    try {
      const avgRating = await feedbackAnalyzer.calculateUserAverageRating(user.id)
      const shouldUseEnhanced = await feedbackAnalyzer.shouldUseEnhancedPrompt(user.id)
      const stats = await feedbackAnalyzer.getUserRatingStats(user.id)

      addTestResult(`✅ Average rating: ${avgRating}`)
      addTestResult(`✅ Should use enhanced prompt: ${shouldUseEnhanced}`)
      addTestResult(`✅ Total ratings: ${stats.totalRatings}`)
      addTestResult(`✅ Needs enhancement: ${stats.needsEnhancement}`)

      setRatingStats(stats)
    } catch (error) {
      addTestResult(`❌ Error: ${error}`)
    }

    setLoading(false)
  }

  const testAdviceGeneration = async () => {
    if (!user) return

    setLoading(true)
    addTestResult('🧪 Testing advice generation...')

    try {
      const response = await fetch('/api/generate-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodScore: 2,
          energyLevel: 'low',
          notes: 'Test advice generation',
          userTraits: null,
          locale: 'vi'
        })
      })

      const result = await response.json()

      addTestResult(`✅ Advice generated: ${result.advice?.substring(0, 50)}...`)
      addTestResult(`✅ Enhanced prompt used: ${result.enhanced_prompt_used}`)
      addTestResult(`✅ Template type: ${result.template_type}`)
      addTestResult(`✅ Variation number: ${result.prompt_variation_number}`)

    } catch (error) {
      addTestResult(`❌ Error: ${error}`)
    }

    setLoading(false)
  }

  const testFeedbackUpdate = async () => {
    if (!user) return

    setLoading(true)
    addTestResult('🧪 Testing feedback update...')

    try {
      // First get a recent intervention
      const { data: interventions } = await supabase
        .from('interventions')
        .select('id, feedback_score')
        .eq('user_id', user.id)
        .is('feedback_score', null)
        .limit(1)

      if (!interventions || interventions.length === 0) {
        addTestResult('❌ No interventions without feedback found')
        setLoading(false)
        return
      }

      const interventionId = interventions[0].id
      const testRating = 2 // Low rating to test enhancement trigger

      const response = await fetch('/api/update-rating-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interventionId,
          feedbackScore: testRating
        })
      })

      const result = await response.json()

      if (result.success) {
        addTestResult(`✅ Feedback updated successfully`)
        addTestResult(`✅ New average rating: ${result.updatedStats.averageRating}`)
        addTestResult(`✅ Needs enhancement: ${result.updatedStats.needsEnhancement}`)
        addTestResult(`✅ Has improved: ${result.updatedStats.hasImproved}`)
      } else {
        addTestResult(`❌ Error: ${result.error}`)
      }

    } catch (error) {
      addTestResult(`❌ Error: ${error}`)
    }

    setLoading(false)
  }

  const viewLogs = () => {
    const recentLogs = enhancementLogger.getRecentLogs(10)
    addTestResult('📋 Recent logs:')
    recentLogs.forEach(log => {
      addTestResult(`  ${log.level.toUpperCase()}: ${log.message}`)
    })

    const successRate = enhancementLogger.getEnhancementSuccessRate()
    addTestResult(`📊 Enhancement success rate: ${successRate.successRate}% (${successRate.successfulImprovements}/${successRate.totalEnhancements})`)
  }

  const checkRatingStatsTable = async () => {
    if (!user) return

    setLoading(true)
    addTestResult('🔍 Checking user_rating_stats table...')

    try {
      // Check if record exists
      const { data: statsRecord, error } = await supabase
        .from('user_rating_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        addTestResult(`❌ Error querying user_rating_stats: ${error.message}`)
      } else if (!statsRecord) {
        addTestResult(`⚠️ No user_rating_stats record found for user`)
        addTestResult(`💡 This will be created when you provide feedback on an intervention`)
      } else {
        addTestResult(`✅ user_rating_stats record found:`)
        addTestResult(`   - User ID: ${statsRecord.user_id}`)
        addTestResult(`   - Average Rating: ${statsRecord.average_rating}`)
        addTestResult(`   - Total Ratings: ${statsRecord.total_ratings}`)
        addTestResult(`   - Ratings Below 2.5: ${statsRecord.ratings_below_threshold}`)
        addTestResult(`   - Enhancement Triggered: ${statsRecord.enhancement_triggered_at || 'No'}`)
        addTestResult(`   - Last Rating: ${statsRecord.last_rating_at || 'Never'}`)
        addTestResult(`   - Created: ${statsRecord.created_at}`)
        addTestResult(`   - Updated: ${statsRecord.updated_at}`)
      }

      // Also check interventions with feedback
      const { data: interventionsWithFeedback } = await supabase
        .from('interventions')
        .select('id, feedback_score, created_at')
        .eq('user_id', user.id)
        .not('feedback_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (interventionsWithFeedback && interventionsWithFeedback.length > 0) {
        addTestResult(`📊 Recent interventions with feedback:`)
        interventionsWithFeedback.forEach((intervention, index) => {
          addTestResult(`   ${index + 1}. Rating: ${intervention.feedback_score}/5 (${new Date(intervention.created_at).toLocaleDateString()})`)
        })
      } else {
        addTestResult(`⚠️ No interventions with feedback found`)
        addTestResult(`💡 Try rating some advice first to see the system in action`)
      }

    } catch (error) {
      addTestResult(`❌ Error: ${error}`)
    }

    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to test enhancement system</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Feedback Enhancement System Test</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>

          {ratingStats && (
            <div className="mt-4">
              <h3 className="font-semibold">Current Rating Stats:</h3>
              <p>Average Rating: {ratingStats.averageRating}</p>
              <p>Total Ratings: {ratingStats.totalRatings}</p>
              <p>Needs Enhancement: {ratingStats.needsEnhancement ? 'Yes' : 'No'}</p>
              <p>Ratings Below 2.5: {ratingStats.ratingsBelow25}</p>
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testRatingCalculation}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Rating Calc
            </button>

            <button
              onClick={testAdviceGeneration}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Advice Gen
            </button>

            <button
              onClick={testFeedbackUpdate}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test Feedback
            </button>

            <button
              onClick={viewLogs}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              View Logs
            </button>
          </div>

          <button
            onClick={clearResults}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p>No test results yet. Click a test button to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">{result}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
