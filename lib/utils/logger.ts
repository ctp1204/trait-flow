export interface LogEntry {
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success'
  category: 'enhancement' | 'rating' | 'api' | 'system'
  message: string
  userId?: string
  metadata?: Record<string, any>
}

export class EnhancementLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory

  /**
   * Log when enhanced prompt is triggered
   */
  logEnhancementTriggered(userId: string, ratingStats: {
    averageRating: number
    totalRatings: number
    variationNumber?: number
  }) {
    this.addLog({
      level: 'info',
      category: 'enhancement',
      message: `Enhanced prompt triggered for user due to low ratings`,
      userId,
      metadata: {
        averageRating: ratingStats.averageRating,
        totalRatings: ratingStats.totalRatings,
        variationNumber: ratingStats.variationNumber || 0,
        threshold: 2.5
      }
    })

    // Also log to console for immediate visibility
    console.log(`🔧 Enhanced prompt triggered for user ${userId}`, {
      averageRating: ratingStats.averageRating,
      totalRatings: ratingStats.totalRatings,
      variationNumber: ratingStats.variationNumber
    })
  }

  /**
   * Log rating improvements
   */
  logRatingImprovement(userId: string, improvementData: {
    previousAverage: number
    newAverage: number
    feedbackScore: number
    totalRatings: number
  }) {
    this.addLog({
      level: 'success',
      category: 'rating',
      message: `Rating improvement detected for user`,
      userId,
      metadata: {
        previousAverage: improvementData.previousAverage,
        newAverage: improvementData.newAverage,
        feedbackScore: improvementData.feedbackScore,
        totalRatings: improvementData.totalRatings,
        improvement: improvementData.newAverage - improvementData.previousAverage
      }
    })

    console.log(`📈 Rating improvement detected for user ${userId}`, improvementData)
  }

  /**
   * Log low ratings that might trigger enhancement
   */
  logLowRating(userId: string, ratingData: {
    feedbackScore: number
    currentAverage: number
    totalRatings: number
    willTriggerEnhancement: boolean
  }) {
    this.addLog({
      level: 'warning',
      category: 'rating',
      message: `Low rating received from user`,
      userId,
      metadata: {
        feedbackScore: ratingData.feedbackScore,
        currentAverage: ratingData.currentAverage,
        totalRatings: ratingData.totalRatings,
        willTriggerEnhancement: ratingData.willTriggerEnhancement,
        threshold: 2.5
      }
    })

    console.log(`⚠️ Low rating received for user ${userId}`, ratingData)
  }

  /**
   * Log API errors and fallbacks
   */
  logApiError(category: 'enhancement' | 'rating' | 'api', error: any, context?: Record<string, any>) {
    this.addLog({
      level: 'error',
      category,
      message: `API error occurred: ${error.message || error}`,
      metadata: {
        error: error.toString(),
        stack: error.stack,
        context
      }
    })

    console.error(`❌ API Error in ${category}:`, error, context)
  }

  /**
   * Log successful operations
   */
  logSuccess(category: 'enhancement' | 'rating' | 'api' | 'system', message: string, metadata?: Record<string, any>) {
    this.addLog({
      level: 'success',
      category,
      message,
      metadata
    })

    console.log(`✅ ${message}`, metadata)
  }

  /**
   * Log system performance metrics
   */
  logPerformanceMetric(operation: string, duration: number, metadata?: Record<string, any>) {
    this.addLog({
      level: 'info',
      category: 'system',
      message: `Performance metric: ${operation}`,
      metadata: {
        operation,
        duration,
        ...metadata
      }
    })

    if (duration > 5000) { // Log slow operations (>5s)
      console.warn(`⏱️ Slow operation detected: ${operation} took ${duration}ms`, metadata)
    }
  }

  /**
   * Get recent logs for monitoring
   */
  getRecentLogs(limit: number = 50, category?: 'enhancement' | 'rating' | 'api' | 'system'): LogEntry[] {
    let filteredLogs = this.logs

    if (category) {
      filteredLogs = this.logs.filter(log => log.category === category)
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get enhancement success rate
   */
  getEnhancementSuccessRate(timeframe: 'day' | 'week' | 'month' = 'week'): {
    totalEnhancements: number
    successfulImprovements: number
    successRate: number
  } {
    const now = new Date()
    const timeframeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }

    const cutoffTime = new Date(now.getTime() - timeframeMs[timeframe])

    const enhancementLogs = this.logs.filter(log =>
      log.category === 'enhancement' &&
      log.message.includes('Enhanced prompt triggered') &&
      log.timestamp >= cutoffTime
    )

    const improvementLogs = this.logs.filter(log =>
      log.category === 'rating' &&
      log.message.includes('Rating improvement detected') &&
      log.timestamp >= cutoffTime
    )

    const totalEnhancements = enhancementLogs.length
    const successfulImprovements = improvementLogs.length
    const successRate = totalEnhancements > 0 ? (successfulImprovements / totalEnhancements) * 100 : 0

    return {
      totalEnhancements,
      successfulImprovements,
      successRate: Math.round(successRate * 100) / 100
    }
  }

  /**
   * Get rating statistics summary
   */
  getRatingStatsSummary(timeframe: 'day' | 'week' | 'month' = 'week'): {
    totalRatings: number
    averageRating: number
    lowRatings: number
    highRatings: number
    improvementRate: number
  } {
    const now = new Date()
    const timeframeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }

    const cutoffTime = new Date(now.getTime() - timeframeMs[timeframe])

    const ratingLogs = this.logs.filter(log =>
      log.category === 'rating' &&
      log.timestamp >= cutoffTime &&
      log.metadata?.feedbackScore
    )

    const ratings = ratingLogs.map(log => log.metadata!.feedbackScore as number)
    const totalRatings = ratings.length
    const averageRating = totalRatings > 0 ? ratings.reduce((sum, r) => sum + r, 0) / totalRatings : 0
    const lowRatings = ratings.filter(r => r < 2.5).length
    const highRatings = ratings.filter(r => r >= 4).length

    const improvementLogs = this.logs.filter(log =>
      log.category === 'rating' &&
      log.message.includes('Rating improvement detected') &&
      log.timestamp >= cutoffTime
    )

    const improvementRate = totalRatings > 0 ? (improvementLogs.length / totalRatings) * 100 : 0

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 100) / 100,
      lowRatings,
      highRatings,
      improvementRate: Math.round(improvementRate * 100) / 100
    }
  }

  /**
   * Add log entry
   */
  private addLog(logData: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...logData,
      timestamp: new Date()
    }

    this.logs.push(logEntry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Clear all logs (for testing or maintenance)
   */
  clearLogs() {
    this.logs = []
    console.log('🧹 Enhancement logs cleared')
  }

  /**
   * Export logs as JSON (for backup or analysis)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Export singleton instance
export const enhancementLogger = new EnhancementLogger()

// Convenience functions for common logging operations
export const logEnhancementTriggered = (userId: string, ratingStats: any) =>
  enhancementLogger.logEnhancementTriggered(userId, ratingStats)

export const logRatingImprovement = (userId: string, improvementData: any) =>
  enhancementLogger.logRatingImprovement(userId, improvementData)

export const logLowRating = (userId: string, ratingData: any) =>
  enhancementLogger.logLowRating(userId, ratingData)

export const logApiError = (category: any, error: any, context?: any) =>
  enhancementLogger.logApiError(category, error, context)

export const logSuccess = (category: any, message: string, metadata?: any) =>
  enhancementLogger.logSuccess(category, message, metadata)
