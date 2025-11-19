'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emotion: number, energy: string, notes: string, suggestedHabit?: string) => void;
}

export default function CheckinModal({ isOpen, onClose, onSubmit }: CheckinModalProps) {
  const [emotion, setEmotion] = useState(3) // Default emotion to 3
  const [energy, setEnergy] = useState('mid') // Default energy to medium
  const [notes, setNotes] = useState('')
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false)
  const supabase = createClient()
  const { t, locale } = useI18n()

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('User not authenticated.')
      return
    }

    setIsGeneratingAdvice(true)

    try {
      // Insert checkin first
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
        setIsGeneratingAdvice(false)
        return
      }

      const checkinId = checkinData.id;

      // Get user's personality traits for better advice
      const { data: traitsData } = await supabase
        .from('baseline_traits')
        .select('traits_result')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Generate advice using OpenAI
      const adviceResponse = await fetch('/api/generate-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moodScore: emotion,
          energyLevel: energy,
          notes: notes,
          userTraits: traitsData?.traits_result || null,
          locale: locale
        }),
      })

      const {
        advice,
        suggested_habit,
        template_type,
        fallback,
        enhanced_prompt_used,
        prompt_variation_number,
        rating_improvement_triggered,
        user_rating_stats
      } = await adviceResponse.json()

      // Log enhanced prompt usage for debugging
      if (enhanced_prompt_used) {
        console.log('🔧 Enhanced prompt was used for this advice generation', {
          userId: user.id,
          averageRating: user_rating_stats?.average_rating,
          totalRatings: user_rating_stats?.total_ratings,
          variationNumber: prompt_variation_number
        })
      }

      // Insert intervention into the interventions table with enhancement metadata
      const { error: interventionError } = await supabase
        .from('interventions')
        .insert([
          {
            user_id: user.id,
            checkin_id: checkinId,
            template_type: template_type,
            message_payload: { advice: advice },
            fallback: fallback || false,
            rating_improvement_triggered: rating_improvement_triggered || false,
            enhanced_prompt_used: enhanced_prompt_used || false,
            prompt_variation_number: prompt_variation_number || 0,
          },
        ])

      if (interventionError) {
        console.error('Error inserting intervention:', interventionError)
      }

      // Call onSubmit with suggested habit if available
      onSubmit(emotion, energy, notes, suggested_habit)

    } catch (error) {
      console.error('Error in handleSubmit:', error)
    } finally {
      setIsGeneratingAdvice(false)
      onClose() // Close modal after submission
      // Reset form fields
      setEmotion(3)
      setEnergy('mid')
      setNotes('')
    }
  }



  const moodLabels: { [key: number]: string } = {
    1: t('checkin.moodLabels.1'),
    2: t('checkin.moodLabels.2'),
    3: t('checkin.moodLabels.3'),
    4: t('checkin.moodLabels.4'),
    5: t('checkin.moodLabels.5')
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
              <h2 className="text-lg font-bold text-white">{t('checkin.dailyCheckin')}</h2>
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
                {t('checkin.moodQuestion')}
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
                <span className="font-medium">{t('checkin.veryLow')}</span>
                <span className="font-medium">{t('checkin.neutral')}</span>
                <span className="font-medium">{t('checkin.veryHigh')}</span>
              </div>

              <div className="text-center mt-3 bg-white/60 rounded-lg py-2 border border-white/40">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">{moodEmojis[emotion]}</span>
                  <div>
                    <div className="text-base font-bold text-gray-800">{moodLabels[emotion]}</div>
                    <div className="text-xs text-gray-600">{t('checkin.score')}: {emotion}/5</div>
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
                {t('checkin.energyQuestion')}
              </label>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-100">
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'mid', 'High'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`group flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-300 ${energy === level
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-500 shadow-md scale-105'
                      : 'bg-white/60 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mb-1.5 transition-all duration-300 ${energy === level
                        ? 'bg-white shadow-sm'
                        : level === 'Low'
                          ? 'bg-red-400'
                          : level === 'mid'
                            ? 'bg-yellow-400'
                            : 'bg-green-400'
                        }`}
                    ></div>
                    <span className={`text-sm font-medium ${energy === level ? 'text-white' : 'text-gray-700'
                      }`}>
                      {level === 'mid' ? t('checkin.medium') : level === 'Low' ? t('checkin.low') : t('checkin.high')}
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
                {t('checkin.notesQuestion')}
              </label>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-100">
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white/60 border border-green-200 rounded-lg text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                placeholder={t('checkin.notesPlaceholder')}
                maxLength={280}
              ></textarea>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {t('checkin.notesHelper')}
                </span>
                <span className={`text-xs font-medium ${notes.length > 250 ? 'text-red-500' : 'text-gray-500'
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
              disabled={isGeneratingAdvice}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl disabled:transform-none disabled:shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                {isGeneratingAdvice ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-base">{t('checkin.generatingAdvice')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    <span className="text-base">{t('checkin.submitCheckin')}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
