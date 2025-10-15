'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Intervention Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 text-base">{intervention.message_payload.advice}</p>
          <p className="text-sm text-gray-500 mt-2">
            Được tạo: {new Date(intervention.created_at).toLocaleString()}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Rate your feedback (1-5): {feedbackScore !== null ? `(${feedbackScore})` : ''}
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-6 h-6 cursor-pointer ${
                  feedbackScore && star <= feedbackScore ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() => intervention.feedback_score === null && setFeedbackScore(star)}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        {intervention.feedback_score == null && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateFeedback}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
            >
              Save Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
