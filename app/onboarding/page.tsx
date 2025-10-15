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
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to TIPI</h1>
          <p className="text-lg mb-8">This is a short personality test. It includes 10 questions and will take about 3 minutes.</p>
          <button onClick={handleStart} className="auth-button btn-primary">Start</button>
        </div>
      );
    }

    if (currentPage > 0 && currentPage <= tipiQuestions.length) {
      const questionIndex = currentPage - 1;
      const q = tipiQuestions[questionIndex];

      return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{currentPage} / {tipiQuestions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(currentPage / tipiQuestions.length) * 100}%` }}></div>
          </div>
          <div className="text-center mb-8">
            <p className="text-lg mb-2">I see myself as:</p>
            <p className="text-2xl font-bold">&quot;{q.question}&quot;</p>
          </div>
          <div className="mb-8">
            <div className="flex justify-between text-xs px-1 mb-1 text-gray-600">
              <span>Disagree strongly</span>
              <span>Agree strongly</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={answers[questionIndex] === -1 ? 4 : answers[questionIndex]}
              onChange={(e) => handleAnswerChange(questionIndex, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs px-1 mt-1 text-gray-600">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            {currentPage === tipiQuestions.length ? (
              <button
                onClick={handleSubmit}
                disabled={answers[questionIndex] === -1}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={answers[questionIndex] === -1}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Next →
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
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Your Preliminary Results</h2>
            <div className="w-full max-w-lg mx-auto mb-6">
              <Radar data={chartData} />
            </div>
            <p className="text-lg mb-6">This is a preliminary score. You can receive deeper feedback through daily check-ins.</p>
            {message && <p className="mb-4">{message}</p>}
            <button onClick={() => router.push('/')} className="auth-button btn-primary">Go to Home Screen</button>
          </div>
        );
    }

    return null;
  };

   return (
     <div className="flex items-center justify-center min-h-screen bg-gray-100">
       <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
         {renderContent()}
       </div>
     </div>
   );
 }
