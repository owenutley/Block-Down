import { memo } from 'react';
import { ShapeId } from '../../shared/themes';

export const PuzzleShape = memo(({
  shape,
  className,
  isCompleted = false,
}: {
  shape: ShapeId;
  className?: string;
  isCompleted?: boolean;
}) => {
  const cn = className || 'w-1/2 h-1/2';
  const accentColor = isCompleted ? '#cbd5e1' : '#ffffff';
  const accentDarkColor = isCompleted ? '#94a3b8' : '#000000';
  const accentOpacity = isCompleted ? 0.95 : 0.4;

  switch (shape) {
    // Neon Cyber / Standard shapes
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12,21.35 l-1.45,-1.32 C5.4,15.36 2,12.28 2,8.5 C2,5.42 4.42,3 7.5,3 c1.74,0 3.41,0.81 4.5,2.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 c0,3.78 -3.4,6.86 -8.55,11.54 L12,21.35 z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 22,12 12,22 2,12" />
        </svg>
      );
    case 'crescent':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12,2 C17.5,2 22,6.5 22,12 C22,17.5 17.5,22 12,22 C10.8,22 9.7,21.8 8.7,21.4 C11.3,19.8 13,17.1 13,14 C13,9.5 9.5,6 5,6 C4,6 3,6.2 2.1,6.6 C4.1,3.8 7.3,2 11,2 L12,2 Z" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case 'cross':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M9,2 h6 v7 h7 v6 h-7 v7 h-6 v-7 h-7 v-6 h7 z" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
        </svg>
      );

    // Winter Wonderland shapes
    case 'snowflake':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 6l3 3M12 6l-3 3M12 18l3-3M12 18l-3-3M6 12l3 3M6 12l3-3M18 12l-3 3M18 12l-3-3" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill={accentColor} />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case 'crystal':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 22,12 12,22 2,12" />
          <polygon points="12,2 17,12 12,22 7,12" fill={accentDarkColor} fillOpacity="0.35" />
          <polygon points="12,5.5 18.5,12 12,18.5 5.5,12" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.8" />
          <line x1="12" y1="2" x2="12" y2="22" stroke={accentColor} strokeWidth="1.5" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2c0 5.5 4.5 10 10 10-5.5 0-10 4.5-10 10 0-5.5-4.5-10-10-10 5.5 0 10-4.5 10-10z" />
          <polygon points="12,6 14,11 19,12 14,13 12,18 10,13 5,12 10,11" fill={accentColor} opacity="0.75" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'snowman':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="16" r="5.5" />
          <circle cx="12" cy="8.5" r="4" />
          <path d="M7.5 5.5h9v1.2h-9z" fill={accentColor} />
          <path d="M9 2h6v3.5H9z" />
          <circle cx="10.5" cy="7.8" r="0.8" fill={accentColor} />
          <circle cx="13.5" cy="7.8" r="0.8" fill={accentColor} />
          <polygon points="12,9.2 15,9.8 12,10.2" fill={accentColor} />
          <circle cx="12" cy="14" r="0.7" fill={accentColor} />
          <circle cx="12" cy="16.5" r="0.7" fill={accentColor} />
        </svg>
      );
    case 'tree':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L6 9h3l-4 5h5v6h4v-6h5l-4-5h3L12 2z" />
          <path d="M12 2L6.8 8h10.4L12 2zm-7 12h14l-4.5-5h-5L5 14z" fill={accentColor} opacity="0.4" />
          <rect x="10.5" y="17" width="3" height="3" fill={accentDarkColor} />
          <polygon points="12,1 12.8,2.5 14.5,2.5 13.2,3.5 13.7,5 12,4 10.3,5 10.8,3.5 9.5,2.5 11.2,2.5" fill={accentColor} />
        </svg>
      );
    case 'cube':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 21,7 12,12 3,7" fill={accentColor} fillOpacity="0.7" />
          <polygon points="3,7 12,12 12,22 3,17" />
          <polygon points="12,12 21,7 21,17 12,22" fill={accentDarkColor} fillOpacity="0.4" />
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zM12 22V12M12 12L3 7M12 12l9-7" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'igloo':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Dome Snow Igloo with Entrance Arch & Block Lines */}
          <path d="M12 3C6.5 3 2 7.5 2 13v7h20v-7c0-5.5-4.5-10-10-10zm-1 10a3 3 0 0 1 6 0v7h-6v-7z" />
          <path d="M4 11h16M5 15h14" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
          <path d="M11 13a3 3 0 0 1 6 0v7h-6v-7z" fill={accentDarkColor} fillOpacity="0.4" />
        </svg>
      );
    case 'north_star':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Glowing 8-Pointed North Star / Compass Star */}
          <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />
          <polygon points="12,6 13.5,9.5 17,11 13.5,12.5 12,16 10.5,12.5 7,11 10.5,9.5" fill={accentColor} opacity="0.7" />
        </svg>
      );
    case 'icicle':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Hanging Jagged Icicle Shards */}
          <polygon points="5,2 8,18 11,2" />
          <polygon points="10,2 13.5,22 17,2" />
          <polygon points="16,2 18.5,14 21,2" />
          <polygon points="5,2 7,16 9,2" fill={accentColor} opacity="0.6" />
          <polygon points="10,2 12.5,20 14,2" fill={accentColor} opacity="0.6" />
        </svg>
      );

    // Enchanted Forest shapes
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M21 2c-3.87 0-9.87 2.1-13.4 5.6C4.4 10.8 3 15.5 3 20c0 .55.45 1 1 1 4.5 0 9.2-1.4 12.4-4.6 3.5-3.53 5.6-9.53 5.6-13.4 0-.55-.45-1-1-1zm-6.2 9.2c-1.56 1.56-3.8 2.6-6.8 3.2 0-.2.1-.4.1-.6.6-3 1.64-5.24 3.2-6.8 1.56-1.56 3.8-2.6 6.8-3.2-.6 3-1.64 5.24-3.3 6.8z" />
          <path d="M4 20C7 16 11 12 21 2" stroke={accentColor} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M8 16l4-2M11 13l4-2M14 10l4-2" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case 'acorn':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2a2 2 0 0 0-2 2c0 .4.1.8.3 1.1C6.7 5.7 4 8.5 4 12c0 4.5 4.5 9 8 10 3.5-1 8-5.5 8-10 0-3.5-2.7-6.3-6.3-6.9.2-.3.3-.7.3-1.1a2 2 0 0 0-2-2zm0 6c2.8 0 5 1.8 5 4H7c0-2.2 2.2-4 5-4z" />
          <path d="M4.5 9.5c.5-2.5 3.5-4.5 7.5-4.5s7 2 7.5 4.5H4.5z" fill={accentColor} fillOpacity="0.4" />
          <path d="M8 8h8M9 6.5h6" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'mushroom':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7 2 4 6 4 11h16c0-5-3-9-8-9zm-2 10v9a2 2 0 0 0 4 0v-9h-4z" />
          <circle cx="8" cy="6" r="1.5" fill={accentColor} />
          <circle cx="16" cy="6" r="1.5" fill={accentColor} />
          <circle cx="12" cy="4.5" r="1.2" fill={accentColor} />
          <path d="M6 11c0-3.5 2.5-7 6-7s6 3.5 6 7H6z" fill={accentDarkColor} fillOpacity="0.25" />
        </svg>
      );
    case 'pinecone':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C8 6 6 11 6 15c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-2-9-6-13zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-2-4c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
          <circle cx="10" cy="14" r="1" fill={accentColor} />
          <circle cx="14" cy="14" r="1" fill={accentColor} />
          <circle cx="12" cy="10" r="1" fill={accentColor} />
          <circle cx="12" cy="17.5" r="0.8" fill={accentColor} />
        </svg>
      );
    case 'flower':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Classic 6-Petal Flower Bloom with Center Core */}
          <circle cx="12" cy="5.5" r="3.5" />
          <circle cx="17.6" cy="8.75" r="3.5" />
          <circle cx="17.6" cy="15.25" r="3.5" />
          <circle cx="12" cy="18.5" r="3.5" />
          <circle cx="6.4" cy="15.25" r="3.5" />
          <circle cx="6.4" cy="8.75" r="3.5" />
          <circle cx="12" cy="12" r="3.8" fill={accentColor} />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case 'stump':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M4 8v10c0 2.2 3.6 4 8 4s8-1.8 8-4V8H4z" />
          <ellipse cx="12" cy="8" rx="8" ry="4" fill={accentColor} fillOpacity="0.6" />
          <ellipse cx="12" cy="8" rx="5.5" ry="2.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <ellipse cx="12" cy="8" rx="2.5" ry="1.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'owl':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Crisp Woodland Owl with Ear Tufts & Large Eyes */}
          <path d="M12 3C8 3 5 5.5 5 9.5v8.5c0 2 2.5 4 7 4s7-2 7-4V9.5C19 5.5 16 3 12 3zm0 2c3 0 4.5 1.5 5 3.5-1.5 1-3.5 1.5-5 1.5s-3.5-.5-5-1.5c.5-2 2-3.5 5-3.5z" />
          <polygon points="5,9.5 3,3 8,6" />
          <polygon points="19,9.5 21,3 16,6" />
          <circle cx="8.5" cy="11.5" r="2.2" fill={accentColor} />
          <circle cx="8.5" cy="11.5" r="1.1" fill="currentColor" />
          <circle cx="15.5" cy="11.5" r="2.2" fill={accentColor} />
          <circle cx="15.5" cy="11.5" r="1.1" fill="currentColor" />
          <polygon points="12,14.5 10.5,12.5 13.5,12.5" fill={accentColor} />
        </svg>
      );

    // Candy Land shapes
    case 'lollipop':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="8" r="6.5" />
          <path d="M12 14.5v7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 14.5v7.5" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M12 3a5 5 0 0 1 5 5c0 2.8-2.2 5-5 5a3 3 0 0 1-3-3c0-1.7 1.3-3 3-3a1 1 0 0 1 1 1" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'wrapped_candy':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <rect x="5.5" y="8.5" width="13" height="7" rx="3.5" />
          <path d="M5.5 12L2 9.5v5L5.5 12zm13 0l3.5-2.5v5L18.5 12z" />
          <path d="M8 8.5l3 7M11 8.5l3 7M14 8.5l3 7" stroke={accentColor} strokeWidth="1.3" opacity="0.8" />
        </svg>
      );
    case 'candy_cane':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path d="M16 20V8a4 4 0 0 0-8 0v2" />
          <path d="M16 19.5v-2M16 14.5v-2M16 9.5A3.5 3.5 0 0 0 12.5 6M9.5 8v2" stroke={accentColor} strokeWidth="2.2" strokeLinecap="butt" />
        </svg>
      );
    case 'cupcake':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M5.5 13l1.8 8h9.4l1.8-8H5.5z" fill={accentDarkColor} fillOpacity="0.4" />
          <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 .1 1C6 7.4 4.5 9.2 4.5 11.5h15c0-2.3-1.5-4.1-3.6-4.5.1-.3.1-.7.1-1a4 4 0 0 0-4-4z" />
          <circle cx="12" cy="3.5" r="1.5" fill={accentColor} />
          <circle cx="8" cy="9" r="0.8" fill={accentColor} />
          <circle cx="12" cy="8" r="0.8" fill={accentColor} />
          <circle cx="16" cy="9" r="0.8" fill={accentColor} />
          <path d="M7.5 13.5v7.5M10.5 13.5v7.5M13.5 13.5v7.5M16.5 13.5v7.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case 'gummy_bear':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 5.2c1.5 0 2.8.4 3.2 1 0.4-1.4 1.8-2.4 3.3-1.4 1.3 1 1 3-.3 3.7 0.4 1.1.2 2.3-.9 3.2 1.3.3 2.7 1.2 2.7 3 0 1.5-1.4 2-2.8 1 0.5 1.1 0.7 2.3.5 3.5-.2 1.5-1.6 2.3-3 2.3-1.3 0-1.7-.9-1.7-2.3 0-.9-2-.9-2 0 0 1.4-.4 2.3-1.7 2.3-1.4 0-2.8-.8-3-2.3-.2-1.2 0-2.4.5-3.5-1.4 1-2.8.5-2.8-1 0-1.8 1.4-2.7 2.7-3-1.1-.9-1.3-2.1-.9-3.2-1.3-.7-1.6-2.7-.3-3.7 1.5-1 2.9 0 3.3 1.4.4-.6 1.7-1 3.2-1z" />
          <circle cx="9.8" cy="8.2" r="0.9" fill={accentColor} />
          <circle cx="14.2" cy="8.2" r="0.9" fill={accentColor} />
          <ellipse cx="12" cy="10.2" rx="1.5" ry="1" fill={accentColor} />
          <ellipse cx="12" cy="15.5" rx="2.5" ry="3" fill={accentColor} fillOpacity="0.3" />
        </svg>
      );
    case 'donut':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
          <path d="M12 3.5C7.3 3.5 3.5 7.3 3.5 12s3.8 8.5 8.5 8.5" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.5" />
          <circle cx="8" cy="6" r="0.8" fill={accentColor} />
          <circle cx="15" cy="5.5" r="0.8" fill={accentColor} />
          <circle cx="17.5" cy="11" r="0.8" fill={accentColor} />
          <circle cx="6.5" cy="15" r="0.8" fill={accentColor} />
          <circle cx="15" cy="18" r="0.8" fill={accentColor} />
        </svg>
      );

    // Space Theme
    case 'rocket':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C9 5 8 9 9 13.5l-3.5 3.5V20l3-1 2 2h2l2-2 3 1v-3L15 13.5C16 9 15 5 12 2z" />
          <circle cx="12" cy="8" r="2" fill={accentColor} />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
          <polygon points="12,17 10,21 12,19.5 14,21" fill={accentColor} opacity="0.8" />
          <path d="M7 16l-3.5 3.5V20l3-1" fill={accentDarkColor} fillOpacity="0.4" />
        </svg>
      );
    case 'alien':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7 2 3 6 3 11c0 4.5 3.5 8 8 9v2h2v-2c4.5-1 8-4.5 8-9 0-5-4-9-9-9z" />
          <ellipse cx="8" cy="10.5" rx="2.5" ry="3.5" fill={accentColor} />
          <ellipse cx="16" cy="10.5" rx="2.5" ry="3.5" fill={accentColor} />
          <circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" />
          <circle cx="15.5" cy="10.5" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'planet':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="6" />
          <ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke={accentColor} strokeWidth="1.8" transform="rotate(-20 12 12)" />
          <circle cx="9.5" cy="9.5" r="1.2" fill={accentColor} opacity="0.6" />
          <circle cx="14" cy="13.5" r="0.8" fill={accentColor} opacity="0.6" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          <polygon points="12,2 15,9 12,17 9,9" fill={accentColor} opacity="0.4" />
        </svg>
      );
    case 'ufo':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 4c2.5 0 4.5 1.5 5 3.5h-10c.5-2 2.5-3.5 5-3.5z" fill={accentColor} />
          <path d="M21 10c0 2-4 3.5-9 3.5S3 12 3 10c0-1.5 3-2.5 7-2.9v-.6c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v.6c4 .4 7 1.4 7 2.9z" />
          <circle cx="7" cy="10" r="1" fill={accentColor} />
          <circle cx="12" cy="10.5" r="1" fill={accentColor} />
          <circle cx="17" cy="10" r="1" fill={accentColor} />
        </svg>
      );
    case 'comet':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="6" cy="18" r="4.5" />
          <circle cx="6" cy="18" r="2" fill={accentColor} />
          <path d="M9 14.5L22 2l-6 12L9 14.5z" stroke={accentColor} strokeWidth="1" />
          <path d="M4.5 13.5L19 2l-1.5 8.5L4.5 13.5z" opacity="0.6" />
          <circle cx="18" cy="7" r="1.2" fill={accentColor} />
          <circle cx="14" cy="4" r="0.8" fill={accentColor} />
        </svg>
      );

    // Ocean Theme
    case 'fish':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 5c-4.5 0-8.5 2-10 7 1.5 5 5.5 7 10 7 2.5 0 5-.5 7-1.5L22 20v-16l-3 2.5c-2-1-4.5-1.5-7-1.5z" />
          <path d="M7 6.5C8.5 4.5 11 3.5 13 4v3.5L7 6.5z" fill={accentColor} opacity="0.5" />
          <circle cx="7.5" cy="11.5" r="1.5" fill={accentColor} />
          <circle cx="7.5" cy="11.5" r="0.8" fill="currentColor" />
          <path d="M10 9.5c.8 1.5.8 3.5 0 5" stroke={accentColor} strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'anchor':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="5" r="1" fill={accentColor} />
          <rect x="11" y="7" width="2" height="12" rx="0.5" />
          <rect x="7" y="10" width="10" height="2" rx="0.5" />
          <path d="M5 12c0 4.5 3.1 7 7 7s7-2.5 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M2 11.5l3.5 3v-3H2zm16.5 0l3.5 3v-3h-3.5z" fill={accentColor} />
        </svg>
      );
    case 'shell':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C6.5 2 2.5 6 2 11c0 3 1.5 5.5 3 7l7 4 7-4c1.5-1.5 3-4 3-7 0-5-4.5-9-10-9zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6H6z" />
          <path d="M12 2v18M8 4.5l2 14.5M16 4.5l-2 14.5M5 8.5l5 11M19 8.5l-5 11" stroke={accentColor} strokeWidth="1.2" fill="none" opacity="0.75" />
        </svg>
      );
    case 'wave':
    case 'trident':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Poseidon Trident Spear */}
          <path d="M11 9.5V22h2V9.5c3.2-.4 5.5-2.8 6-6.5h-2c-.4 2.8-2 4.5-4 4.8V5.5l2-3.5h-6l2 3.5v2.3C9 7.5 7.4 5.8 7 3H5c.5 3.7 2.8 6.1 6 6.5z" />
          <polygon points="5,3 3.5,6.5 6.5,6.5" fill={accentColor} />
          <polygon points="19,3 17.5,6.5 20.5,6.5" fill={accentColor} />
        </svg>
      );
    case 'octopus':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2c-3.8 0-7 2.7-7 6.5 0 2 1.2 3.8 2.5 4.8-.8.5-1.5 1.3-1.5 2.2 0 1.5 2 1.5 2 0 0-.8.6-1.5 1.5-1.5.5 0 1 .2 1.3.5-.8 1-1.3 2.2-1.3 3.5 0 1.5 2 1.5 2 0 0-1.8.8-3.2 2-3.8 1.2.6 2 2 2 3.8 0 1.5 2 1.5 2 0 0-1.3-.5-2.5-1.3-3.5.3-.3.8-.5 1.3-.5.9 0 1.5.7 1.5 1.5 0 1.5 2 1.5 2 0 0-.9-.7-1.7-1.5-2.2 1.3-1 2.5-2.8 2.5-4.8C19 4.7 15.8 2 12 2z" />
          <circle cx="9.5" cy="7.5" r="1.8" fill={accentColor} />
          <circle cx="9.5" cy="7.5" r="0.9" fill="currentColor" />
          <circle cx="14.5" cy="7.5" r="1.8" fill={accentColor} />
          <circle cx="14.5" cy="7.5" r="0.9" fill="currentColor" />
        </svg>
      );
    case 'submarine':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M19 10h-2V7h-3v3H9C5.1 10 2 12.7 2 16s3.1 6 7 6h10c3.9 0 7-2.7 7-6s-3.1-6-7-6z" />
          <circle cx="7.5" cy="16" r="1.8" fill={accentColor} />
          <circle cx="7.5" cy="16" r="0.9" fill="currentColor" />
          <circle cx="12" cy="16" r="1.8" fill={accentColor} />
          <circle cx="12" cy="16" r="0.9" fill="currentColor" />
          <circle cx="16.5" cy="16" r="1.8" fill={accentColor} />
          <circle cx="16.5" cy="16" r="0.9" fill="currentColor" />
          <path d="M16 7h-2v3h2V7z" fill={accentColor} />
        </svg>
      );

    // Retro Arcade Theme
    case 'ghost':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7.6 2 4 5.6 4 10v10l3-2 3 2 2-2 2 2 3-2 3 2V10c0-4.4-3.6-8-8-8z" />
          <circle cx="9" cy="9.5" r="2" fill={accentColor} />
          <rect x="9.5" y="8.5" width="1.5" height="2" fill="currentColor" />
          <circle cx="15" cy="9.5" r="2" fill={accentColor} />
          <rect x="15.5" y="8.5" width="1.5" height="2" fill="currentColor" />
        </svg>
      );
    case 'joystick':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="6" r="4" />
          <circle cx="10.5" cy="4.5" r="1.2" fill={accentColor} />
          <rect x="10.5" y="9.5" width="3" height="6.5" rx="1" fill={accentDarkColor} />
          <path d="M4 17.5h16v4.5H4z" />
          <circle cx="7" cy="19.5" r="1" fill={accentColor} />
          <circle cx="17" cy="19.5" r="1" fill={accentColor} />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="2,18 2,7 7,12 12,5 17,12 22,7 22,18" />
          <rect x="2" y="19" width="20" height="3" rx="0.8" fill={accentDarkColor} />
          <circle cx="2" cy="6" r="1" fill={accentColor} />
          <circle cx="12" cy="4" r="1.2" fill={accentColor} />
          <circle cx="22" cy="6" r="1" fill={accentColor} />
          <circle cx="7" cy="20.5" r="0.8" fill={accentColor} />
          <circle cx="12" cy="20.5" r="0.8" fill={accentColor} />
          <circle cx="17" cy="20.5" r="0.8" fill={accentColor} />
        </svg>
      );
    case 'gem':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 21,9 12,22 3,9" />
          <polygon points="7,9 12,2 17,9" fill={accentColor} fillOpacity="0.5" />
          <polygon points="12,2 21,9 12,22" fill={accentDarkColor} fillOpacity="0.3" />
          <line x1="3" y1="9" x2="21" y2="9" stroke={accentColor} strokeWidth="1.2" />
        </svg>
      );
    case 'sword':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M21 3c-1-1-2.5-1-3.5 0L8.5 12 6 10.5 4.5 12l2 2-3 3v2.5H6l3-3 2 2 1.5-1.5L12 15.5l9-9c1-1 1-2.5 0-3.5z" />
          <line x1="20" y1="4" x2="10" y2="14" stroke={accentColor} strokeWidth="1.5" />
          <circle cx="4.5" cy="19.5" r="1" fill={accentColor} />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3z" />
          <path d="M12 4.5L5.5 7v4.5c0 4.5 3 8.7 6.5 9.8" stroke={accentColor} strokeWidth="1.2" fill="none" opacity="0.6" />
          <rect x="11" y="6" width="2" height="12" fill={accentColor} />
          <rect x="6" y="11" width="12" height="2" fill={accentColor} />
        </svg>
      );

    // Desert Theme
    case 'pyramid':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* 3D Stepped Egyptian Pyramid */}
          <polygon points="12,2 22,20 12,20" fill={accentDarkColor} fillOpacity="0.4" />
          <polygon points="12,2 2,20 12,20" />
          <polygon points="12,2 22,20 2,20" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.5" />
          <line x1="12" y1="2" x2="12" y2="20" stroke={accentColor} strokeWidth="1.5" />
          <path d="M8 13h8M6 16.5h12M10 9.5h4" stroke={accentColor} strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'cactus':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Bold Saguaro Cactus with Flower Bloom */}
          <path d="M10 4a2 2 0 0 1 4 0v17h-4V4z" />
          <path d="M5 8a2 2 0 0 1 4 0v4h2v2H7a2 2 0 0 1-2-2V8z" />
          <path d="M19 10a2 2 0 0 0-4 0v4h-2v2h4a2 2 0 0 0 2-2v-4z" />
          <circle cx="12" cy="2.5" r="1.5" fill={accentColor} />
        </svg>
      );
    case 'camel':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M22 8.5c0-.8-.7-1.5-1.5-1.5H19l-1 2-2-1c-1-1-2.5-1-3.5 0l-2 1-1-2.5c-.2-.6-.8-1-1.5-1H5c-.8 0-1.5.7-1.5 1.5v3h1l.5 6.5H4.5L5 22h2l.5-5.5h3.5L11.5 22h2l.5-5.5h4.5l.5 2 2-.5-1.5-6c1.5-.5 2.5-2 2.5-3.5z" />
          <rect x="10" y="9.5" width="5" height="4" rx="0.5" fill={accentColor} fillOpacity="0.7" />
          <circle cx="20.5" cy="8" r="0.8" fill={accentColor} />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="3" fill={accentColor} />
          <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'eye_of_horus':
    case 'scarab':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Egyptian Winged Scarab Beetle */}
          <circle cx="12" cy="5" r="2.5" fill={accentColor} />
          <path d="M12 8c-3 0-5.5 2-6 5h12c-.5-3-3-5-6-5z" />
          <path d="M6 14c0 4.5 2.7 7 6 7s6-2.5 6-7H6z" fillOpacity="0.8" />
          <path d="M5 11C3 9.5 1.5 8 1 5c2.5 1 4.5 3 5 5h-1zm14 0c2-1.5 3.5-3 4-6-2.5 1-4.5 3-5 5h1z" />
        </svg>
      );
    case 'palm_tree':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Curved Palm Trunk with Spreading Fan Fronds */}
          <path d="M11 11c1.5 3.5 1 7.5.2 11h2.5c.8-3.5 1.5-7.5-.2-11h-2.5z" opacity="0.85" />
          <path d="M12 11C8 11 3 9 2 5c4 0 7.5 2 9.5 5.5z" />
          <path d="M12 11C16 11 21 9 22 5c-4 0-7.5 2-9.5 5.5z" />
          <path d="M12 11C9 8 7 3 8 1c3 2 4 6 4 10z" />
          <path d="M12 11C15 8 17 3 16 1c-3 2-4 6-4 10z" />
          <circle cx="10.5" cy="11.5" r="1.2" fill={accentColor} />
          <circle cx="13.5" cy="11.5" r="1.2" fill={accentColor} />
        </svg>
      );

    // Spooky Halloween shapes
    case 'skull':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7.03 2 3 6.03 3 11c0 3.24 1.72 6.07 4.3 7.6L7 21a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l-.3-2.4c2.58-1.53 4.3-4.36 4.3-7.6 0-4.97-4.03-9-9-9z" />
          <ellipse cx="8.5" cy="11.5" rx="1.8" ry="2.2" fill={accentDarkColor} />
          <ellipse cx="15.5" cy="11.5" rx="1.8" ry="2.2" fill={accentDarkColor} />
          <polygon points="12,13.5 11,15.5 13,15.5" fill={accentDarkColor} />
          <path d="M9 19h1.5v2H9zm2.25 0h1.5v2h-1.5zm2.25 0h1.5v2h-1.5z" fill={accentColor} />
        </svg>
      );
    case 'bat':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Bold, Clean & Iconic Bat with High Arched Wings & Tall Ears */}
          <path d="M12 7.5c-1.2 0-2-.8-2.2-2.2L8.5 2.2l1.3 3.8C7 5 4 3.2 2 2.5c2.5 3.5 3 7.5 2.5 10 2.2 1 4.5.2 6-1.5 0 2.5 1 4.8 1.5 6.5 1.2 1.8 1.5 2.5 0 3 1.2 0 1.5-1.2 1.5-3 0-.5 3.8-1.7 6-1.5 1.5 1.7 3.8 2.5 6 1.5-.5-2.5 0-6.5 2.5-10C20 3.2 17 5 14.2 6L15.5 2.2l-1.3 3.8c-.2 1.4-1 2.2-2.2 2.2z" />
          {/* Crisp Eye Highlights */}
          <circle cx="10.2" cy="7" r="0.9" fill={accentColor} />
          <circle cx="13.8" cy="7" r="0.9" fill={accentColor} />
        </svg>
      );
    case 'tombstone':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Arched Gothic Tombstone with Engraved Cross & RIP */}
          <path d="M12 2C6.5 2 5 6 5 10v10h14V10c0-4-1.5-8-7-8z" />
          <rect x="3" y="19" width="18" height="3" rx="0.5" />
          <path d="M12 3C7.5 3 6.2 6.5 6.2 10v9h11.6V10c0-3.5-1.3-7-5.8-7z" fill={accentDarkColor} fillOpacity="0.2" />
          {/* Engraved Cross */}
          <rect x="11.2" y="5" width="1.6" height="5.5" fill={accentColor} />
          <rect x="9.2" y="6.8" width="5.6" height="1.6" fill={accentColor} />
          {/* RIP Text Marks */}
          <path d="M7.5 13h1.8c.6 0 1 .3 1 .8s-.4.8-1 .8h-1.8v-1.6zm.7.5v.6h1c.2 0 .4-.1.4-.3s-.2-.3-.4-.3h-1zM11.6 13h.8v2.5h-.8V13zm2.1 0h1.8c.6 0 1 .3 1 .8s-.4.8-1 .8h-1.8v-1.6zm.7.5v.6h1c.2 0 .4-.1.4-.3s-.2-.3-.4-.3h-1z" fill={accentColor} />
        </svg>
      );
    case 'pumpkin':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Carved Jack-O'-Lantern */}
          <path d="M12 2c-.8 0-1.5.5-1.8 1.2C6.2 3.5 3 6.8 3 11c0 4.5 4 8 9 8s9-3.5 9-8c0-4.2-3.2-7.5-7.2-7.8C13.5 2.5 12.8 2 12 2zm0 2c.4 0 .8.3.9.7-.5.1-1 .1-1.5 0 .2-.4.4-.7.6-.7z" />
          {/* Glowing Carved Face */}
          <polygon points="8,9 10,11 7,11" fill={accentColor} />
          <polygon points="16,9 17,11 14,11" fill={accentColor} />
          <polygon points="12,11.5 11,13 13,13" fill={accentColor} />
          <path d="M7.5 14.5h9c-.5 2-2 3-4.5 3s-4-1-4.5-3z" fill={accentColor} />
          <path d="M9 14.5v1.2M12 14.5v1.5M15 14.5v1.2" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case 'witch_hat':
    case 'spellbook':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Leather-Bound Spooky Spellbook / Grimoire */}
          <rect x="4" y="3" width="16" height="18" rx="2" fill="currentColor" />
          <rect x="18" y="4" width="2" height="16" fill={accentDarkColor} fillOpacity="0.4" />
          <line x1="6.5" y1="3" x2="6.5" y2="21" stroke={accentColor} strokeWidth="1.5" />
          {/* Glowing Skull Clasp */}
          <circle cx="12.5" cy="12" r="3.2" fill={accentColor} />
          <circle cx="11.2" cy="11.5" r="0.8" fill="currentColor" />
          <circle cx="13.8" cy="11.5" r="0.8" fill="currentColor" />
          <rect x="11.8" y="13.2" width="1.4" height="1" fill="currentColor" />
          {/* Bookmark Ribbon */}
          <polygon points="15,21 16.5,23 18,21 18,17 15,17" fill={accentColor} opacity="0.85" />
        </svg>
      );
    case 'cauldron':
    case 'spider':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Black Widow Spider with 8 Curved Legs & Hourglass Badge */}
          <circle cx="12" cy="7" r="3" />
          <ellipse cx="12" cy="15" rx="4.5" ry="5.5" />
          {/* White Hourglass / Diamond Mark */}
          <polygon points="12,11.5 14,14 12,15 14,16 12,18.5 10,16 12,15 10,14" fill={accentColor} />
          {/* 8 Legs */}
          <path d="M9 7C6 5 3 6 2 9M15 7c3-2 6-1 7 2M8.5 10C5 9 2 11 1 14M15.5 10c3.5-1 6.5 1 7.5 4M9 13C6 13 3 16 2 19M15 13c3 0 6 3 7 6M9.5 16C7 17 4 20 3 23M14.5 16c2.5 1 5.5 4 6.5 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'potion':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M16 3H8v2h1v3.5L5.2 16.5C4.5 18 5.6 20 7.3 20h9.4c1.7 0 2.8-2 2.1-3.5L15 8.5V5h1V3z" />
          <rect x="9" y="2" width="6" height="1.8" rx="0.5" fill={accentColor} />
          <path d="M6.5 15h11c.5 1.5-.2 3.5-1.5 4.5h-8c-1.3-1-2-3-1.5-4.5z" fill={accentDarkColor} fillOpacity="0.4" />
          <circle cx="10" cy="17" r="1.2" fill={accentColor} />
          <circle cx="14" cy="16" r="0.9" fill={accentColor} />
          <circle cx="11.5" cy="12" r="1" fill={accentColor} opacity="0.8" />
        </svg>
      );

    // Volcanic Magma shapes
    case 'fire':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Vibrant 3-Layer Flame Tongue */}
          <path d="M12 2C9.5 5 7 8 7 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-3-2-6-4-8.5-1 2.5-2.5 4-4 4s-2-2-1-5.5z" />
          <path d="M12 8c-1.5 2-2.5 4-2.5 6 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5c0-2-1-4-2.5-6-.5 1.5-1.5 2.5-2 2.5s-1-1-2-2.5z" fill={accentColor} />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'volcano':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Erupting Volcano Mountain Base */}
          <path d="M2 21l8.5-12h3L22 21H2z" />
          {/* Cascading Molten Lava Brim & Drips at Crater Top */}
          <path d="M10.5 9h3l.5 2c-.5.8-1 1.2-1.8 1.2s-1.3-.4-1.7-1.2l- 0-2z" />
          <path d="M9.5 9h5c.5 0 1 .5 1 1.2-.5 1.5-1.5 2.8-3.5 2.8s-3-1.3-3.5-2.8c0-.7.5-1.2 1-1.2z" fill={accentColor} />
          {/* Flying Erupting Lava Sparks */}
          <circle cx="8" cy="7.5" r="1" fill={accentColor} />
          <circle cx="16" cy="7" r="1" fill={accentColor} />
          <circle cx="6.5" cy="9" r="0.7" fill={accentColor} />
          {/* Stylized Puffy Ash Smoke Plume Billowing Upward */}
          <path d="M12 7.5c-1.5 0-2.5-.8-2.5-2 0-.6.4-1.2 1-1.5C10.2 3.3 10.8 2.5 12 2.5c1.2 0 1.8.8 1.5 1.5.6.3 1 1 1 1.5 0 1.2-1 2-2.5 2z" fill={accentColor} opacity="0.85" />
        </svg>
      );
    case 'bomb':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="14" r="7.5" />
          <circle cx="9.5" cy="11.5" r="1.8" fill={accentColor} opacity="0.7" />
          <path d="M12 6.5V4.5h2v2" stroke={accentColor} strokeWidth="1.5" fill="none" />
          <polygon points="16,3 18,1 17.5,3.5 19.5,3 17.5,4" fill={accentColor} />
        </svg>
      );
    case 'key':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="6.5" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="6.5" cy="12" r="1.8" fill={accentColor} />
          <rect x="9.5" y="10.8" width="11" height="2.4" rx="0.5" />
          <rect x="15" y="13" width="2" height="3" fill="currentColor" />
          <rect x="18" y="13" width="2" height="3" fill="currentColor" />
        </svg>
      );
    case 'chest':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M3 10v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V10H3z" />
          <path d="M21 8.5L18 3H6L3 8.5h18z" opacity="0.75" />
          <rect x="3" y="9.5" width="18" height="2" fill={accentColor} opacity="0.8" />
          <rect x="10.5" y="12" width="3" height="4" rx="0.5" fill={accentColor} />
          <circle cx="12" cy="14" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'anvil':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M20 6h-6v2l2 2v4l-4 2-4-2v-4l2-2V6H4l2 6-4 4h20l-2-4 2-6z" />
          <rect x="4" y="6" width="16" height="1.5" fill={accentColor} opacity="0.8" />
        </svg>
      );
    case 'pickaxe':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Mining Forge Pickaxe */}
          <path d="M14.5 3.5l6 6-1.5 1.5-6-6 1.5-1.5zm-11 15.5l10-10 1.5 1.5-10 10h-1.5v-1.5z" />
          <path d="M18 2c-3.5 0-7 2-9 4.5l3.5 3.5C15 8 17 4.5 22 4l-4-2z" fill={accentColor} opacity="0.85" />
        </svg>
      );

    // High Vantage Wilderness shapes
    case 'mountain':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 3L3 19h18L12 3z" />
          <polygon points="12,3 15.8,9.3 8.2,9.3" fill={accentColor} />
          <path d="M16.5 11.5L21 19h-9l4.5-7.5z" opacity="0.5" />
          <polygon points="16.5,11.5 18.5,15 14.5,15" fill={accentColor} opacity="0.8" />
        </svg>
      );
    case 'pine':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L5 9h3l-4 5h4l-3 4h14l-3-4h4l-4-5h3L12 2z" />
          <path d="M12 2L6.8 8h10.4L12 2zm-7 12h14l-4.5-5h-5L5 14z" stroke={accentColor} strokeWidth="1.2" fill="none" opacity="0.8" />
          <rect x="10.5" y="19" width="3" height="3" fill={accentDarkColor} />
        </svg>
      );
    case 'campfire':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2c-2.5 3-4 5.5-4 8 0 3 2.5 5 4 5s4-2 4-5c0-2.5-1.5-5-4-8z" fill={accentColor} />
          <path d="M12 6c-1.5 2-2.5 3.5-2.5 5 0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5c0-1.5-1-3-2.5-5z" fill="currentColor" />
          <rect x="3" y="18" width="18" height="3.5" rx="1.5" transform="rotate(-15 12 19.7)" fill={accentDarkColor} />
          <rect x="3" y="18" width="18" height="3.5" rx="1.5" transform="rotate(15 12 19.7)" fill={accentDarkColor} />
          <circle cx="8" cy="15" r="0.8" fill={accentColor} />
          <circle cx="16" cy="15" r="0.8" fill={accentColor} />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <polygon points="12,4 15.5,12 12,10.8 8.5,12" fill={accentColor} />
          <polygon points="12,20 15.5,12 12,13.2 8.5,12" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.8" />
        </svg>
      );

    // Paper Craftbook Custom Shapes
    case 'origami_crane':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 17,9 22,7 15,14 12,22 9,14 2,7 7,9" />
          <polygon points="12,2 15,14 12,22 9,14" fill={accentColor} fillOpacity="0.5" />
          <line x1="12" y1="2" x2="12" y2="22" stroke={accentColor} strokeWidth="1.2" />
        </svg>
      );
    case 'paper_plane':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M2.5 11.5L21 2l-9.5 18.5-2.5-6.5-6.5-2.5z" />
          <polygon points="21,2 11.5,14 9,13.5" fill={accentColor} fillOpacity="0.4" />
          <line x1="21" y1="2" x2="11.5" y2="14" stroke={accentColor} strokeWidth="1.5" />
        </svg>
      );
    case 'scissors':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8.5 7.5L20 19M8.5 16.5L20 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.2" fill={accentColor} />
        </svg>
      );
    case 'stamp':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M10 2h4v4h-4V2zm2 4c-3 0-5 2-5 5v2h10v-2c0-3-2-5-5-5zm-7 9h14v5H5v-5z" />
          <polygon points="12,16 13,18.5 15.5,18.5 13.5,20 14.2,22 12,20.8 9.8,22 10.5,20 8.5,18.5 11,18.5" fill={accentColor} />
        </svg>
      );
    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          <rect x="14.5" y="5.5" width="2.5" height="5" transform="rotate(45 15.7 8)" fill={accentColor} opacity="0.8" />
          <polygon points="3,21 6.5,20 4,17.5" fill={accentDarkColor} />
        </svg>
      );
    case 'tape_roll':
    case 'origami_star':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* 4-Pointed Folded Origami Star */}
          <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" />
          <polygon points="12,2 15,9 12,12 9,9" fill={accentColor} fillOpacity="0.6" />
          <polygon points="12,22 15,15 12,12 9,15" fill={accentColor} fillOpacity="0.6" />
        </svg>
      );

    default:
      return null;
  }
});


