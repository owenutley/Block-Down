import { BlockType } from '../types';

export const PuzzleShape = ({ type, className }: { type: BlockType; className?: string }) => {
  const cn = className || 'w-1/2 h-1/2';
  switch (type) {
    case 'red-circle':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case 'blue-square':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
        </svg>
      );
    case 'yellow-triangle':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,3 3,20 21,20" />
        </svg>
      );
    case 'purple-star':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
        </svg>
      );
    case 'green-leaf':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12,2 C17,7 21,12 21,16 C21,19 19,21 16,21 C14,21 13,20 12,19 C11,20 10,21 8,21 C5,21 3,19 3,16 C3,12 7,7 12,2 Z" />
        </svg>
      );
    case 'orange-block':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
        </svg>
      );
    default:
      return null;
  }
};
