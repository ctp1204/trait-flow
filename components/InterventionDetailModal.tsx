'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'

interface InterventionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: {
    id: string;
    created_at: string;
    message_payload: {
      advice: string;
    };
    fallback: boolean | null;
    feedback_score: number | null;
  } | null;
  onUpdate: () => void;
}

export default function InterventionDetailModal({ isOpen, onClose, intervention, onUpdate }: InterventionDetailModalProps) {
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null)
  const supabase = createClient()
  const { t } = useI18n()

  useEffect(() => {
    if (intervention) {
      setFeedbackScore(intervention.feedback_score)
    }
  }, [intervention])

  if (!isOpen || !intervention) return null;

  const handleUpdateFeedback = async () => {
    if (!intervention) return;

    const { error } = await supabase
      .from('interventions')
      .update({
        fallback: true,
        feedback_score: feedbackScore,
        feedback_at: new Date().toISOString(), // Add this line to update feedback_at
      })
      .eq('id', intervention.id)

    if (error) {
      console.error('Error updating intervention feedback:', error)
    } else {
      onUpdate()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">{t('intervention.interventionDetails')}</h2>
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
          {/* Advice Content */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-md">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.745A9.863 9.863 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <label className="text-base font-semibold text-gray-800">
                {t('intervention.adviceForYou')}
              </label>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
              <p className="text-gray-700 text-base leading-relaxed">{intervention.message_payload.advice}</p>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-gray-500 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {t('intervention.createdAt')}: {new Date(intervention.created_at).toLocaleDateString()} {new Date(intervention.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-yellow-100 rounded-md">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              <label className="text-base font-semibold text-gray-800">
                {t('intervention.rateAdvice')}
              </label>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-100">
              <div className="flex items-center justify-center space-x-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => intervention.feedback_score === null && setFeedbackScore(star)}
                    disabled={intervention.feedback_score !== null}
                    className={`transition-all duration-200 ${
                      intervention.feedback_score === null ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <svg
                      className={`w-8 h-8 ${
                        feedbackScore && star <= feedbackScore ? 'text-yellow-400' : 'text-gray-300'
                      } ${intervention.feedback_score === null ? 'hover:text-yellow-300' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>

              {feedbackScore !== null && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-white/60 px-3 py-1.5 rounded-full">
                    <span className="text-sm font-medium text-gray-700">
                      {intervention.feedback_score !== null ? t('intervention.alreadyRated') : t('intervention.yourRating')}
                    </span>
                    <span className="text-sm font-bold text-yellow-600">{feedbackScore}/5 {t('intervention.stars')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {intervention.feedback_score === null && (
            <div className="flex space-x-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-300 ease-in-out"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateFeedback}
                disabled={feedbackScore === null}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl disabled:transform-none disabled:shadow-lg"
              >
                {t('intervention.saveRating')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
