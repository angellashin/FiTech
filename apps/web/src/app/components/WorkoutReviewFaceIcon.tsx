import { Annoyed, Frown, Laugh, Meh, Smile, type LucideIcon } from 'lucide-react';
import type { WorkoutReviewRating } from '../domain/workout';

const REVIEW_FACE_ICONS: Record<WorkoutReviewRating, LucideIcon> = {
  1: Frown,
  2: Annoyed,
  3: Meh,
  4: Smile,
  5: Laugh,
};

interface WorkoutReviewFaceIconProps {
  rating: WorkoutReviewRating;
  className?: string;
  strokeWidth?: number;
}

export function WorkoutReviewFaceIcon({
  rating,
  className = 'w-7 h-7',
  strokeWidth = 1.8,
}: WorkoutReviewFaceIconProps) {
  const Icon = REVIEW_FACE_ICONS[rating];
  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
