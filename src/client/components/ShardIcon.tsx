import { memo } from 'react';
import { PuzzleShape } from './PuzzleShape';
import { cn } from '../utils';

export type ShardIconProps = {
  className?: string;
  isCompleted?: boolean;
};

/**
 * Universal Currency Shard Icon for Block Down.
 * Renders the custom 3D cut gemstone icon with specular facet highlights.
 */
export const ShardIcon = memo(({ className = 'w-3.5 h-3.5 text-cyan-300', isCompleted = false }: ShardIconProps) => {
  return <PuzzleShape shape="gem" className={cn('inline-block shrink-0', className)} isCompleted={isCompleted} />;
});
