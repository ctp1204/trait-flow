import { createBrowserClient } from '@supabase/ssr';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const checkOnboardingStatusAndRedirect = async (router: AppRouterInstance) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await supabase
      .from('baseline_traits')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: "The result contains 0 rows" which is not an actual error in this case.
      console.error('Error fetching baseline traits:', error);
      // Decide on a fallback, e.g., redirect to an error page or home
      router.push('/');
      return;
    }

    if (data) {
      router.push('/');
    } else {
      router.push('/onboarding');
    }
  } else {
    // Not logged in, redirect to login
    router.push('/login');
  }
};
