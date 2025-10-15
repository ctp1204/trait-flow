'use client'

import { checkOnboardingStatusAndRedirect, createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginPageComponent() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

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
          setMessage('Email confirmed! You are now signed in.');
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
      setMessage('OTP has been sent to your email. Please check your inbox and enter the code.')
    }
  }

  const handleVerifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setMessageType('error');
      setMessage(error.message)
    } else {
      setMessageType('success');
      setMessage('Sign in successful!')
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
     <div className="auth-container">
       <div className="auth-card">
         <h1 className="auth-title">Welcome</h1>
         {message && <p className={`auth-message ${
            messageType === 'success' ? 'text-green-500' : 'text-red-500'
          }`}>{message}</p>}
         <form onSubmit={handleFormSubmit}>
           {!otpSent ? (
             <>
               <input
                 className="auth-input"
                 id="email"
                 type="email"
                 placeholder="Email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
               <div className="space-y-4">
                 <button
                   className="auth-button btn-primary"
                   type="submit"
                 >
                   Send OTP
                 </button>
               </div>
             </>
           ) : (
             <>
               <input
                 className="auth-input"
                 id="otp"
                 type="text"
                 placeholder="Enter OTP"
                 value={otp}
                 onChange={(e) => setOtp(e.target.value)}
               />
               <div className="space-y-4">
                 <button
                   className="auth-button btn-primary"
                   type="submit"
                 >
                   Verify OTP
                 </button>
               </div>
             </>
           )}
         </form>
       </div>
     </div>
   )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageComponent />
    </Suspense>
  )
}
