import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
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
import { RoutineLibrary } from './components/RoutineLibrary';
import { getUserSettings, applyDarkMode } from './utils/userSettings';
import { Capacitor } from '@capacitor/core';
import {
  appNavigationReducer,
  createNavigationState,
  getBackTarget,
  type AppScreen,
} from './utils/appNavigation';

const getInitialScreen = (): AppScreen => {
  try {
    return localStorage.getItem('fitech_user_name') ? 'home' : 'login';
  } catch {
    return 'login';
  }
};

export default function App() {
  const [navigation, dispatchNavigation] = useReducer(
    appNavigationReducer,
    getInitialScreen(),
    createNavigationState,
  );
  const currentScreen = navigation.current;
  const navigationRef = useRef(navigation);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<{
    sessionId: string;
    exercises: Exercise[];
  } | null>(null);
  const [homeKey, setHomeKey] = useState(0);

  useEffect(() => {
    applyDarkMode(getUserSettings().darkMode);
  }, []);

  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  const refreshHome = useCallback(() => {
    setHomeKey((k) => k + 1);
  }, []);

  const pushScreen = useCallback((screen: AppScreen) => {
    dispatchNavigation({ type: 'push', screen });
  }, []);

  const replaceScreen = useCallback((screen: AppScreen) => {
    dispatchNavigation({ type: 'replace', screen });
  }, []);

  const resetToScreen = useCallback(
    (screen: AppScreen) => {
      if (screen === 'home') refreshHome();
      dispatchNavigation({ type: 'reset', screen });
    },
    [refreshHome],
  );

  const goBack = useCallback(() => {
    const target = getBackTarget(navigationRef.current);
    if (!target) return false;
    if (target === 'home') {
      refreshHome();
      setWorkoutPlan(null);
    }
    dispatchNavigation({ type: 'back' });
    return true;
  }, [refreshHome]);

  const handleBackToHome = useCallback(() => {
    resetToScreen('home');
    setWorkoutPlan(null);
    setCompletedWorkout(null);
  }, [resetToScreen]);

  const goBackOrHome = useCallback(() => {
    if (!goBack()) {
      handleBackToHome();
    }
  }, [goBack, handleBackToHome]);

  const handleHardwareBackRef = useRef<() => boolean>(() => false);

  const handleHardwareBack = useCallback(() => {
    const screen = navigationRef.current.current;

    if (screen === 'home' || screen === 'login') {
      return false;
    }

    if (screen === 'complete') {
      handleBackToHome();
      return true;
    }

    if (goBack()) return true;

    handleBackToHome();
    return true;
  }, [goBack, handleBackToHome]);

  useEffect(() => {
    handleHardwareBackRef.current = handleHardwareBack;
  }, [handleHardwareBack]);

  // Android hardware back button — follow the app's actual screen stack before exiting
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listenerPromise:
      | ReturnType<Awaited<typeof import('@capacitor/app')>['App']['addListener']>
      | undefined;

    void import('@capacitor/app').then(({ App: CapApp }) => {
      listenerPromise = CapApp.addListener('backButton', () => {
        const handled = handleHardwareBackRef.current();
        if (!handled) {
          void CapApp.exitApp();
        }
      });

      if (cancelled) {
        void listenerPromise.then((listener) => listener.remove());
      }
    });

    return () => {
      cancelled = true;
      void listenerPromise?.then((listener) => listener.remove());
    };
  }, []);
  const handleLogin = () => {
    resetToScreen('home');
  };

  const handleStartWorkout = () => {
    pushScreen('setup');
  };

  const handlePlanGenerated = (plan: WorkoutPlan) => {
    setWorkoutPlan(plan);
    pushScreen('preview');
  };

  const handleStartSession = (updatedPlan?: WorkoutPlan) => {
    if (updatedPlan) {
      setWorkoutPlan(updatedPlan);
    }
    pushScreen('session');
  };

  const handleWorkoutComplete = (sessionId: string, exercises: Exercise[]) => {
    setCompletedWorkout({ sessionId, exercises });
    replaceScreen('complete');
  };

  const handleLoadPlan = (plan: WorkoutPlan) => {
    setWorkoutPlan(plan);
    pushScreen('preview');
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
    resetToScreen('login');
  };

  const handleGoToProfile = () => {
    pushScreen('profile');
  };

  const handleViewHistory = () => {
    pushScreen('history');
  };

  const handleViewProgressReport = () => {
    pushScreen('progress');
  };

  const handleViewRoutines = () => {
    pushScreen('routines');
  };

  const handleBackFromSetup = () => {
    goBackOrHome();
  };

  const handleBackFromPreview = () => {
    goBackOrHome();
  };

  const handleBackFromSession = () => {
    goBackOrHome();
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
            onViewRoutines={handleViewRoutines}
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
          <Profile onBackToHome={goBackOrHome} onLogout={handleLogout} />
        )}
        {currentScreen === 'history' && (
          <WorkoutHistory onBack={goBackOrHome} onLoadPlan={handleLoadPlan} />
        )}
        {currentScreen === 'progress' && <ProgressReport onBack={goBackOrHome} />}
        {currentScreen === 'routines' && (
          <RoutineLibrary onBack={goBackOrHome} onLoadPlan={handleLoadPlan} />
        )}
      </div>
    </div>
  );
}
