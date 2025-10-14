'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckinModal from '@/components/CheckinModal'
import Link from 'next/link'

interface Intervention {
  id: string;
  created_at: string;
  message_payload: {
    advice: string;
  };
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loadingInterventions, setLoadingInterventions] = useState(true)

  const fetchInterventions = async () => {
    setLoadingInterventions(true)
    const { data, error } = await supabase
      .from('interventions')
      .select('id, created_at, message_payload')
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
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleCheckinSubmit = (emotion: number, energy: string, notes: string) => {
    // Refresh interventions after a successful check-in
    fetchInterventions()
  }

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
              onClick={() => setIsModalOpen(true)}
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
                  <div key={intervention.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <p className="text-gray-800 mb-2">{intervention.message_payload.advice}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(intervention.created_at).toLocaleString()}
                    </p>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCheckinSubmit}
      />
    </>
  )
}
