'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const tipiQuestions = [
  {
    trait: 'Extraversion',
    question: 'I see myself as extraverted, enthusiastic.',
    reverse: false,
  },
  {
    trait: 'Agreeableness',
    question: 'I see myself as critical, quarrelsome.',
    reverse: true,
  },
  {
    trait: 'Conscientiousness',
    question: 'I see myself as dependable, self-disciplined.',
    reverse: false,
  },
  {
    trait: 'Emotional Stability',
    question: 'I see myself as anxious, easily upset.',
    reverse: true,
  },
  {
    trait: 'Openness to Experiences',
    question: 'I see myself as open to new experiences, complex.',
    reverse: false,
  },
  {
    trait: 'Extraversion',
    question: 'I see myself as reserved, quiet.',
    reverse: true,
  },
  {
    trait: 'Agreeableness',
    question: 'I see myself as sympathetic, warm.',
    reverse: false,
  },
  {
    trait: 'Conscientiousness',
    question: 'I see myself as disorganized, careless.',
    reverse: true,
  },
  {
    trait: 'Emotional Stability',
    question: 'I see myself as calm, emotionally stable.',
    reverse: false,
  },
  {
    trait: 'Openness to Experiences',
    question: 'I see myself as conventional, uncreative.',
    reverse: true,
  },
];

type Trait = 'Extraversion' | 'Agreeableness' | 'Conscientiousness' | 'Emotional Stability' | 'Openness to Experiences';

export default function OnboardingPage() {
  const [answers, setAnswers] = useState<number[]>(new Array(tipiQuestions.length).fill(-1));
  const [currentPage, setCurrentPage] = useState(0); // 0 for welcome, 1-10 for questions, 11 for results
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState('');

  const handleStart = () => {
    setCurrentPage(1);
  };

  const handleAnswerChange = (questionIndex: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const results = calculateResults();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage('User not logged in. Please sign in to save your results.');
      return;
    }

    try {
      const { error } = await supabase
        .from('baseline_traits')
        .insert({
          user_id: user.id,
          traits_result: results,
          administered_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving traits:', error);
        setMessage('Failed to save onboarding results.');
      } else {
        setMessage('Onboarding results saved successfully!');
        setCurrentPage(tipiQuestions.length + 1); // Go to results page
      }
    } catch (error) {
      console.error('Error saving traits:', error);
      setMessage('An unexpected error occurred while saving results.');
    }
  };

  const calculateResults = () => {
    const scores: Record<Trait, number> = {
      Extraversion: 0,
      Agreeableness: 0,
      Conscientiousness: 0,
      'Emotional Stability': 0,
      'Openness to Experiences': 0,
    };

    tipiQuestions.forEach((q, index) => {
      let value = answers[index];
      if (q.reverse) {
        value = 8 - value;
      }
      scores[q.trait as Trait] += value;
    });

    // Normalize to a 0-100 scale (average of two questions per trait, each 1-7)
    for (const trait in scores) {
      const typedTrait = trait as Trait;
      scores[typedTrait] = Math.round(((scores[typedTrait] / 2 - 1) / 6) * 100);
    }

    return scores;
  };

  const renderContent = () => {
    if (currentPage === 0) {
      return (
        <div className="p-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4">
              Welcome to TIPI
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              This is a short personality test that will help us understand your unique traits.
              It includes 10 questions and will take about 3 minutes to complete.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">Start Assessment</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </div>
          </button>
        </div>
      );
    }

    if (currentPage > 0 && currentPage <= tipiQuestions.length) {
      const questionIndex = currentPage - 1;
      const q = tipiQuestions[questionIndex];

      return (
        <div className="p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-600">Question {currentPage} of {tipiQuestions.length}</span>
              <span className="text-sm font-medium text-indigo-600">{Math.round((currentPage / tipiQuestions.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentPage / tipiQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-indigo-600">{currentPage}</span>
              </div>
            </div>
            <p className="text-lg text-gray-600 mb-4">I see myself as:</p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
              <p className="text-2xl font-bold text-gray-800 leading-relaxed">&quot;{q.question}&quot;</p>
            </div>
          </div>

          {/* Slider */}
          <div className="mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between text-sm px-1 mb-4 text-gray-600">
                <span className="font-medium">Disagree strongly</span>
                <span className="font-medium">Agree strongly</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={answers[questionIndex] === -1 ? 4 : answers[questionIndex]}
                onChange={(e) => handleAnswerChange(questionIndex, parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #fca5a5 0%, #fde047 50%, #86efac 100%)`
                }}
              />
              <div className="flex justify-between text-sm px-1 mt-2 text-gray-500">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <span key={num} className="font-medium">{num}</span>
                ))}
              </div>

              {/* Current Value Display */}
              <div className="text-center mt-4">
                <div className="inline-flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full">
                  <span className="text-lg font-bold text-indigo-600">
                    {answers[questionIndex] === -1 ? 4 : answers[questionIndex]}
                  </span>
                  <span className="text-sm text-gray-600">/ 7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span>Back</span>
            </button>

            {currentPage === tipiQuestions.length ? (
              <button
                onClick={handleSubmit}
                disabled={answers[questionIndex] === -1}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
              >
                <span>Finish</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={answers[questionIndex] === -1}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      );
    }

    if (currentPage > tipiQuestions.length) {
        const results = calculateResults();
        const chartData = {
          labels: Object.keys(results),
          datasets: [
            {
              label: 'Personality Traits',
              data: Object.values(results),
              backgroundColor: 'rgba(66, 153, 225, 0.2)',
              borderColor: 'rgba(66, 153, 225, 1)',
              borderWidth: 1,
            },
          ],
        };

        return (
          <div className="p-8 text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent mb-4">
                Assessment Complete!
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Here are your preliminary personality trait scores. You&apos;ll receive deeper insights through daily check-ins.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-3xl border border-green-100 mb-8">
              <div className="w-full max-w-lg mx-auto">
                <Radar data={chartData} />
              </div>
            </div>

            {message && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 font-medium">{message}</p>
              </div>
            )}

            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">Continue to Dashboard</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
            </button>
          </div>
        );
    }

    return null;
  };

   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
       <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl overflow-hidden">
         {renderContent()}
       </div>
     </div>
   );
 }
