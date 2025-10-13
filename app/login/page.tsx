'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginPageComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/');
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
          setMessage('Error signing in after email confirmation: ' + error.message);
          // Clear URL parameters to prevent re-processing
          router.replace('/login', undefined);
        } else {
          setMessage('Email confirmed! You are now signed in.');
          // Delay redirection slightly so the user can see the message
          setTimeout(() => {
            router.push('/');
          }, 2000); // Redirect after 2 seconds
        }
      });
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, searchParams, supabase]);

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      setMessage(error.message)
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      setMessage('This email is already registered.')
    }
    else if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: data.user.id, email: data.user.email });

      if (insertError) {
        setMessage('Sign up successful');
        return;
      }
      setMessage('Sign up successful! Please check your email to verify.')
      router.refresh()
    }
  }

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Sign in successful!')
      router.push('/')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome</h1>
        {message && <p className="auth-message">{message}</p>}
        <form>
          <input
            className="auth-input"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="auth-input"
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="space-y-4">
            <button
              className="auth-button btn-primary"
              type="button"
              onClick={handleSignIn}
            >
              Sign In
            </button>
            <button
              className="auth-button btn-secondary"
              type="button"
              onClick={handleSignUp}
            >
              Sign Up
            </button>
          </div>
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
