'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckinModal from '@/components/CheckinModal'
import InterventionDetailModal from '@/components/InterventionDetailModal'
import Link from 'next/link'

interface Checkin {
  id: string;
  user_id: string;
  mood_score: number;
  energy_level: string;
  free_text: string;
  created_at: string;
}

interface Intervention {
  id: string;
  created_at: string;
  message_payload: {
    advice: string;
  };
  fallback: boolean | null;
  feedback_score: number | null;
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loadingInterventions, setLoadingInterventions] = useState(true)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loadingCheckins, setLoadingCheckins] = useState(true)

  const fetchInterventions = useCallback(async () => {
    setLoadingInterventions(true)
    const { data, error } = await supabase
      .from('interventions')
      .select('id, created_at, message_payload, fallback, feedback_score')
      .order('created_at', { ascending: false })
      .limit(5) // Display last 5 interventions

    if (error) {
      console.error('Error fetching interventions:', error)
    } else {
      setInterventions(data || [])
    }
    setLoadingInterventions(false)
  }, [supabase])

  const fetchCheckins = useCallback(async () => {
    setLoadingCheckins(true)
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5) // Display last 5 check-ins

    if (error) {
      console.error('Error fetching checkins:', error)
    } else {
      setCheckins(data || [])
    }
    setLoadingCheckins(false)
  }, [supabase])

  useEffect(() => {
    fetchInterventions()
    fetchCheckins()

    const channel = supabase
      .channel('interventions_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interventions' }, payload => {
        // Assuming payload.new contains the full intervention object
        setInterventions(prev => [payload.new as Intervention, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchInterventions, fetchCheckins])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleCheckinSubmit = () => {}

  const handleInterventionClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention)
    setIsDetailModalOpen(true)
  }

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false)
    setSelectedIntervention(null)
  }

  const handleInterventionUpdate = () => {
    fetchInterventions() // Re-fetch interventions after feedback is submitted
  }

  const renderStars = (score: number | null) => {
    if (score === null) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < score ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 w-full z-10">
          <h1 className="text-2xl font-bold text-gray-800">TraitFlow</h1>
          <nav className="flex items-center space-x-4">
            <ul className="flex space-x-4">
              <li><Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link></li>
              <li><Link href="/history" className="text-blue-600 hover:text-blue-800">History</Link></li>
              <li><Link href="/settings" className="text-blue-600 hover:text-blue-800">Settings</Link></li>
            </ul>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              Sign Out
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-start p-8 pt-20 mt-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Welcome Home!</h2>
          <p className="text-lg text-gray-700 mb-8 max-w-md text-center">
            This is your personalized dashboard. Get ready to explore and manage your activities.
          </p>

          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setIsCheckinModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              Check-in Now
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              Start Onboarding
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mt-8">
            {/* Recent Check-ins */}
            <section className="w-full md:w-1/2 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Recent Check-ins</h3>
              {loadingCheckins ? (
                <p className="text-gray-600">Loading check-ins...</p>
              ) : checkins.length > 0 ? (
                <div className="space-y-4">
                  {checkins.map((checkin) => (
                    <div key={checkin.id} className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {checkin.mood_score >= 4 ? '😊' : checkin.mood_score >= 2 ? '😐' : '😞'}
                          </span>
                          <span className="text-2xl">
                            {checkin.energy_level === 'high' ? '⚡' : checkin.energy_level === 'medium' ? '🔋' : '🪫'}
                          </span>
                          <p className="text-gray-800 text-lg font-semibold">
                            Mood: {checkin.mood_score}/5 • Energy: {checkin.energy_level}
                          </p>
                        </div>
                        <p className="text-gray-500 text-sm">
                          {new Date(checkin.created_at).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(checkin.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {checkin.free_text && (
                        <p className="text-gray-700 text-base italic border-l-4 border-gray-200 pl-3 py-1">
                          &quot;{checkin.free_text}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No check-ins yet. Check in to see your history!</p>
              )}
            </section>

            {/* Recent Interventions */}
            <section className="w-full md:w-1/2 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Recent Interventions</h3>
              {loadingInterventions ? (
                <p className="text-gray-600">Loading interventions...</p>
              ) : interventions.length > 0 ? (
                <div className="space-y-4">
                  {interventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="bg-white p-5 rounded-lg shadow-lg cursor-pointer hover:bg-blue-50 hover:shadow-xl transition-all duration-300 ease-in-out"
                      onClick={() => handleInterventionClick(intervention)}
                    >
                      <p className="text-gray-800 text-base mb-3 leading-relaxed">{intervention.message_payload.advice}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{new Date(intervention.created_at).toLocaleString()}</span>
                        {renderStars(intervention.feedback_score)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No interventions yet. Check in to get some advice!</p>
              )}
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white p-4 text-center">
          <p>&copy; 2025 My App. All rights reserved.</p>
        </footer>
      </div>
      <CheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        onSubmit={handleCheckinSubmit}
      />
      <InterventionDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        intervention={selectedIntervention}
        onUpdate={handleInterventionUpdate}
      />
    </>
  )
}
