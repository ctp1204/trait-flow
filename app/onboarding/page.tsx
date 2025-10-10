'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const likertScale = [
  "Disagree strongly",
  "Disagree moderately",
  "Disagree a little",
  "Neither agree nor disagree",
  "Agree a little",
  "Agree moderately",
  "Agree strongly",
];

type Trait = 'Extraversion' | 'Agreeableness' | 'Conscientiousness' | 'Emotional Stability' | 'Openness to Experiences';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<number[]>(new Array(tipiQuestions.length).fill(-1));
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const handleStart = () => {
    setStep(2);
  };

  const handleAnswerChange = (questionIndex: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleNextPage = () => {
    setCurrentPage(2);
  };

  const handleSubmit = () => {
    setStep(3);
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

  const isPage1Complete = answers.slice(0, 5).every(ans => ans !== -1);
  const isPage2Complete = answers.slice(5, 10).every(ans => ans !== -1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to TIPI</h1>
            <p className="text-lg mb-8">This is a short personality test. It includes 10 questions and will take about 3 minutes.</p>
            <button onClick={handleStart} className="auth-button btn-primary">Start</button>
          </div>
        );
      case 2:
        const questionsToShow = currentPage === 1 ? tipiQuestions.slice(0, 5) : tipiQuestions.slice(5, 10);
        const startIndex = currentPage === 1 ? 0 : 5;

        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">TIPI Questions (Page {currentPage}/2)</h2>
            {questionsToShow.map((q, index) => {
              const questionIndex = startIndex + index;
              return (
                <div key={questionIndex} className="mb-8">
                  <p className="font-semibold mb-3">{q.question}</p>
                  <div className="flex justify-between">
                    {likertScale.map((label, value) => (
                      <div key={value} className="flex flex-col items-center">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={value + 1}
                          checked={answers[questionIndex] === value + 1}
                          onChange={() => handleAnswerChange(questionIndex, value + 1)}
                          className="mb-1"
                        />
                        <label className="text-xs text-center">{label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {currentPage === 1 ? (
              <button onClick={handleNextPage} disabled={!isPage1Complete} className="auth-button btn-primary mt-4 disabled:bg-gray-400">Next</button>
            ) : (
              <button onClick={handleSubmit} disabled={!isPage2Complete} className="auth-button btn-primary mt-4 disabled:bg-gray-400">Finish</button>
            )}
          </div>
        );
      case 3:
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
            <button onClick={() => router.push('/')} className="auth-button btn-primary">Go to Home Screen</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        {renderStep()}
      </div>
    </div>
  );
}
