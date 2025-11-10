'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/context';

/**
 * Header Component
 * Shared navigation header for all pages
 */
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { t } = useI18n();
  const [userEmail, setUserEmail] = useState<string | undefined>('');

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email);
    };
    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg backdrop-blur-sm p-3 flex justify-between items-center fixed top-0 left-0 w-full z-10">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 8v8m-4-5v5m-4-2v2"
              ></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Trait Flow
          </h1>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <Link
            href="/"
            className={`text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 ${
              isActive('/') ? 'bg-white/20' : ''
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
              ></path>
            </svg>
            <span className="text-sm font-medium">{t('navigation.dashboard')}</span>
          </Link>
          <Link
            href="/history"
            className={`text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 ${
              isActive('/history') ? 'bg-white/20' : ''
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.745A9.863 9.863 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            <span className="text-sm font-medium">{t('navigation.history')}</span>
          </Link>
          <Link
            href="/analytics"
            className={`text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 ${
              isActive('/analytics') ? 'bg-white/20' : ''
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
            <span className="text-sm font-medium">{t('navigation.analytics')}</span>
          </Link>
          <Link
            href="/settings"
            className={`text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 ${
              isActive('/settings') ? 'bg-white/20' : ''
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            <span className="text-sm font-medium">{t('navigation.settings')}</span>
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-3">
        <LanguageSwitcher />
        <div className="hidden sm:flex items-center space-x-2 bg-white/10 rounded-md px-3 py-1.5 backdrop-blur-sm">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
          </div>
          <span className="text-white text-sm font-medium">{userEmail}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-white/90 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          <span className="text-sm font-medium">{t('navigation.signOut')}</span>
        </button>
      </div>
    </header>
  );
}
