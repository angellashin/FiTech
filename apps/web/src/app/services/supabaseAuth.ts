import { supabase } from '../lib/supabaseClient';
import { rememberCloudStatus, type CloudAuthStatus } from './cloudSyncStatus';

export interface CloudAuthResult {
  status: CloudAuthStatus;
  userId?: string;
  message: string;
}

export const ensureAnonymousFiTechUser = async (displayName: string): Promise<CloudAuthResult> => {
  if (!supabase) {
    rememberCloudStatus('disabled');
    return {
      status: 'disabled',
      message: 'Supabase env is missing; FiTech will stay local-only.',
    };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.warn('Failed to read Supabase session:', sessionError.message);
  }

  const existingUser = sessionData.session?.user;
  if (existingUser) {
    rememberCloudStatus('authenticated');
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', existingUser.id);
    return {
      status: 'authenticated',
      userId: existingUser.id,
      message: 'Cloud sync ready.',
    };
  }

  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error || !data.user) {
    rememberCloudStatus('local-only');
    console.warn('Supabase anonymous sign-in failed:', error?.message);
    return {
      status: 'local-only',
      message:
        'Cloud sync is not active. Enable Anonymous Sign-Ins in Supabase Auth settings, then try again.',
    };
  }

  rememberCloudStatus('authenticated');
  return {
    status: 'authenticated',
    userId: data.user.id,
    message: 'Cloud sync ready.',
  };
};
