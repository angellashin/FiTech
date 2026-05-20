import { useState, useEffect } from 'react';
import type { Exercise, WorkoutPlan } from './domain/workout';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { WorkoutSetup } from './components/WorkoutSetup';
import { PlanPreview } from './components/PlanPreview';
import { WorkoutSession } from './components/WorkoutSession';
import { WorkoutComplete } from './components/WorkoutComplete';
import { Profile } from './components/Profile';
import { WorkoutHistory } from './components/WorkoutHistory';
import { ProgressReport } from './components/ProgressReport';
import { getUserSettings, applyDarkMode } from './utils/userSettings';
import { Capacitor } from '@capacitor/core';

type Screen =
  | 'login'
  | 'home'
  | 'setup'
  | 'preview'
  | 'session'
  | 'complete'
  | 'profile'
  | 'history'
  | 'progress';

const getInitialScreen = (): Screen => {
  try {
    return localStorage.getItem('fitech_user_name') ? 'home' : 'login';
  } catch {
    return 'login';
  }
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(getInitialScreen);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<{
    sessionId: string;
    exercises: Exercise[];
  } | null>(null);
  const [previewSource, setPreviewSource] = useState<'setup' | 'home'>('setup');
  const [homeKey, setHomeKey] = useState(0);

  useEffect(() => {
    applyDarkMode(getUserSettings().darkMode);
  }, []);

  // Android hardware back button — navigate to previous screen instead of exiting
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    void import('@capacitor/app').then(({ App: CapApp }) => {
      const sub = CapApp.addListener('backButton', () => {
        setCurrentScreen((screen) => {
          if (screen === 'home' || screen === 'login') {
            void CapApp.exitApp();
            return screen;
          }
          if (screen === 'preview') {
            return previewSource === 'home' ? 'home' : 'setup';
          }
          if (screen === 'session') return 'preview';
          // complete, profile, history, progress → home
          setWorkoutPlan(null);
          setHomeKey((k) => k + 1);
          return 'home';
        });
      });
      cleanup = () => void sub.then((s) => s.remove());
    });

    return () => cleanup?.();
  }, [previewSource]);
  const handleLogin = () => {
    setCurrentScreen('home');
  };

  const handleStartWorkout = () => {
    setCurrentScreen('setup');
  };

  const handlePlanGenerated = (plan: WorkoutPlan) => {
    setWorkoutPlan(plan);
    setPreviewSource('setup');
    setCurrentScreen('preview');
  };

  const handleStartSession = (updatedPlan?: WorkoutPlan) => {
    if (updatedPlan) {
      setWorkoutPlan(updatedPlan);
    }
    setCurrentScreen('session');
  };

  const handleWorkoutComplete = (sessionId: string, exercises: Exercise[]) => {
    setCompletedWorkout({ sessionId, exercises });
    setCurrentScreen('complete');
  };

  const handleLoadPlan = (plan: WorkoutPlan) => {
    setWorkoutPlan(plan);
    setPreviewSource('home');
    setCurrentScreen('preview');
  };

  const handleBackToHome = () => {
    setHomeKey((k) => k + 1); // force Home to remount so savedRoutines are re-read
    setCurrentScreen('home');
    setWorkoutPlan(null);
  };

  const handleLogout = () => {
    // Only clear the name so Login can detect a user switch on next sign-in.
    // Workout data is preserved: if the same name re-enters, history is intact.
    // If a different name enters, Login clears the data at that point.
    const currentName = localStorage.getItem('fitech_user_name');
    if (currentName) {
      localStorage.setItem('fitech_last_user_name', currentName);
    }
    localStorage.removeItem('fitech_user_name');
    setWorkoutPlan(null);
    setCompletedWorkout(null);
    setCurrentScreen('login');
  };

  const handleGoToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  const handleViewProgressReport = () => {
    setCurrentScreen('progress');
  };

  const handleBackFromSetup = () => {
    setCurrentScreen('home');
  };

  const handleBackFromPreview = () => {
    setCurrentScreen(previewSource === 'home' ? 'home' : 'setup');
  };

  const handleBackFromSession = () => {
    setCurrentScreen('preview');
  };

  return (
    <div className="size-full bg-neutral-950 flex justify-center">
      <div className="w-full max-w-[430px] relative flex flex-col bg-neutral-950 text-white overflow-hidden h-full">
        {currentScreen === 'login' && <Login onLogin={handleLogin} />}
        {currentScreen === 'home' && (
          <Home
            key={homeKey}
            onStartWorkout={handleStartWorkout}
            onGoToProfile={handleGoToProfile}
            onLoadPlan={handleLoadPlan}
            onViewHistory={handleViewHistory}
            onViewProgressReport={handleViewProgressReport}
          />
        )}
        {currentScreen === 'setup' && (
          <WorkoutSetup onPlanGenerated={handlePlanGenerated} onBack={handleBackFromSetup} />
        )}
        {currentScreen === 'preview' && workoutPlan && (
          <PlanPreview
            plan={workoutPlan}
            onStartSession={handleStartSession}
            onBack={handleBackFromPreview}
          />
        )}
        {currentScreen === 'session' && workoutPlan && (
          <WorkoutSession
            plan={workoutPlan}
            onComplete={handleWorkoutComplete}
            onBack={handleBackFromSession}
          />
        )}
        {currentScreen === 'complete' && completedWorkout && (
          <WorkoutComplete
            sessionId={completedWorkout.sessionId}
            exercises={completedWorkout.exercises}
            onBackToHome={handleBackToHome}
          />
        )}
        {currentScreen === 'profile' && (
          <Profile onBackToHome={handleBackToHome} onLogout={handleLogout} />
        )}
        {currentScreen === 'history' && (
          <WorkoutHistory onBack={handleBackToHome} onLoadPlan={handleLoadPlan} />
        )}
        {currentScreen === 'progress' && <ProgressReport onBack={handleBackToHome} />}
      </div>
    </div>
  );
}
