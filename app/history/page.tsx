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
        <main className="flex-grow flex flex-col items-center justify-center p-8">
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setActiveTab('checkins')}
              className={`py-2 px-4 rounded-l-lg text-sm font-medium ${activeTab === 'checkins' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Check-in History
            </button>
            <button
              onClick={() => setActiveTab('baseline_traits')}
              className={`py-2 px-4 rounded-r-lg text-sm font-medium ${activeTab === 'baseline_traits' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Baseline Traits History
            </button>
          </div>
          <section className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="max-h-[500px] overflow-y-auto">
              {activeTab === 'checkins' && (
                <div className="flex flex-col gap-4 pt-2 px-6 box-border w-full">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Check-in History</h3>
                  {checkins.length > 0 ? (
                    <ul className="space-y-2">
                      {checkins.map((checkin) => (
                        <li key={checkin.id} className="bg-gray-50 p-3 rounded-md shadow-sm">
                          <div className="text-gray-700">
                            <strong>Emotion:</strong> {checkin.mood_score}
                          </div>
                          <div className="text-gray-700">
                            <strong>Energy:</strong> {checkin.energy_level}
                          </div>
                          {checkin.free_text && (
                            <div className="text-gray-700">
                              <strong>Notes:</strong> {checkin.free_text}
                            </div>
                          )}
                          <p className="text-gray-600 text-sm">Created at: {new Date(checkin.created_at).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 px-6">No check-ins found. Perform a check-in to see your history.</p>
                  )}
                </div>
              )}

              {activeTab === 'baseline_traits' && (
                <div className="flex flex-col gap-4 pt-2 px-6 box-border w-full">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Baseline Traits History</h3>
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
                    <p className="text-gray-600 px-6">No baseline traits found. Complete onboarding to see your history.</p>
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
