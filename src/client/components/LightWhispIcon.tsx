import { memo } from 'react';
import { cn } from '../utils';

export type LightWhispIconProps = {
  className?: string;
  isCompleted?: boolean;
};

/**
 * Universal Currency Icon for Light Whisps.
 * Renders an ethereal, luminous flame/wisp with radiating energy, specular inner core,
 * and orbital sparkle light particles.
 */
export const LightWhispIcon = memo(
  ({ className = 'w-3.5 h-3.5 text-cyan-300', isCompleted = false }: LightWhispIconProps) => {
    return (
      <svg
        viewBox="0 0 24 24"
        className={cn('inline-block shrink-0', className)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Ambient Radiant Halo */}
        <path
          d="M12 2C11 4 9.5 6 7.8 8.2C5.6 11 4.5 13.8 5 17C5.8 20.6 9.2 22.5 12.5 22.5C16.8 22.5 19.8 19.5 19.2 14.8C18.6 10 14.5 6.2 14.5 2C14.5 2 13.5 3.8 12 2Z"
          fill="currentColor"
          fillOpacity={isCompleted ? 0.35 : 0.22}
        />

        {/* Outer Ethereal Whisp Flame */}
        <path
          d="M12 3C11.3 4.8 10 6.6 8.5 8.6C6.8 11.2 6 13.6 6.5 16.2C7.2 19.2 10 20.8 12.5 20.8C15.8 20.8 18 18.3 17.5 14.5C17.1 10.8 14 7.2 14 3C14 3 13 4.8 12 3Z"
          fill="currentColor"
        />

        {/* Specular Inner Luminous Core */}
        <path
          d="M12.6 8.2C11.6 10 10.5 11.8 10.8 14C11.2 16.2 12.8 17.5 14.6 17C16.2 16.5 16.8 14.6 16.4 12.8C15.8 10.4 14 8.2 12.6 8.2Z"
          fill="#ffffff"
          fillOpacity={isCompleted ? 0.6 : 0.85}
        />

        {/* Swirling Crest Energy Arc */}
        <path
          d="M11.8 3.5C13.2 5.2 14.2 7 14 9"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity={isCompleted ? 0.5 : 0.8}
        />

        {/* Floating Sparkles & Light Motes */}
        <circle cx="5.5" cy="7.5" r="1.1" fill="currentColor" fillOpacity="0.9" />
        <circle cx="5.5" cy="7.5" r="0.5" fill="#ffffff" />
        <circle cx="19" cy="8" r="0.9" fill="currentColor" fillOpacity="0.85" />
        <circle cx="19" cy="8" r="0.4" fill="#ffffff" />
        <circle cx="18" cy="18.5" r="0.9" fill="#ffffff" fillOpacity="0.75" />
        <circle cx="5" cy="14" r="0.6" fill="#ffffff" fillOpacity="0.6" />
      </svg>
    );
  }
);
