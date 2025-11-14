'use client'

import { checkOnboardingStatusAndRedirect, createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import LanguageSelector from '@/components/LanguageSelector'

function LoginPageComponent() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { t } = useI18n()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          checkOnboardingStatusAndRedirect(router);
        } else if (event === 'SIGNED_OUT') {
          // Handle signed out state if necessary
        }
      }
    );

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setMessageType('error');
          setMessage('Error signing in after email confirmation: ' + error.message);
          // Clear URL parameters to prevent re-processing
          router.replace('/login', undefined);
        } else {
          setMessageType('success');
          setMessage(t('auth.emailConfirmed'));
          // Delay redirection slightly so the user can see the message
          setTimeout(() => {
            checkOnboardingStatusAndRedirect(router);
          }, 2000); // Redirect after 2 seconds
        }
      });
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, searchParams, supabase]);

  const handleLoginWithOtp = async () => {
    setIsLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/`,
      },
    })

    if (error) {
      setMessageType('error');
      setMessage(error.message)
    } else {
      setOtpSent(true)
      setMessageType('success');
      setMessage(t('auth.otpSent'))
    }

    setIsLoading(false)
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true)
    setMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setMessageType('error');
      setMessage(error.message)
      setIsLoading(false)
    } else {
      setMessageType('success');
      setMessage(t('auth.signInSuccessful'))
      checkOnboardingStatusAndRedirect(router)
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (otpSent) {
      handleVerifyOtp()
    } else {
      handleLoginWithOtp()
    }
  }

   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
       {/* Language Selector - Top Right */}
       <div className="absolute top-4 right-4 z-10">
         <LanguageSelector />
       </div>

       <div className="w-full max-w-md">
         {/* Logo and Brand */}
         <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2"></path>
             </svg>
           </div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-2">
             Trait Flow
           </h1>
           <p className="text-gray-600 text-sm">
             {t('dashboard.trackMoodDescription')}
           </p>
         </div>

         {/* Login Card */}
         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
           <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
             <div className="flex items-center space-x-2">
               <div className="p-2 bg-white/20 rounded-lg">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                 </svg>
               </div>
               <h2 className="text-xl font-bold text-white">
                 {!otpSent ? t('auth.welcome') : t('auth.verifyOtp')}
               </h2>
             </div>
           </div>

           <div className="p-6">
             {/* Message Display */}
             {message && (
               <div className={`mb-4 p-3 rounded-lg border ${
                 messageType === 'success'
                   ? 'bg-green-50 border-green-200 text-green-800'
                   : 'bg-red-50 border-red-200 text-red-800'
               }`}>
                 <div className="flex items-center space-x-2">
                   {messageType === 'success' ? (
                     <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                     </svg>
                   ) : (
                     <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                     </svg>
                   )}
                   <span className="text-sm font-medium">{message}</span>
                 </div>
               </div>
             )}

             <form onSubmit={handleFormSubmit} className="space-y-4">
               {!otpSent ? (
                 <>
                   <div className="space-y-2">
                     <label htmlFor="email" className="text-sm font-medium text-gray-700">
                       {t('auth.email')}
                     </label>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                         </svg>
                       </div>
                       <input
                         id="email"
                         type="email"
                         placeholder={t('auth.email')}
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm"
                         required
                       />
                     </div>
                   </div>

                   <button
                     type="submit"
                     disabled={isLoading || !email}
                     className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl disabled:transform-none disabled:shadow-lg"
                   >
                     {isLoading ? (
                       <div className="flex items-center justify-center space-x-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                         <span>{t('common.loading')}</span>
                       </div>
                     ) : (
                       <div className="flex items-center justify-center space-x-2">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                         </svg>
                         <span>{t('auth.sendOtp')}</span>
                       </div>
                     )}
                   </button>
                 </>
               ) : (
                 <>
                   <div className="space-y-2">
                     <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                       {t('auth.enterOtp')}
                     </label>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                         </svg>
                       </div>
                       <input
                         id="otp"
                         type="text"
                         placeholder={t('auth.enterOtp')}
                         value={otp}
                         onChange={(e) => setOtp(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm text-center text-lg tracking-widest"
                         maxLength={6}
                         required
                       />
                     </div>
                     <p className="text-xs text-gray-500">
                       {t('auth.otpSent')}
                     </p>
                   </div>

                   <div className="space-y-3">
                     <button
                       type="submit"
                       disabled={isLoading || otp.length !== 6}
                       className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl disabled:transform-none disabled:shadow-lg"
                     >
                       {isLoading ? (
                         <div className="flex items-center justify-center space-x-2">
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                           <span>{t('common.loading')}</span>
                         </div>
                       ) : (
                         <div className="flex items-center justify-center space-x-2">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                           </svg>
                           <span>{t('auth.verifyOtp')}</span>
                         </div>
                       )}
                     </button>

                     <button
                       type="button"
                       onClick={() => {
                         setOtpSent(false)
                         setOtp('')
                         setMessage('')
                       }}
                       className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium py-2 transition-colors duration-200"
                     >
                       ← {t('common.back')}
                     </button>
                   </div>
                 </>
               )}
             </form>
           </div>
         </div>

         {/* Footer */}
         <div className="text-center mt-8">
           <p className="text-xs text-gray-500">
             By signing in, you agree to our Terms of Service and Privacy Policy
           </p>
         </div>
       </div>
     </div>
   )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="text-gray-600 font-medium">Loading...</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageComponent />
    </Suspense>
  )
}
