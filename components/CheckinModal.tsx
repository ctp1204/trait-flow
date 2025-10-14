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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Daily Check-in</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="emotion" className="block text-gray-700 text-sm font-bold mb-2">
            How is your mood today?
          </label>
          <input
            type="range"
            id="emotion"
            min="1"
            max="5"
            value={emotion}
            onChange={(e) => setEmotion(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs px-1 mt-1 text-gray-600">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          <div className="text-center mt-4 bg-gray-100 rounded-lg py-2">
            <span className="text-2xl">{moodEmojis[emotion]}</span>
            <span className="ml-2 text-gray-800">{moodLabels[emotion]} ({emotion}/5)</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            What's your energy level?
          </label>
          <div className="flex justify-around">
            {['Low', 'mid', 'High'].map((level) => (
              <button
                key={level}
                onClick={() => setEnergy(level)}
                className={`flex flex-col items-center justify-center w-32 h-24 rounded-lg border ${
                  energy === level
                    ? 'bg-yellow-100 border-yellow-400'
                    : 'bg-white border-gray-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full mb-2 ${
                    energy === level ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                ></span>
                <span>{level === 'mid' ? 'Medium' : level}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
            Anything else on your mind? (Optional)
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Share what's on your mind today..."
            maxLength={280}
          ></textarea>
          <div className="text-right text-sm text-gray-500 mt-1">
            Optional - helps personalize your coaching {notes.length}/280
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full"
          >
            Submit Check-in
          </button>
        </div>
      </div>
    </div>
  )
}
