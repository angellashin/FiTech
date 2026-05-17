import { useState, useEffect } from 'react';
import type { Exercise, WorkoutPlan } from './domain/workout';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { WorkoutSetup } from './components/WorkoutSetup';
import { PlanPreview } from './components/PlanPreview';
import { WorkoutSession } from './components/WorkoutSession';
import { WorkoutComplete } from './components/WorkoutComplete';
import { Profile } from './components/Profile';
import { getUserSettings, applyDarkMode } from './utils/userSettings';

type Screen = 'login' | 'home' | 'setup' | 'preview' | 'session' | 'complete' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  useEffect(() => {
    applyDarkMode(getUserSettings().darkMode);
  }, []);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<Exercise[] | null>(null);
  const [previewSource, setPreviewSource] = useState<'setup' | 'home'>('setup');
  const [homeKey, setHomeKey] = useState(0);
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

  const handleWorkoutComplete = (exercises: Exercise[]) => {
    setCompletedWorkout(exercises);
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
    // Clear all user data so a different person starts fresh
    localStorage.removeItem('fitech_user_name');
    localStorage.removeItem('fitech_user_goal');
    localStorage.removeItem('fitech_avatar_color');
    localStorage.removeItem('fitech_workout_history');
    localStorage.removeItem('fitech_workout_sessions');
    localStorage.removeItem('fitech_saved_routines');
    localStorage.removeItem('fitech_gym_profile');
    localStorage.removeItem('fitech_settings');
    setWorkoutPlan(null);
    setCompletedWorkout(null);
    setCurrentScreen('login');
  };

  const handleGoToProfile = () => {
    setCurrentScreen('profile');
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
          <Home key={homeKey} onStartWorkout={handleStartWorkout} onGoToProfile={handleGoToProfile} onLoadPlan={handleLoadPlan} />
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
          <WorkoutComplete exercises={completedWorkout} onBackToHome={handleBackToHome} />
        )}
        {currentScreen === 'profile' && <Profile onBackToHome={handleBackToHome} onLogout={handleLogout} />}
      </div>
    </div>
  );
}
