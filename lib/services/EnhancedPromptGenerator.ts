import { RatingStats } from './FeedbackAnalyzer'

export interface UserContext {
  userId: string
  moodScore: number
  energyLevel: string
  notes: string
  userTraits: any | null
  locale: string
  ratingStats: RatingStats
  previousLowRatedAdvice?: string[]
}

export interface PromptResult {
  prompt: string
  isEnhanced: boolean
  variationNumber: number
}

export class EnhancedPromptGenerator {
  private readonly PROMPT_VARIATIONS = 3

  /**
   * Generate appropriate prompt based on user context and rating history
   */
  async generatePrompt(userContext: UserContext, attemptNumber: number = 0): Promise<PromptResult> {
    const { ratingStats, locale } = userContext

    // Use enhanced prompt if user needs enhancement
    if (ratingStats.needsEnhancement) {
      const variationNumber = (attemptNumber % this.PROMPT_VARIATIONS) + 1
      const enhancedPrompt = this.createEnhancedPrompt(userContext, variationNumber)

      return {
        prompt: enhancedPrompt,
        isEnhanced: true,
        variationNumber
      }
    }

    // Use standard prompt
    const standardPrompt = this.createStandardPrompt(userContext)
    return {
      prompt: standardPrompt,
      isEnhanced: false,
      variationNumber: 0
    }
  }

  /**
   * Create enhanced prompt with low-rating context and improvement instructions
   */
  private createEnhancedPrompt(userContext: UserContext, variationNumber: number): string {
    const { moodScore, energyLevel, notes, userTraits, locale, ratingStats, previousLowRatedAdvice } = userContext

    // Base enhanced context in multiple languages
    const enhancedContext = this.getEnhancedContextByLanguage(locale, ratingStats)

    // Get variation-specific instructions
    const variationInstructions = this.getPromptVariation(variationNumber, locale)

    // Build personality traits context
    const traitsContext = userTraits ? this.buildTraitsContext(userTraits, locale) : ''

    // Build previous advice context
    const previousAdviceContext = previousLowRatedAdvice && previousLowRatedAdvice.length > 0
      ? this.buildPreviousAdviceContext(previousLowRatedAdvice, locale)
      : ''

    // Construct the enhanced prompt
    const prompt = `${enhancedContext}

${variationInstructions}

${traitsContext}

${this.getUserStateContext(moodScore, energyLevel, notes, locale)}

${previousAdviceContext}

${this.getOutputInstructions(locale)}`

    return prompt.trim()
  }

  /**
   * Create standard prompt for users with good ratings
   */
  private createStandardPrompt(userContext: UserContext): string {
    const { moodScore, energyLevel, notes, userTraits, locale } = userContext

    const traitsContext = userTraits ? this.buildTraitsContext(userTraits, locale) : ''

    const standardInstructions = locale === 'vi'
      ? 'Hãy phân tích tình trạng cảm xúc của người dùng và đưa ra lời khuyên phù hợp, thực tế và có thể thực hiện được.'
      : locale === 'ja'
      ? 'ユーザーの感情状態を分析し、適切で実用的で実行可能なアドバイスを提供してください。'
      : 'Please analyze the user\'s emotional state and provide appropriate, practical, and actionable advice.'

    return `${standardInstructions}

${traitsContext}

${this.getUserStateContext(moodScore, energyLevel, notes, locale)}

${this.getOutputInstructions(locale)}`
  }

  /**
   * Get enhanced context message by language
   */
  private getEnhancedContextByLanguage(locale: string, ratingStats: RatingStats): string {
    const avgRating = ratingStats.averageRating.toFixed(1)
    const totalRatings = ratingStats.totalRatings

    switch (locale) {
      case 'vi':
        return `🚨 QUAN TRỌNG: Người dùng đã đánh giá các lời khuyên trước đây với điểm trung bình ${avgRating}/5 sao (từ ${totalRatings} đánh giá).
Điều này cho thấy lời khuyên có thể chưa đáp ứng hiệu quả nhu cầu của họ.

Hãy cải thiện chất lượng lời khuyên bằng cách:`

      case 'ja':
        return `🚨 重要：ユーザーは以前のアドバイスを平均${avgRating}/5つ星（${totalRatings}件の評価）で評価しています。
これは、アドバイスが効果的にニーズを満たしていない可能性があることを示しています。

以下の方法でアドバイスの質を向上させてください：`

      default:
        return `🚨 IMPORTANT: The user has rated previous advice with an average of ${avgRating}/5 stars (from ${totalRatings} ratings).
This indicates the advice may not be effectively meeting their needs.

Please improve the advice quality by:`
    }
  }

