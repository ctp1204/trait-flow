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
  const [userEmail, setUserEmail] = useState<string | undefined>('')
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loadingInterventions, setLoadingInterventions] = useState(true)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loadingCheckins, setLoadingCheckins] = useState(true)
  const [hasOnboarded, setHasOnboarded] = useState(false)

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
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data } = await supabase
          .from('baseline_traits')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setHasOnboarded(true);
        }
      }
    };

    checkOnboardingStatus()
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
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2"></path></svg>
              <h1 className="text-2xl font-bold text-gray-800">Trait Flow</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-blue-600 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                <span>Dashboard</span>
              </Link>
              <Link href="/history" className="text-gray-600 hover:text-blue-600 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.745A9.863 9.863 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                <span>Messages</span>
              </Link>
              <Link href="/settings" className="text-gray-600 hover:text-blue-600 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                <span>Analytics</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span className="text-gray-600">{userEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-blue-600 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span>Sign out</span>
            </button>
          </div>
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
            {!hasOnboarded && (
              <button
                onClick={() => router.push('/onboarding')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Start Onboarding
              </button>
            )}
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
