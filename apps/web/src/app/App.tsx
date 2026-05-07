import { useState } from 'react';
import type { Exercise, WorkoutPlan } from './domain/workout';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { WorkoutSetup } from './components/WorkoutSetup';
import { PlanPreview } from './components/PlanPreview';
import { WorkoutSession } from './components/WorkoutSession';
import { WorkoutComplete } from './components/WorkoutComplete';
import { Profile } from './components/Profile';

type Screen = 'login' | 'home' | 'setup' | 'preview' | 'session' | 'complete' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<Exercise[] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentScreen('home');
  };

  const handleStartWorkout = () => {
    setCurrentScreen('setup');
  };

  const handlePlanGenerated = (plan: WorkoutPlan) => {
    setWorkoutPlan(plan);
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

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setWorkoutPlan(null);
  };

  const handleGoToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleBackFromSetup = () => {
    setCurrentScreen('home');
  };

  const handleBackFromPreview = () => {
    setCurrentScreen('setup');
  };

  const handleBackFromSession = () => {
    setCurrentScreen('preview');
  };

  return (
    <div className="size-full bg-neutral-950 text-white">
      {currentScreen === 'login' && (
        <Login onLogin={handleLogin} />
      )}
      {currentScreen === 'home' && (
        <Home onStartWorkout={handleStartWorkout} onGoToProfile={handleGoToProfile} />
      )}
      {currentScreen === 'setup' && (
        <WorkoutSetup onPlanGenerated={handlePlanGenerated} onBack={handleBackFromSetup} />
      )}
      {currentScreen === 'preview' && workoutPlan && (
        <PlanPreview plan={workoutPlan} onStartSession={handleStartSession} onBack={handleBackFromPreview} />
      )}
      {currentScreen === 'session' && workoutPlan && (
        <WorkoutSession plan={workoutPlan} onComplete={handleWorkoutComplete} onBack={handleBackFromSession} />
      )}
      {currentScreen === 'complete' && completedWorkout && (
        <WorkoutComplete exercises={completedWorkout} onBackToHome={handleBackToHome} />
      )}
      {currentScreen === 'profile' && (
        <Profile onBackToHome={handleBackToHome} />
      )}
    </div>
  );
}