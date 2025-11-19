'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckinModal from '@/components/CheckinModal'
import InterventionDetailModal from '@/components/InterventionDetailModal'
import PersonalityTraitsModal from '@/components/PersonalityTraitsModal'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import HabitTracker from '@/components/HabitTracker'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'

interface Checkin {
  id: string;
  user_id: string;
  mood_score: number;
  energy_level: string;
  free_text: string;
  created_at: string;
  intervention?: Intervention;
}

interface Intervention {
  id: string;
  created_at: string;
  checkin_id: string;
  message_payload: {
    advice: string;
  };
  fallback: boolean | null;
  feedback_score: number | null;
}

interface BaselineTrait {
  id: string;
  traits_result: { [key: string]: string | number };
  created_at: string;
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useI18n()
  const [userEmail, setUserEmail] = useState<string | undefined>('')
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [selectedTrait, setSelectedTrait] = useState<BaselineTrait | null>(null)
  const [timelineItems, setTimelineItems] = useState<Checkin[]>([])
  const [baselineTraits, setBaselineTraits] = useState<BaselineTrait[]>([])
  const [loading, setLoading] = useState(true)
  const [, setHasOnboarded] = useState(false)

  const fetchTimelineData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select(`
        *,
        interventions (
          id,
          created_at,
          checkin_id,
          message_payload,
          fallback,
          feedback_score
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (checkinsError) {
      console.error('Error fetching timeline data:', checkinsError);
    } else {
      const formattedData = checkins.map(checkin => {
        const intervention = checkin.interventions?.[0] || undefined;
        // The rest operator removes the 'interventions' array from the checkin object
        const { interventions: _, ...restOfCheckin } = checkin;
        return {
          ...restOfCheckin,
          intervention,
        };
      });
      setTimelineItems(formattedData);
    }

    setLoading(false);
  }, [supabase]);

  const fetchBaselineTraits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: traits, error } = await supabase
      .from('baseline_traits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching baseline traits:', error);
    } else {
      setBaselineTraits(traits || []);
    }
  }, [supabase]);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data } = await supabase
          .from('baseline_traits')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setHasOnboarded(true);
        }
      }
    };

    checkOnboardingStatus();
    fetchTimelineData();
    fetchBaselineTraits();

    const channel = supabase
      .channel('timeline_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interventions' }, () => {
        fetchTimelineData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, () => {
        fetchTimelineData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTimelineData, fetchBaselineTraits]);

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleCheckinSubmit = async (emotion: number, energy: string, notes: string, suggestedHabit?: string) => {
    if (suggestedHabit) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('habits').insert({
          user_id: user.id,
          title: suggestedHabit,
          is_completed: false
        })
      }
    }
    fetchTimelineData();
  }

  const handleInterventionClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention)
    setIsDetailModalOpen(true)
  }

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false)
    setSelectedIntervention(null)
  }

  const handleInterventionUpdate = () => {
    fetchTimelineData()
  }

  const handleTraitClick = (trait: BaselineTrait) => {
    setSelectedTrait(trait)
    setIsTraitsModalOpen(true)
  }

  const handleTraitsModalClose = () => {
    setIsTraitsModalOpen(false)
    setSelectedTrait(null)
  }

  const renderStars = (score: number | null) => {
    if (score === null) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < score ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderBaselineTraits = () => {
    if (baselineTraits.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('dashboard.noBaselineTraits')}</h4>
          <p className="text-xs text-gray-500">{t('dashboard.noBaselineTraitsDescription')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {baselineTraits.map((trait, index) => (
          <div
            key={trait.id}
            className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105 transform"
            onClick={() => handleTraitClick(trait)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-1.5">
                <div className="p-1 bg-purple-100 rounded-md">
                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-purple-800">{t('dashboard.assessment')} #{baselineTraits.length - index}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                  {new Date(trait.created_at).toLocaleDateString()}
                </span>
                <div className="p-1 bg-purple-100 rounded-md">
                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(trait.traits_result).slice(0, 4).map(([key, value]) => (
                <div key={key} className="bg-white/60 p-2 rounded-md">
                  <div className="text-xs font-medium text-gray-700 truncate">{key}</div>
                  <div className="text-xs text-purple-600 font-semibold">{String(value)}/100</div>
                </div>
              ))}
            </div>

            {Object.keys(trait.traits_result).length > 4 && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                +{Object.keys(trait.traits_result).length - 4} {t('dashboard.moreTraits')}
              </div>
            )}

            <div className="mt-2 text-xs text-purple-600 text-center font-medium">
              {t('dashboard.clickForDetails')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg backdrop-blur-sm p-3 flex justify-between items-center fixed top-0 left-0 w-full z-10">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2"></path></svg>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Trait Flow</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/" className="text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path></svg>
                <span className="text-sm font-medium">{t('navigation.dashboard')}</span>
              </Link>
              <Link href="/history" className="text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.745A9.863 9.863 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                <span className="text-sm font-medium">{t('navigation.history')}</span>
              </Link>
              <Link href="/analytics" className="text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                <span className="text-sm font-medium">{t('navigation.analytics')}</span>
              </Link>
              <Link href="/settings" className="text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="text-sm font-medium">{t('navigation.settings')}</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center space-x-2 bg-white/10 rounded-md px-3 py-1.5 backdrop-blur-sm">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-white text-sm font-medium">{userEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span className="text-sm font-medium">{t('navigation.signOut')}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-3">
                {t('dashboard.welcomeBack')}
              </h1>
              <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
                {t('dashboard.trackMoodDescription')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setIsCheckinModalOpen(true)}
                className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span className="text-base">{t('dashboard.startCheckin')}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Main Content Grid */}
            <div className="w-full max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Timeline Section - Takes 2/3 of the space */}
                <div className="lg:col-span-2">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('dashboard.yourJourneyTimeline')}</h3>
                      </div>
                    </div>

                    <div className="p-6">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          <span className="ml-3 text-gray-600 text-base">{t('common.loading')}</span>
                        </div>
                      ) : timelineItems.length > 0 ? (
                        <div className="space-y-6 relative">
                          {/* Timeline line */}
                          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200 rounded-full"></div>

                          {timelineItems.map((checkin) => (
                            <div key={checkin.id} className="relative flex items-start space-x-4 group">
                              {/* Timeline dot */}
                              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md group-hover:scale-105 transition-transform duration-300">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                              </div>

                              {/* Content */}
                              <div className="flex-1 space-y-3">
                                {/* Check-in Card */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="p-1.5 bg-blue-100 rounded-md">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                      </div>
                                      <h4 className="font-bold text-base text-blue-800">{t('checkin.dailyCheckin')}</h4>
                                    </div>
                                    <span className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                                      {new Date(checkin.created_at).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-xl">{checkin.mood_score >= 4 ? '😊' : checkin.mood_score >= 2 ? '😐' : '😞'}</span>
                                      <div className="flex space-x-0.5">
                                        {[...Array(5)].map((_, i) => (
                                          <div key={i} className={`w-2 h-2 rounded-full ${i < checkin.mood_score ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                      <div className={`w-2 h-2 rounded-full ${checkin.energy_level === 'high' ? 'bg-green-400' :
                                        checkin.energy_level === 'mid' ? 'bg-yellow-400' : 'bg-red-400'
                                        }`}></div>
                                      <span className="text-sm text-gray-700 font-medium capitalize">{checkin.energy_level} Energy</span>
                                    </div>
                                  </div>

                                  {checkin.free_text && (
                                    <div className="bg-white/60 p-3 rounded-lg border-l-3 border-blue-400">
                                      <p className="text-sm text-gray-700 italic">&quot;{checkin.free_text}&quot;</p>
                                    </div>
                                  )}
                                </div>

                                {/* Intervention Card */}
                                {checkin.intervention && (
                                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl shadow-md border border-green-100 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5 cursor-pointer" onClick={() => handleInterventionClick(checkin.intervention!)}>
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="p-1.5 bg-green-100 rounded-md">
                                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                          </svg>
                                        </div>
                                        <h4 className="font-bold text-base text-green-800">{t('intervention.adviceForYou')}</h4>
                                      </div>
                                      <span className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                                        {new Date(checkin.intervention.created_at).toLocaleDateString()}
                                      </span>
                                    </div>

                                    <p className="text-sm text-gray-800 mb-3 leading-relaxed">{checkin.intervention.message_payload.advice}</p>

                                    {checkin.intervention.feedback_score && (
                                      <div className="flex justify-end">
                                        {renderStars(checkin.intervention.feedback_score)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.timelineEmpty')}</h4>
                          <p className="text-sm text-gray-500 mb-4">{t('dashboard.timelineEmptyDescription')}</p>
                          <button
                            onClick={() => setIsCheckinModalOpen(true)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
                          >
                            {t('dashboard.beginJourney')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Sidebar (4 cols) */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Habit Tracker Widget */}
                  <HabitTracker />

                  {/* Personality Traits Widget */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">{t('dashboard.personalityTraits')}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      {renderBaselineTraits()}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 text-white py-4">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="p-1.5 bg-white/10 rounded-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2"></path>
                </svg>
              </div>
              <span className="text-base font-bold">Trait Flow</span>
            </div>
            <p className="text-sm text-gray-300">{t('footer.copyright')}</p>
          </div>
        </footer>
      </div>
      <CheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        onSubmit={handleCheckinSubmit}
      />
      <InterventionDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        intervention={selectedIntervention}
        onUpdate={handleInterventionUpdate}
      />
      <PersonalityTraitsModal
        isOpen={isTraitsModalOpen}
        onClose={handleTraitsModalClose}
        trait={selectedTrait}
      />
    </>
  )
}