  /**
   * Get prompt variation instructions
   */
  private getPromptVariation(variationNumber: number, locale: string): string {
    const variations = {
      vi: [
        `1. Phân tích sâu hơn về tình trạng cảm xúc và đưa ra lời khuyên cụ thể, có thể thực hiện ngay
2. Thể hiện sự đồng cảm và hiểu biết về tình huống của họ
3. Đưa ra các bước hành động rõ ràng, chi tiết mà họ có thể làm ngay lập tức
4. Tránh lời khuyên chung chung, hãy cá nhân hóa dựa trên tính cách của họ`,

        `1. Tập trung vào giải pháp thực tế và khả thi trong hoàn cảnh hiện tại của họ
2. Đưa ra lời khuyên có thể đo lường được kết quả cụ thể
3. Kết nối lời khuyên với tính cách và sở thích cá nhân của họ
4. Đề xuất các hoạt động hoặc thay đổi nhỏ nhưng có tác động tích cực`,

        `1. Phân tích nguyên nhân gốc rễ của tình trạng cảm xúc hiện tại
2. Đưa ra lời khuyên theo từng bước với timeline cụ thể
3. Kết hợp yếu tố tâm lý và thực tế trong lời khuyên
4. Đề xuất cách theo dõi và đánh giá tiến bộ`
      ],
      ja: [
        `1. 感情状態をより深く分析し、具体的で即座に実行可能なアドバイスを提供する
2. 彼らの状況に対する共感と理解を示す
3. すぐに実行できる明確で詳細な行動ステップを提供する
4. 一般的なアドバイスを避け、性格に基づいてパーソナライズする`,

        `1. 現在の状況で実用的で実現可能な解決策に焦点を当てる
2. 具体的な結果を測定できるアドバイスを提供する
3. アドバイスを個人の性格や好みと結び付ける
4. 小さくても積極的な影響を与える活動や変化を提案する`,

        `1. 現在の感情状態の根本原因を分析する
2. 具体的なタイムラインでステップバイステップのアドバイスを提供する
3. アドバイスに心理的および実用的な要素を組み合わせる
4. 進歩を追跡し評価する方法を提案する`
      ],
      en: [
        `1. Analyze emotional state more deeply and provide specific, immediately actionable advice
2. Show empathy and understanding of their unique situation
3. Provide clear, detailed action steps they can take right now
4. Avoid generic advice - personalize based on their personality traits`,

        `1. Focus on practical and achievable solutions within their current circumstances
2. Provide advice with measurable and specific outcomes
3. Connect advice to their personal traits and preferences
4. Suggest small but impactful activities or changes`,

        `1. Analyze root causes of current emotional state
2. Provide step-by-step advice with specific timelines
3. Combine psychological and practical elements in advice
4. Suggest ways to track and evaluate progress`
      ]
    }

    const langVariations = variations[locale as keyof typeof variations] || variations.en
    return langVariations[variationNumber - 1] || langVariations[0]
  }

  /**
   * Build personality traits context
   */
  private buildTraitsContext(userTraits: any, locale: string): string {
    if (!userTraits || typeof userTraits !== 'object') return ''

    const traitsText = Object.entries(userTraits)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')

    switch (locale) {
      case 'vi':
        return `Đặc điểm tính cách của người dùng: ${traitsText}`
      case 'ja':
        return `ユーザーの性格特性: ${traitsText}`
      default:
        return `User's personality traits: ${traitsText}`
    }
  }

  /**
   * Build previous low-rated advice context
   */
  private buildPreviousAdviceContext(previousAdvice: string[], locale: string): string {
    const adviceList = previousAdvice.slice(0, 2).map((advice, index) => `${index + 1}. "${advice.substring(0, 100)}..."`).join('\n')

    switch (locale) {
      case 'vi':
        return `Các lời khuyên trước đây được đánh giá thấp (tránh lặp lại):
${adviceList}`
      case 'ja':
        return `以前の低評価アドバイス（繰り返しを避ける）:
${adviceList}`
      default:
        return `Previous low-rated advice patterns to avoid:
${adviceList}`
    }
  }

  /**
   * Get user current state context
   */
  private getUserStateContext(moodScore: number, energyLevel: string, notes: string, locale: string): string {
    switch (locale) {
      case 'vi':
        return `Tình trạng hiện tại của người dùng:
- Tâm trạng: ${moodScore}/5
- Năng lượng: ${energyLevel}
- Ghi chú: ${notes || 'Không có'}
- Ngôn ngữ: ${locale}`

      case 'ja':
        return `ユーザーの現在の状態:
- 気分: ${moodScore}/5
- エネルギー: ${energyLevel}
- メモ: ${notes || 'なし'}
- 言語: ${locale}`

      default:
        return `User's current state:
- Mood: ${moodScore}/5
- Energy: ${energyLevel}
- Notes: ${notes || 'None'}
- Language: ${locale}`
    }
  }

  /**
   * Get output instructions
   */
  private getOutputInstructions(locale: string): string {
    switch (locale) {
      case 'vi':
        return `Hãy đưa ra lời khuyên chu đáo, cụ thể và có thể thực hiện ngay lập tức để giải quyết tình huống độc đáo của họ.
Lời khuyên phải thực tế, có thể đo lường được và phù hợp với tính cách của họ.`

      case 'ja':
        return `彼らのユニークな状況に対処するための思慮深く、具体的で、すぐに実行可能なアドバイスを提供してください。
アドバイスは実用的で、測定可能で、彼らの性格に適したものでなければなりません。`

      default:
        return `Provide thoughtful, specific, and immediately actionable advice that addresses their unique situation.
The advice must be practical, measurable, and tailored to their personality.`
    }
  }
}

// Export singleton instance
export const enhancedPromptGenerator = new EnhancedPromptGenerator()
