'use client'

import React, { useState } from 'react'

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emotion: number, energy: string, notes: string) => void;
}

export default function CheckinModal({ isOpen, onClose, onSubmit }: CheckinModalProps) {
  const [emotion, setEmotion] = useState(3) // Default emotion to 3
  const [energy, setEnergy] = useState('medium') // Default energy to medium
  const [notes, setNotes] = useState('')

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(emotion, energy, notes)
    onClose() // Close modal after submission
    // Reset form fields
    setEmotion(3)
    setEnergy('medium')
    setNotes('')
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">How are you feeling today?</h2>

        <div className="mb-4">
          <label htmlFor="emotion" className="block text-gray-700 text-sm font-bold mb-2">
            Emotion (1-5):
          </label>
          <input
            type="range"
            id="emotion"
            min="1"
            max="5"
            value={emotion}
            onChange={(e) => setEmotion(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer range-lg"
          />
          <div className="flex justify-between text-xs px-2 mt-1 text-gray-600">
            <span>1 (Bad)</span>
            <span>2</span>
            <span>3 (Neutral)</span>
            <span>4</span>
            <span>5 (Great)</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Energy Level:
          </label>
          <div className="flex justify-around">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="energy"
                value="low"
                checked={energy === 'low'}
                onChange={() => setEnergy('low')}
              />
              <span className="ml-2 text-gray-700">Low</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="energy"
                value="medium"
                checked={energy === 'medium'}
                onChange={() => setEnergy('medium')}
              />
              <span className="ml-2 text-gray-700">Medium</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="energy"
                value="high"
                checked={energy === 'high'}
                onChange={() => setEnergy('high')}
              />
              <span className="ml-2 text-gray-700">High</span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
            Notes (optional):
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Any thoughts or observations?"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
          >
            Submit Check-in
          </button>
        </div>
      </div>
    </div>
  )
}
