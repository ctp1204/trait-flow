'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'

interface Habit {
    id: string
    title: string
    is_completed: boolean
    created_at: string
}

export default function HabitTracker() {
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchHabits()

        const channel = supabase
            .channel('habits_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () => {
                fetchHabits()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchHabits = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get start and end of today in local time
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const { data } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString())
            .order('created_at', { ascending: false })

        if (data) {
            setHabits(data)
        }
        setLoading(false)
    }

    const toggleHabit = async (habit: Habit) => {
        const newStatus = !habit.is_completed

        // Optimistic update
        setHabits(habits.map(h => h.id === habit.id ? { ...h, is_completed: newStatus } : h))

        if (newStatus) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
        }

        const { error } = await supabase
            .from('habits')
            .update({
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null
            })
            .eq('id', habit.id)

        if (error) {
            // Revert on error
            setHabits(habits.map(h => h.id === habit.id ? { ...h, is_completed: !newStatus } : h))
            console.error('Error updating habit:', error)
        }
    }

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2z"></path>
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Today's Habits</h3>
                </div>
            </div>

            <div className="p-4">
                {habits.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">No habits for today yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Check in to get AI suggestions!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {habits.map((habit) => (
                            <div
                                key={habit.id}
                                onClick={() => toggleHabit(habit)}
                                className={`
                  group flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-300
                  ${habit.is_completed
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md'
                                    }
                `}
                            >
                                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors duration-300
                  ${habit.is_completed
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-gray-300 group-hover:border-emerald-400'
                                    }
                `}>
                                    {habit.is_completed && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    )}
                                </div>
                                <span className={`
                  text-sm font-medium transition-all duration-300
                  ${habit.is_completed ? 'text-emerald-700 opacity-70' : 'text-gray-700'}
                `}>
                                    {habit.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
