'use client'

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
import { useI18n } from '@/lib/i18n/context';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface BaselineTrait {
  id: string;
  traits_result: { [key: string]: string | number };
  created_at: string;
}

interface PersonalityTraitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trait: BaselineTrait | null;
}

export default function PersonalityTraitsModal({ isOpen, onClose, trait }: PersonalityTraitsModalProps) {
  const { t } = useI18n();

  if (!isOpen || !trait) return null;

  const chartData = {
    labels: Object.keys(trait.traits_result),
    datasets: [
      {
        label: 'Personality Traits Score',
        data: Object.values(trait.traits_result).map(value => Number(value)),
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(147, 51, 234, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          color: 'rgba(0, 0, 0, 0.6)',
        },
        pointLabels: {
          color: 'rgba(0, 0, 0, 0.8)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: { label: string; parsed: { r: number } }) {
            return `${context.label}: ${context.parsed.r}/100`;
          }
        }
      },
    },
  } as const;

  const getTraitDescription = (traitName: string, score: number) => {
    const descriptionKey = score >= 50 ? 'high' : 'low';
    return t(`personalityModal.descriptions.${traitName}.${descriptionKey}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('personalityModal.personalityDetails')}</h2>
                <p className="text-purple-100 text-xs">
                  {t('personalityModal.assessmentDate')}: {new Date(trait.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
              <h3 className="text-lg font-bold text-purple-800 mb-3 text-center">
                {t('personalityModal.radarChart')}
              </h3>
              <div className="h-64">
                <Radar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Traits Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                {t('personalityModal.traitDetails')}
              </h3>
              {Object.entries(trait.traits_result).map(([key, value]) => {
                const score = Number(value);
                const percentage = score;

                return (
                  <div key={key} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">{key}</h4>
                      <span className="text-lg font-bold text-purple-600">{score}/100</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {getTraitDescription(key, score)}
                    </p>

                    {/* Score Level Indicator */}
                    <div className="mt-2 flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        score >= 70 ? 'bg-green-400' :
                        score >= 50 ? 'bg-yellow-400' :
                        score >= 30 ? 'bg-orange-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-xs font-medium text-gray-500">
                        {score >= 70 ? t('personalityModal.levels.high') :
                         score >= 50 ? t('personalityModal.levels.mediumHigh') :
                         score >= 30 ? t('personalityModal.levels.mediumLow') : t('personalityModal.levels.low')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
