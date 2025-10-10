'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function HistoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checkins, setCheckins] = useState<any[]>([])
  const [baselineTraits, setBaselineTraits] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'checkins' | 'baseline_traits'>('checkins')

  const fetchCheckins = async () => {
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching checkins:', error)
    } else {
      setCheckins(data || [])
    }
  }

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

  useEffect(() => {
    fetchCheckins()
    fetchBaselineTraits()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
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
        <main className="flex-grow flex flex-col items-center p-8"> {/* Removed justify-center */}
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Your History</h2> {/* Added a main title */}
          <div className="flex justify-center mb-6"> {/* Adjusted margin-bottom */}
            <button
              onClick={() => setActiveTab('checkins')}
              className={`py-3 px-8 rounded-l-lg text-lg font-bold transition duration-300 ease-in-out ${activeTab === 'checkins' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Check-in History
            </button>
            <button
              onClick={() => setActiveTab('baseline_traits')}
              className={`py-3 px-8 rounded-r-lg text-lg font-bold transition duration-300 ease-in-out ${activeTab === 'baseline_traits' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Baseline Traits History
            </button>
          </div>

          <section className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-8"> {/* Increased max-w and padding */}
            <div className="max-h-[500px] overflow-y-auto"> {/* Increased max-h */}
              {activeTab === 'checkins' && (
                <div className="flex flex-col gap-5"> {/* Increased gap */}
                  {checkins.length > 0 ? (
                    <ul className="space-y-4"> {/* Increased space-y */}
                      {checkins.map((checkin) => (
                        <li key={checkin.id} className="bg-blue-50 p-5 rounded-lg shadow-md border border-blue-200"> {/* Enhanced styling */}
                          <p className="text-gray-800 text-lg mb-1">
                            <strong>Emotion:</strong> <span className="font-semibold">{checkin.mood_score}</span>
                          </p>
                          <p className="text-gray-800 text-lg mb-1">
                            <strong>Energy:</strong> <span className="font-semibold capitalize">{checkin.energy_level}</span>
                          </p>
                          {checkin.free_text && (
                            <p className="text-gray-800 text-lg mb-1">
                              <strong>Notes:</strong> <span className="italic">{checkin.free_text}</span>
                            </p>
                          )}
                          <p className="text-gray-600 text-sm mt-2">Checked in: {new Date(checkin.created_at).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-center py-10">No check-ins found. Perform a check-in to see your history.</p>
                  )}
                </div>
              )}

              {activeTab === 'baseline_traits' && (
                <div className="flex flex-col gap-5"> {/* Increased gap */}
                  {baselineTraits.length > 0 ? (
                    <ul className="space-y-4"> {/* Increased space-y */}
                      {baselineTraits.map((trait) => (
                        <li key={trait.id} className="bg-green-50 p-5 rounded-lg shadow-md border border-green-200"> {/* Enhanced styling */}
                          <p className="text-gray-800 text-lg mb-1"><strong>Traits:</strong></p>
                          <ul className="list-disc list-inside ml-6 text-gray-700 text-base"> {/* Adjusted styling */}
                            {Object.entries(trait.traits_result).map(([key, value]) => (
                              <li key={key} className="mb-1">{key}: <span className="font-medium">{String(value)}</span></li>
                            ))}
                          </ul>
                          <p className="text-gray-600 text-sm mt-2">Created at: {new Date(trait.created_at).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-center py-10">No baseline traits found. Complete onboarding to see your history.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white p-4 text-center">
          <p>&copy; 2025 My App. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}
