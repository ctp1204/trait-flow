'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckinModal from '@/components/CheckinModal'
import InterventionDetailModal from '@/components/InterventionDetailModal'
import Link from 'next/link'

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

  const fetchInterventions = async () => {
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
  }

  useEffect(() => {
    fetchInterventions()

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
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleCheckinSubmit = (emotion: number, energy: string, notes: string) => {
    // The real-time subscription should handle updating the list
    // No need to explicitly call fetchInterventions here
  }

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
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
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
        <main className="flex-grow flex flex-col items-center justify-start p-8">
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

          {/* Interventions List */}
          <section className="w-full max-w-2xl mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Recent Interventions</h3>
            {loadingInterventions ? (
              <p className="text-gray-600">Loading interventions...</p>
            ) : interventions.length > 0 ? (
              <div className="space-y-4">
                {interventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="bg-white p-4 rounded-lg shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleInterventionClick(intervention)}
                  >
                    <p className="text-gray-800 mb-2">{intervention.message_payload.advice}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        {new Date(intervention.created_at).toLocaleString()}
                      </p>
                      {renderStars(intervention.feedback_score)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No interventions yet. Check in to get some advice!</p>
            )}
          </section>
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
