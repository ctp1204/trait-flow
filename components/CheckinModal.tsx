'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emotion: number, energy: string, notes: string) => void;
}

export default function CheckinModal({ isOpen, onClose, onSubmit }: CheckinModalProps) {
  const [emotion, setEmotion] = useState(3) // Default emotion to 3
  const [energy, setEnergy] = useState('mid') // Default energy to medium
  const [notes, setNotes] = useState('')
  const supabase = createClient()

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('User not authenticated.')
      return
    }

    const { data: checkinData, error } = await supabase
      .from('checkins')
      .insert([
        {
          user_id: user.id,
          mood_score: emotion,
          energy_level: energy.toLowerCase(),
          free_text: notes,
        },
      ])
      .select('id')
      .single()

    if (error) {
      console.error('Error inserting checkin:', error)
      return
    }

    const checkinId = checkinData.id;

    onSubmit(emotion, energy, notes)

    // Generate advice based on emotion and notes
    const { template_type, message } = generateAdvice(emotion, notes)

    // Insert intervention into the interventions table
    const { error: interventionError } = await supabase
      .from('interventions')
      .insert([
        {
          user_id: user.id,
          checkin_id: checkinId,
          template_type: template_type,
          message_payload: { advice: message },
        },
      ])

    if (interventionError) {
      console.error('Error inserting intervention:', interventionError)
      // Continue without returning, as checkin was successful
    }

    onClose() // Close modal after submission
    // Reset form fields
    setEmotion(3)
    setEnergy('mid')
    setNotes('')
  }

  const generateAdvice = (emotionScore: number, userNotes: string): { template_type: string, message: string } => {
    let advice = ''
    let templateType = 'general_advice'

    if (emotionScore <= 2) {
      advice = "It sounds like you're having a tough time. Remember to be kind to yourself. Perhaps try a short mindfulness exercise or connect with a friend."
      templateType = 'supportive_advice'
    } else if (emotionScore === 3) {
      advice = "You're feeling neutral today. Sometimes a small change can make a big difference. Consider a quick walk or listening to your favorite music."
      templateType = 'neutral_boost'
    } else if (emotionScore >= 4) {
      advice = "Great to hear you're doing well! Keep up the positive momentum. What's one small thing you can do to maintain this feeling?"
      templateType = 'positive_reinforcement'
    }

    if (userNotes.length > 0) {
      advice += ` Your notes indicate: "${userNotes}". Reflect on these thoughts and see if there are any actionable steps you can take.`
    }

    return { template_type: templateType, message: advice };
  }

  const moodLabels: { [key: number]: string } = {
    1: 'Bad',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Great'
  }

  const moodEmojis: { [key: number]: string } = {
    1: '😞',
    2: '😟',
    3: '😐',
    4: '😄',
    5: '😁'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Daily Check-in</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">

          {/* Mood Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <label htmlFor="emotion" className="text-base font-semibold text-gray-800">
                How is your mood today?
              </label>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <input
                type="range"
                id="emotion"
                min="1"
                max="5"
                value={emotion}
                onChange={(e) => setEmotion(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #fca5a5 0%, #fde047 50%, #86efac 100%)`
                }}
              />
              <div className="flex justify-between text-xs px-1 mt-1 text-gray-600">
                <span className="font-medium">Very Low</span>
                <span className="font-medium">Neutral</span>
                <span className="font-medium">Very High</span>
              </div>

              <div className="text-center mt-3 bg-white/60 rounded-lg py-2 border border-white/40">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">{moodEmojis[emotion]}</span>
                  <div>
                    <div className="text-base font-bold text-gray-800">{moodLabels[emotion]}</div>
                    <div className="text-xs text-gray-600">Score: {emotion}/5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-yellow-100 rounded-md">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <label className="text-base font-semibold text-gray-800">
                What's your energy level?
              </label>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-100">
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'mid', 'High'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`group flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-300 ${
                      energy === level
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-500 shadow-md scale-105'
                        : 'bg-white/60 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mb-1.5 transition-all duration-300 ${
                        energy === level
                          ? 'bg-white shadow-sm'
                          : level === 'Low'
                            ? 'bg-red-400'
                            : level === 'mid'
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                      }`}
                    ></div>
                    <span className={`text-sm font-medium ${
                      energy === level ? 'text-white' : 'text-gray-700'
                    }`}>
                      {level === 'mid' ? 'Medium' : level}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-md">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              <label htmlFor="notes" className="text-base font-semibold text-gray-800">
                Anything else on your mind? (Optional)
              </label>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-100">
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white/60 border border-green-200 rounded-lg text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                placeholder="Share what's on your mind today..."
                maxLength={280}
              ></textarea>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  Optional - helps personalize your coaching
                </span>
                <span className={`text-xs font-medium ${
                  notes.length > 250 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {notes.length}/280
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <span className="text-base">Submit Check-in</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
