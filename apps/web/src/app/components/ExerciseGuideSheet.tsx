import { Bookmark, BookmarkCheck, Lightbulb, ShieldCheck, Target, X } from 'lucide-react';
import type { Exercise } from '../domain/workout';
import { getExerciseGuide } from '../services/exerciseGuide';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isFavoriteExercise, toggleFavoriteExercise } from '../utils/userSettings';

interface ExerciseGuideSheetProps {
  exercise: Pick<Exercise, 'name' | 'muscleGroup'> | null;
  onClose: () => void;
}

type GuideTab = 'about' | 'steps' | 'safety';

const tabLabels: Record<GuideTab, string> = {
  about: 'About',
  steps: 'Steps',
  safety: 'Safety',
};

const tabs: GuideTab[] = ['about', 'steps', 'safety'];

export function ExerciseGuideSheet({ exercise, onClose }: ExerciseGuideSheetProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('about');
  const [favorited, setFavorited] = useState(() =>
    exercise ? isFavoriteExercise(exercise.name) : false,
  );

  if (!exercise) return null;

  const guide = getExerciseGuide(exercise);

  const handleToggleFavorite = () => {
    const next = toggleFavoriteExercise(guide.name);
    setFavorited(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close exercise guide backdrop"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${guide.name} exercise guide`}
        className="relative w-full max-w-[430px] max-h-[88vh] overflow-hidden rounded-t-[2rem] bg-neutral-900 text-white shadow-2xl border-t border-neutral-700/50"
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-neutral-600" />
        <header className="flex items-center justify-between px-5 py-4">
          <motion.button
            type="button"
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            onClick={handleToggleFavorite}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={`h-9 w-9 rounded-full border flex items-center justify-center transition-colors ${
              favorited
                ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
                : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            {favorited ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </motion.button>
          <div className="text-center">
            <h2 className="text-base font-bold text-white">{guide.name}</h2>
            <p className="text-[11px] text-neutral-400">Beginner form guide</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close exercise guide"
            className="h-9 w-9 rounded-full border border-neutral-700 text-neutral-400 flex items-center justify-center hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-5 pb-5 overflow-y-auto max-h-[calc(88vh-4.5rem)]">
          {/* Tab bar */}
          <div className="mx-auto mb-5 relative grid w-full max-w-[260px] grid-cols-3 rounded-full border border-neutral-700 bg-neutral-800 p-1 text-xs font-semibold">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="relative rounded-full py-2 transition-colors z-10"
              >
                {activeTab === tab && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-neutral-700 shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${activeTab === tab ? 'text-white' : 'text-neutral-500'}`}
                >
                  {tabLabels[tab]}
                </span>
              </button>
            ))}
          </div>

          <div className="mb-5 flex justify-center">
            <div className="aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl bg-white">
              <img
                src={guide.imageSrc}
                alt={`${guide.name} form illustration`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-800 text-center">
            <div className="border-r border-neutral-700 px-3 py-4">
              <div className="text-[11px] font-semibold text-neutral-500">Equipment</div>
              <div className="mt-1 text-sm font-bold text-white">{guide.equipment}</div>
            </div>
            <div className="px-3 py-4">
              <div className="text-[11px] font-semibold text-neutral-500">Type</div>
              <div className="mt-1 text-sm font-bold text-white">{guide.type}</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-100">
                  <div className="mb-2 flex items-center gap-2 font-bold text-blue-300">
                    <Target className="h-4 w-4" />
                    Main focus
                  </div>
                  <p className="leading-relaxed text-blue-100">{guide.primaryFocus}</p>
                </div>
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-100">
                  <div className="mb-2 flex items-center gap-2 font-bold text-amber-300">
                    <Lightbulb className="h-4 w-4" />
                    Beginner tip
                  </div>
                  <p className="leading-relaxed text-amber-100">{guide.beginnerTip}</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'steps' && (
              <motion.div
                key="steps"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {guide.instructions.map((instruction, index) => (
                  <div key={instruction} className="flex gap-3 rounded-2xl bg-neutral-800 p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-300">{instruction}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'safety' && (
              <motion.div
                key="safety"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {guide.safetyCues.map((cue) => (
                  <div
                    key={cue}
                    className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-emerald-100">{cue}</p>
                  </div>
                ))}
                <p className="px-1 text-xs leading-relaxed text-neutral-500">
                  If you feel joint pain, dizziness, or sharp discomfort, stop the set and choose a
                  lighter variation.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
