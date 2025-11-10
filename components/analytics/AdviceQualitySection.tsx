import React from 'react';
import { RatingDistributionChart } from './RatingDistributionChart';
import { EnhancementImpactChart } from './EnhancementImpactChart';
import type { AdviceQuality } from '@/lib/types/analytics';

interface AdviceQualitySectionProps {
  adviceQuality: AdviceQuality;
}

/**
 * AdviceQualitySection Component
 * Container for advice quality analytics
 */
export function AdviceQualitySection({
  adviceQuality,
}: AdviceQualitySectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Chất lượng lời khuyên
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Phân tích đánh giá và hiệu quả của lời khuyên AI
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RatingDistributionChart
          ratingDistribution={adviceQuality.ratingDistribution}
          averageRating={adviceQuality.averageRating}
        />
        <EnhancementImpactChart
          enhancementStats={adviceQuality.enhancementStats}
        />
      </div>
    </div>
  );
}
