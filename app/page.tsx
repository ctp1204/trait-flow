'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckinModal from '@/components/CheckinModal'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [baselineTraits, setBaselineTraits] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [todayMessage, setTodayMessage] = useState('')

  useEffect(() => {
    const fetchBaselineTraits = async () => {
      const { data, error } = await supabase
        .from('baseline_traits')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching baseline traits:', error)
      } else {
        setBaselineTraits(data || [])
      }
    }

    fetchBaselineTraits()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleCheckinSubmit = async (emotion: number, energy: string, notes: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from('baseline_traits').insert({
        user_id: user.id,
        traits_result: { emotion, energy, notes },
      })

      if (error) {
        console.error('Error inserting check-in data:', error)
        setTodayMessage('Error saving your check-in. Please try again.')
      } else {
        setTodayMessage(`You checked in with emotion: ${emotion}, energy: ${energy}, and notes: "${notes}".`)
        // Refresh baseline traits to show new entry
        const { data, error: fetchError } = await supabase
          .from('baseline_traits')
          .select('*')
          .order('created_at', { ascending: false })
        if (fetchError) {
          console.error('Error refetching baseline traits:', fetchError)
        } else {
          setBaselineTraits(data || [])
        }
      }
    } else {
      setTodayMessage('You need to be logged in to check-in.')
    }
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">TraitFlow</h1>
          <nav className="flex items-center space-x-4">
            <ul className="flex space-x-4">
              <li><a href="/" className="text-blue-600 hover:text-blue-800">Home</a></li>
              <li><a href="/history" className="text-blue-600 hover:text-blue-800">History</a></li>
              <li><a href="/settings" className="text-blue-600 hover:text-blue-800">Settings</a></li>
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
        <main className="flex-grow flex flex-col items-center justify-center p-8">
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

          {todayMessage && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-8 w-full max-w-2xl" role="alert">
              <p className="font-bold">Today's Message</p>
              <p>{todayMessage}</p>
            </div>
          )}

          <section className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="max-h-[500px] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4 sticky top-0 bg-white pt-0 pb-2 z-10">Baseline Traits History</h3>
              <div className="flex flex-col gap-4 pt-2 px-6 box-border w-full">
                {baselineTraits.length > 0 ? (
                  <ul className="space-y-2">
                    {baselineTraits.map((trait) => (
                      <li key={trait.id} className="bg-gray-50 p-3 rounded-md shadow-sm">
                        <div className="text-gray-700">
                          <strong>Traits:</strong>
                          <ul className="list-disc list-inside ml-4">
                            {Object.entries(trait.traits_result).map(([key, value]) => (
                              <li key={key}>{key}: {String(value)}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-gray-600 text-sm">Created at: {new Date(trait.created_at).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 px-6">No baseline traits found. Perform a check-in to see your history.</p>
                )}
              </div>
            </div>
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
