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

    // Steampunk Foundry Shapes
    case 'gear':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Outer Cog Teeth Base */}
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z" />
          {/* Top-Left Beveled Cog Teeth Highlights (White Specular Glints) */}
          <path d="M14 2.5l.3 2.2c.7.3 1.3.7 1.9 1.1l2.1-.9 1.6 2.8-1.8 1.4c.1.4.1.8.1 1.2" fill="none" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.85" />
          <path d="M4.5 9.5l1.8 1.4c-.1.4-.1.8-.1 1.2l-1.8 1.4 1.6 2.8 2.1-.9c.6.4 1.2.8 1.9 1.1l.3 2.2" fill="none" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.85" />
          {/* Recessed Inner Brass Disc (Dark Grey Shadow) */}
          <circle cx="12" cy="12" r="6.2" fill={accentDarkColor} fillOpacity="0.4" />
          <circle cx="12" cy="12" r="5.2" fill="currentColor" opacity="0.85" />
          {/* Circular Weight-Relief Holes with White Rim Bevels */}
          <circle cx="12" cy="8.2" r="1.3" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="12" cy="8.2" r="1.3" fill="none" stroke={accentColor} strokeWidth="0.6" opacity="0.8" />
          <circle cx="12" cy="15.8" r="1.3" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="12" cy="15.8" r="1.3" fill="none" stroke={accentColor} strokeWidth="0.6" opacity="0.8" />
          <circle cx="8.2" cy="12" r="1.3" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="8.2" cy="12" r="1.3" fill="none" stroke={accentColor} strokeWidth="0.6" opacity="0.8" />
          <circle cx="15.8" cy="12" r="1.3" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="15.8" cy="12" r="1.3" fill="none" stroke={accentColor} strokeWidth="0.6" opacity="0.8" />
          {/* Central Axle Hub with Keyway Notch & White Bevel */}
          <circle cx="12" cy="12" r="2.2" fill={accentColor} />
          <circle cx="12" cy="12" r="1.5" fill={accentDarkColor} />
          <rect x="11.5" y="10.5" width="1" height="1" fill={accentDarkColor} />
        </svg>
      );
    case 'pocket_watch':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Top Winding Stem, Bow Loop & Crown */}
          <circle cx="12" cy="2.2" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="2.2" r="1.6" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.75" />
          <rect x="11" y="3.6" width="2" height="1.4" rx="0.5" fill="currentColor" />
          <rect x="11" y="3.6" width="2" height="0.6" fill={accentColor} opacity="0.8" />
          {/* Outer Polished Brass Casing */}
          <circle cx="12" cy="14" r="8.8" />
          {/* Curved White Specular Glare Arc on Upper Case */}
          <path d="M5.5 10.5 A 7.5 7.5 0 0 1 18.5 10.5" fill="none" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          {/* Inner Recessed Watch Face Plate (Deep Grey Shadow) */}
          <circle cx="12" cy="14" r="7.2" fill={accentDarkColor} fillOpacity="0.5" />
          {/* White Enamel Dial Chapter Ring & Minute Ticks */}
          <circle cx="12" cy="14" r="6.2" fill="none" stroke={accentColor} strokeWidth="0.9" opacity="0.9" />
          <line x1="12" y1="8.4" x2="12" y2="9.6" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="12" y1="18.4" x2="12" y2="19.6" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="6.4" y1="14" x2="7.6" y2="14" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="16.4" y1="14" x2="17.6" y2="14" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          {/* Fine Antique Clockwork Hands */}
          <line x1="12" y1="14" x2="12" y2="9.8" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="14" x2="15.4" y2="11.8" stroke={accentColor} strokeWidth="1.3" strokeLinecap="round" />
          {/* Center Brass Pivot Rivet */}
          <circle cx="12" cy="14" r="1.3" fill={accentDarkColor} />
          <circle cx="12" cy="14" r="0.8" fill={accentColor} />
        </svg>
      );
    case 'wrench':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Solid Drop-Forged Steel Combination Wrench */}
          <path d="M22.2 4.8L17.5 9.5a2.5 2.5 0 0 1-3-3L19.2 1.8c-1.7-.6-4.2 0-5.7 1.7-1.3 1.5-1.5 3.5-.5 5.3L5.8 16c-1.6-.5-3.3.5-3.8 2.2-.5 1.8.5 3.6 2.2 4 1.8.5 3.6-.5 4-2.2.2-.8 0-1.5-.4-2L15 10.8c1.8 1 3.8.8 5.2-.5 1.6-1.5 2.3-3.8 2-5.5z" />
          {/* Recessed I-Beam Handle Web (Dark Grey Shadow Channel) */}
          <line x1="7.2" y1="16.8" x2="13.2" y2="10.8" stroke={accentDarkColor} strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
          {/* Polished White Upper Steel Rail Highlight */}
          <line x1="6" y1="15.8" x2="12.8" y2="9" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          {/* Open-End Jaws Polished Inner Bevel */}
          <path d="M21.5 5.5L17.5 9.5a2.5 2.5 0 0 1-3-3l4-4" fill="none" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.9" />
          <path d="M17.5 9.5a2.5 2.5 0 0 1-3-3l1-1a2.5 2.5 0 0 0 3 3z" fill={accentDarkColor} fillOpacity="0.45" />
          {/* Outer Tine Highlight */}
          <path d="M19.2 1.8c-1.5-.6-3.8 0-5.2 1.4" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          {/* Box-End Chamfered Ring Hole */}
          <circle cx="5" cy="19" r="1.7" fill={accentDarkColor} />
          <circle cx="5" cy="19" r="1.7" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.8" />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Clear Glass Bulb Envelope Silhouette */}
          <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" />
          {/* Curved White Specular Glare Arc on Glass Bulb */}
          <path d="M7.2 9C7.2 6.3 9.3 4.2 12 4.2" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
          <circle cx="15.5" cy="6.5" r="0.9" fill={accentColor} opacity="0.8" />
          {/* Glowing Double-Loop Tungsten Filament with Center White Spark */}
          <path d="M9.5 11l1.5-4 1 2 1-2 1.5 4" fill="none" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1.2" fill={accentColor} />
          {/* Screw Thread Base (Alternating White Ridges & Dark Grey Recesses) */}
          <rect x="8.5" y="17.2" width="7" height="1.6" rx="0.5" fill={accentColor} opacity="0.9" />
          <rect x="9" y="18.8" width="6" height="1.4" fill={accentDarkColor} fillOpacity="0.45" />
          <rect x="9.5" y="20.2" width="5" height="1.4" rx="0.4" fill={accentColor} opacity="0.85" />
          <path d="M10.5 21.6h3v1.2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1.2z" fill={accentDarkColor} />
        </svg>
      );
    case 'pressure_gauge':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Heavy Brass Gauge Bezel */}
          <circle cx="12" cy="12" r="9.6" />
          {/* Specular White Circular Rim Glare Arc */}
          <path d="M5.5 8 A 8.5 8.5 0 0 1 18.5 8" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
          {/* Dark Grey Recessed Dial Face Plate */}
          <circle cx="12" cy="12" r="7.8" fill={accentDarkColor} fillOpacity="0.55" />
          {/* White Graduated Arc Scale & Danger Ticks */}
          <path d="M7 15.5 A 6.2 6.2 0 1 1 17 15.5" fill="none" stroke={accentColor} strokeWidth="1.2" strokeDasharray="1.5 1.5" opacity="0.95" />
          <path d="M14.5 6.8 A 6.2 6.2 0 0 1 17 15.5" fill="none" stroke={accentColor} strokeWidth="2.2" opacity="0.65" />
          {/* 3D Indicator Needle with Cast Shadow */}
          <line x1="12" y1="12.5" x2="16.2" y2="8.3" stroke={accentDarkColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="12" y1="12" x2="16" y2="7.8" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
          {/* Center Brass Pivot Cap */}
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          <circle cx="12" cy="12" r="1.3" fill={accentDarkColor} />
          <circle cx="12" cy="12" r="0.7" fill={accentColor} />
        </svg>
      );
    case 'valve_wheel':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Heavy Cast-Iron Outer Rim with Rounded Profile */}
          <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="2.8" />
          {/* Top-Left Specular White Cylindrical Highlight Arc */}
          <path d="M4.5 10 A 8.2 8.2 0 0 1 14 3.8" fill="none" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
          {/* Bottom-Right Deep Grey Shadow Arc */}
          <path d="M19.5 14 A 8.2 8.2 0 0 1 10 20.2" fill="none" stroke={accentDarkColor} strokeWidth="1.8" strokeLinecap="round" fillOpacity="0.45" />
          {/* 4 Dished Sturdy Spokes with White Tops & Dark Undersides */}
          <line x1="12" y1="3.2" x2="12" y2="20.8" stroke="currentColor" strokeWidth="2" />
          <line x1="3.2" y1="12" x2="20.8" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="11.2" y1="3.5" x2="11.2" y2="10" stroke={accentColor} strokeWidth="0.8" opacity="0.8" />
          <line x1="3.5" y1="11.2" x2="10" y2="11.2" stroke={accentColor} strokeWidth="0.8" opacity="0.8" />
          <line x1="12.8" y1="14" x2="12.8" y2="20.5" stroke={accentDarkColor} strokeWidth="1" opacity="0.5" />
          <line x1="14" y1="12.8" x2="20.5" y2="12.8" stroke={accentDarkColor} strokeWidth="1" opacity="0.5" />
          {/* Central Hexagonal Bolt Nut with Faceted White & Grey Flats */}
          <circle cx="12" cy="12" r="3.4" fill="currentColor" />
          <polygon points="12,9.6 14.2,10.8 14.2,13.2 12,14.4 9.8,13.2 9.8,10.8" fill={accentDarkColor} fillOpacity="0.4" />
          <polygon points="12,9.6 14.2,10.8 12,12 9.8,10.8" fill={accentColor} opacity="0.85" />
          <circle cx="12" cy="12" r="1.1" fill={accentDarkColor} />
        </svg>
      );

    // Divine Olympus Shapes
    case 'lightning_bolt':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Full Thunderbolt Silhouette */}
          <polygon points="13.5,1.5 5.5,12 12.5,12 9.5,22.5 18.5,10 11.5,10" />
          {/* Stormy Grey Shadow Facet */}
          <polygon points="13.5,1.5 12,11 9.5,22.5 18.5,10 11.5,10" fill={accentDarkColor} fillOpacity="0.45" />
          {/* Illuminated Prismatic White Facet */}
          <polygon points="13.5,1.5 5.5,12 12.5,12 9.5,22.5 12,11" fill={accentColor} opacity="0.85" />
          {/* Central Blinding White Electrical Core Line */}
          <polyline points="13.5,1.5 12,11 9.5,22.5" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Crackling Branch Sparks */}
          <path d="M14.5 5.5l3.5-1-1.5 3.5" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <path d="M9.5 17.5l-3.5 1 1.5-3.5" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        </svg>
      );
    case 'laurel_crown':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Main 5-Peak Olympian Crown Silhouette */}
          <path d="M2.5 9.5 L5 13 L7.5 6.5 L9.8 11 L12 2.8 L14.2 11 L16.5 6.5 L19 13 L21.5 9.5 L21 17 C16.5 19 7.5 19 3 17 Z" />

          {/* 3D Facet Shading on Peaks */}
          {/* Center Spire: Left Lit Facet & Right Dark Shadow Facet */}
          <polygon points="12,2.8 9.8,11 12,17" fill={accentColor} opacity="0.85" />
          <polygon points="12,2.8 12,17 14.2,11" fill={accentDarkColor} fillOpacity="0.45" />
          <line x1="12" y1="2.8" x2="12" y2="17" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />

          {/* Left Inner Peak Facets */}
          <polygon points="7.5,6.5 5,13 7.5,17" fill={accentColor} opacity="0.8" />
          <polygon points="7.5,6.5 7.5,17 9.8,11" fill={accentDarkColor} fillOpacity="0.4" />
          <line x1="7.5" y1="6.5" x2="7.5" y2="17" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" />

          {/* Right Inner Peak Facets */}
          <polygon points="16.5,6.5 14.2,11 16.5,17" fill={accentColor} opacity="0.8" />
          <polygon points="16.5,6.5 16.5,17 19,13" fill={accentDarkColor} fillOpacity="0.4" />
          <line x1="16.5" y1="6.5" x2="16.5" y2="17" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />

          {/* Outer Wing Shading */}
          <polygon points="2.5,9.5 3,17 5,13" fill={accentDarkColor} fillOpacity="0.35" />
          <polygon points="21.5,9.5 21,17 19,13" fill={accentDarkColor} fillOpacity="0.45" />

          {/* Laurel Leaf Sprig Relief Embossed Across the Crown Base */}
          <path d="M12 15.5 C10 13.5 7.5 11 4.5 10" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <path d="M12 15.5 C14 13.5 16.5 11 19.5 10" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <path d="M12 9 C11.2 11.2 11.2 13.5 12 15 C12.8 13.5 12.8 11.2 12 9Z" fill={accentColor} opacity="0.95" />

          {/* Golden Jewels / Spheres Atop Every Crown Peak */}
          <circle cx="12" cy="2.8" r="1.6" fill={accentColor} />
          <circle cx="12" cy="2.8" r="0.8" fill="#ffffff" />
          <circle cx="7.5" cy="6.5" r="1.2" fill={accentColor} />
          <circle cx="16.5" cy="6.5" r="1.2" fill={accentColor} />
          <circle cx="2.5" cy="9.5" r="1" fill={accentColor} />
          <circle cx="21.5" cy="9.5" r="1" fill={accentColor} />

          {/* Curved Golden Diadem Circlet Base */}
          <path d="M3 16.5 C7.5 18.5 16.5 18.5 21 16.5 L21 19.8 C16.5 21.8 7.5 21.8 3 19.8 Z" fill="currentColor" />
          {/* Diadem Specular White Upper Bevel */}
          <path d="M3 16.5 C7.5 18.5 16.5 18.5 21 16.5" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
          {/* Diadem Lower Shadow Lip */}
          <path d="M3 19.8 C7.5 21.8 16.5 21.8 21 19.8" fill="none" stroke={accentDarkColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />

          {/* Inlaid Celestial Gemstones on the Diadem Band */}
          <circle cx="12" cy="19.2" r="1.3" fill={accentColor} />
          <circle cx="12" cy="19.2" r="0.7" fill="#ffffff" />
          <circle cx="7.5" cy="18.6" r="1" fill={accentColor} />
          <circle cx="16.5" cy="18.6" r="1" fill={accentColor} />
          <circle cx="4.2" cy="17.6" r="0.75" fill={accentColor} opacity="0.85" />
          <circle cx="19.8" cy="17.6" r="0.75" fill={accentColor} opacity="0.85" />
        </svg>
      );
    case 'greek_amphora':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Loop Handles (Left & Right) */}
          <path d="M8.5 5 C5 5 3.5 7.5 3.5 10 C3.5 12.5 5.5 13.5 7 13.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M15.5 5 C19 5 20.5 7.5 20.5 10 C20.5 12.5 18.5 13.5 17 13.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          {/* Handle White Top Bevel Highlights */}
          <path d="M8.5 5 C5.5 5 4.3 7.2 4.3 9.5" fill="none" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
          <path d="M15.5 5 C18.5 5 19.7 7.2 19.7 9.5" fill="none" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
          {/* Handle Underside Shadows */}
          <path d="M4.5 10.5 C4.8 12 6 12.8 7.2 12.8" fill="none" stroke={accentDarkColor} strokeWidth="1" opacity="0.45" />
          <path d="M19.5 10.5 C19.2 12 18 12.8 16.8 12.8" fill="none" stroke={accentDarkColor} strokeWidth="1" opacity="0.45" />

          {/* Stepped Pedestal Base Foot */}
          <rect x="8" y="19.5" width="8" height="2.2" rx="0.5" />
          <line x1="8.5" y1="19.8" x2="15.5" y2="19.8" stroke={accentColor} strokeWidth="0.9" opacity="0.85" />
          <line x1="8.5" y1="21.2" x2="15.5" y2="21.2" stroke={accentDarkColor} strokeWidth="0.9" opacity="0.45" />

          {/* Amphora Body & Neck Base Silhouette */}
          <path d="M8 4 H16 V6.5 C16 7.5 18 9 18 11.5 C18 15 15.5 18 14 19.5 H10 C8.5 18 6 15 6 11.5 C6 9 8 7.5 8 6.5 Z" />

          {/* 3D Volumetric Body Lighting: Left Specular Arc & Right Shaded Contour */}
          <path d="M7.5 9.5 C7.5 13.5 9.2 16.5 11 18" fill="none" stroke={accentColor} strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
          <path d="M16.5 9.5 C16.5 13.5 14.8 16.5 13 18" fill="none" stroke={accentDarkColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

          {/* Flared Rim Lip at Top */}
          <rect x="7.2" y="2.5" width="9.6" height="1.8" rx="0.7" />
          <line x1="7.6" y1="2.8" x2="16.4" y2="2.8" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
          <ellipse cx="12" cy="3.2" rx="3.5" ry="0.6" fill={accentDarkColor} fillOpacity="0.5" />

          {/* Neck Specular Highlight & Shadow */}
          <line x1="9.5" y1="4.2" x2="9.5" y2="6.5" stroke={accentColor} strokeWidth="0.8" opacity="0.85" />
          <line x1="14.5" y1="4.2" x2="14.5" y2="6.5" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.4" />

          {/* Decorative Greek Key Meander Belly Band */}
          <rect x="6.5" y="10.2" width="11" height="3" fill={accentDarkColor} fillOpacity="0.5" />
          <line x1="6.8" y1="10.2" x2="17.2" y2="10.2" stroke={accentColor} strokeWidth="0.8" opacity="0.85" />
          <line x1="6.8" y1="13.2" x2="17.2" y2="13.2" stroke={accentColor} strokeWidth="0.8" opacity="0.85" />
          {/* Crisp Geometric Greek Key Wave */}
          <path d="M7.5 12.4 H9 V11 H10.5 V12.4 H12 V11 H13.5 V12.4 H15 V11 H16.5" fill="none" stroke={accentColor} strokeWidth="0.9" strokeLinecap="square" strokeLinejoin="miter" opacity="0.95" />
        </svg>
      );
    case 'golden_harp':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Classical Stepped Base Plinth */}
          <rect x="4" y="19" width="15" height="2.8" rx="0.8" />
          <rect x="4.5" y="19.2" width="14" height="0.8" fill={accentColor} opacity="0.85" />
          <rect x="5" y="20.6" width="13" height="0.8" fill={accentDarkColor} fillOpacity="0.45" />

          {/* Ornate Forepillar Column (Left) */}
          <path d="M4.5 4.5C4.5 3 6 2 7.5 2c1.2 0 2.2.8 2.2 2 0 .8-.5 1.5-1.2 1.8V19H5V5.8c-.3-.3-.5-.8-.5-1.3z" />
          {/* Pillar Specular Fluting & Shadow */}
          <line x1="6" y1="5.5" x2="6" y2="19" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
          <line x1="7.2" y1="6" x2="7.2" y2="19" stroke={accentDarkColor} strokeWidth="1" opacity="0.45" />
          {/* Top Pillar Capital Scroll Volute */}
          <circle cx="7" cy="3.5" r="1.6" fill={accentColor} opacity="0.9" />
          <circle cx="7" cy="3.5" r="0.7" fill={accentDarkColor} />

          {/* Sweeping Harmonic Arch Neck (Top) */}
          <path d="M7 3.5c2.5-1.5 5.5-.5 8 2 2.2 2.2 4 3.5 5 4.2l-1.2 2.2c-1-.7-2.6-1.9-4.6-3.8-2-2-4.2-2.8-6-1.5L7 3.5z" />
          {/* Arch Neck White Highlight Bevel */}
          <path d="M7 3.5c2.5-1.5 5.5-.5 8 2 2.2 2.2 4 3.5 5 4.2" fill="none" stroke={accentColor} strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />

          {/* Angled Resonant Soundbox Body (Right) */}
          <path d="M18.8 9.7L15 19H10.5l5.5-9.3 2.8z" />
          {/* Soundbox 3D Side Shadow Facet */}
          <polygon points="18.8,9.7 20.2,11.2 16.8,19 15,19" fill={accentDarkColor} fillOpacity="0.45" />
          {/* Soundboard Front Edge White Bevel */}
          <line x1="18.8" y1="9.7" x2="15" y2="19" stroke={accentColor} strokeWidth="1.3" opacity="0.85" />

          {/* Graduated Gleaming Silver/White Strings */}
          <line x1="8.5" y1="4.8" x2="8.5" y2="19" stroke={accentColor} strokeWidth="1" opacity="0.95" />
          <line x1="10.2" y1="5.6" x2="10.2" y2="18" stroke={accentColor} strokeWidth="1" opacity="0.95" />
          <line x1="12" y1="7" x2="12" y2="16.2" stroke={accentColor} strokeWidth="1" opacity="0.95" />
          <line x1="13.8" y1="8.6" x2="13.8" y2="14.4" stroke={accentColor} strokeWidth="1" opacity="0.95" />
          <line x1="15.6" y1="10.2" x2="15.6" y2="12.6" stroke={accentColor} strokeWidth="1" opacity="0.95" />

          {/* Golden Tuning Pins Along the Arch */}
          <circle cx="8.5" cy="4.2" r="0.75" fill={accentColor} />
          <circle cx="10.2" cy="5" r="0.75" fill={accentColor} />
          <circle cx="12" cy="6.3" r="0.75" fill={accentColor} />
          <circle cx="13.8" cy="7.9" r="0.75" fill={accentColor} />
          <circle cx="15.6" cy="9.5" r="0.75" fill={accentColor} />

          {/* Soundboard Eyelet Pegs */}
          <circle cx="8.5" cy="19" r="0.5" fill={accentDarkColor} />
          <circle cx="10.2" cy="18" r="0.5" fill={accentDarkColor} />
          <circle cx="12" cy="16.2" r="0.5" fill={accentDarkColor} />
          <circle cx="13.8" cy="14.4" r="0.5" fill={accentDarkColor} />
          <circle cx="15.6" cy="12.6" r="0.5" fill={accentDarkColor} />
        </svg>
      );
    case 'winged_sandal':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Leather Sandal Sole with 3D Bevel */}
          <path d="M4 18c2-1 6-1 10-1s6 1 7 2c0 1-2 2-7 2s-9-1-10-3z" />
          <path d="M4.5 18.8c2-.8 5.8-.8 9.5-.8s5.8.8 6.5 1.5" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.8" />
          <path d="M5 19.5c2.5.5 6.5.5 10.5.5s4.5-.5 5-.8" fill="none" stroke={accentDarkColor} strokeWidth="1.2" opacity="0.45" />
          {/* Cross-Laced Ankle Straps */}
          <line x1="8" y1="17" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" />
          <line x1="14" y1="17" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="13" r="0.9" fill={accentColor} />
          {/* Layered Hermes Flight Wings: White Tips & Grey Underwing Shadows */}
          <path d="M5 14c-1-4 1-8 6-10-2 2-2 5-1 7l-5 3z" fill={accentColor} opacity="0.9" />
          <path d="M4 13c-.6-3 .6-6 4-8-1 1.5-1 3.5-.5 5L4 13z" fill={accentDarkColor} fillOpacity="0.4" />
          <path d="M3 11c0-3 2-6 5-7-1.5 2-1 4 0 5.5l-5 1.5z" fill="currentColor" opacity="0.85" />
          <path d="M5.5 11c.5-2 1.8-4 4.5-5.5" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'spartan_helmet':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Corinthian Helmet Plume Crest Arc */}
          <path d="M5 4c2-2 5-3 7-3s5 1 7 3c-1.5 1-3.5 1.5-7 1.5S6.5 5 5 4z" fill={accentColor} opacity="0.9" />
          <path d="M4 4.5c2.5-2 5.5-2.5 8-2.5s5.5.5 8 2.5c-.5.5-1 1-2 1-2 0-4-1-6-1s-4 1-6 1c-1 0-1.5-.5-2-1z" fill={accentDarkColor} fillOpacity="0.35" />
          {/* Crest Texture Line */}
          <path d="M6 3.8C8 2.5 10 2 12 2s4 .5 6 1.8" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.85" />
          {/* Bronze Helmet Skull Cap & Face Guard Base */}
          <path d="M6 7c0-1.5 2.7-3 6-3s6 1.5 6 3v5c0 2-1 3.5-2 4.5l-1 4.5h-1l-.5-4.5h-3l-.5 4.5h-1L8 16.5C7 15.5 6 14 6 12V7z" />
          {/* Specular White Highlight Ridge along Skull Dome */}
          <path d="M7.5 7.5c1-1.5 2.5-2.2 4.5-2.2s3.5.7 4.5 2.2" fill="none" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
          {/* Central Nose Guard (Nasal) Ridge */}
          <line x1="12" y1="9" x2="12" y2="16.5" stroke={accentColor} strokeWidth="1.3" strokeLinecap="round" />
          {/* Left Angled Cheek Guard White Bevel */}
          <path d="M6.5 11l1.5 5.5 1 2" fill="none" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
          {/* Right Angled Cheek Guard Dark Shadow */}
          <path d="M17.5 11l-1.5 5.5-1 2" fill="none" stroke={accentDarkColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
          {/* Deep Cavernous Greek Almond Eye Openings (Dark Grey) */}
          <polygon points="7.5,10.2 11,11 11,12.6 8,12.2" fill={accentDarkColor} />
          <polygon points="16.5,10.2 13,11 13,12.6 16,12.2" fill={accentDarkColor} />
          {/* Eye Slit White Upper Brow Highlight */}
          <path d="M7.2 9.8L11 10.6M16.8 9.8L13 10.6" stroke={accentColor} strokeWidth="0.8" strokeLinecap="round" opacity="0.85" />
          {/* Central Vertical Mouth Slit */}
          <line x1="12" y1="17.2" x2="12" y2="19.5" stroke={accentDarkColor} strokeWidth="1.2" />
        </svg>
      );
    case 'temple_pillar':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Carved Marble Capital & Cornice */}
          <rect x="4" y="3" width="16" height="3" rx="0.8" />
          <rect x="4.5" y="3.2" width="15" height="1" fill={accentColor} opacity="0.85" />
          <rect x="6" y="5.4" width="12" height="1.2" fill={accentDarkColor} fillOpacity="0.4" />
          <rect x="6" y="6.6" width="12" height="1.2" />
          {/* Fluted Vertical Column Shaft with Alternating White Ridges & Dark Grooves */}
          <rect x="6" y="8" width="12" height="10" />
          <rect x="6" y="8" width="1.5" height="10" fill={accentDarkColor} fillOpacity="0.35" />
          <line x1="8.5" y1="8" x2="8.5" y2="18" stroke={accentColor} strokeWidth="1.2" opacity="0.9" />
          <line x1="10.2" y1="8" x2="10.2" y2="18" stroke={accentDarkColor} strokeWidth="1" opacity="0.5" />
          <line x1="12" y1="8" x2="12" y2="18" stroke={accentColor} strokeWidth="1.4" opacity="0.95" />
          <line x1="13.8" y1="8" x2="13.8" y2="18" stroke={accentDarkColor} strokeWidth="1" opacity="0.5" />
          <line x1="15.5" y1="8" x2="15.5" y2="18" stroke={accentColor} strokeWidth="1.2" opacity="0.9" />
          <rect x="16.5" y="8" width="1.5" height="10" fill={accentDarkColor} fillOpacity="0.35" />
          {/* Stepped Marble Base Plinth */}
          <rect x="6" y="18" width="12" height="1.2" />
          <rect x="6.5" y="18.2" width="11" height="0.8" fill={accentColor} opacity="0.8" />
          <rect x="4" y="19.4" width="16" height="2.6" rx="0.8" />
          <rect x="4.5" y="19.6" width="15" height="0.9" fill={accentColor} opacity="0.85" />
          <rect x="4.5" y="21.2" width="15" height="0.8" fill={accentDarkColor} fillOpacity="0.45" />
        </svg>
      );
    case 'cyclops_eye':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Heavy Stone Brow & Eye Socket Contour */}
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
          <path d="M4 11.5s3.5-5 8-5 8 5 8 5" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.75" />
          <path d="M4 12.5s3.5 5 8 5 8-5 8-5" fill="none" stroke={accentDarkColor} strokeWidth="1.5" opacity="0.5" />
          {/* Realistic Eyeball Sclera (White) */}
          <ellipse cx="12" cy="12" rx="7.2" ry="5.5" fill={accentColor} opacity="0.9" />
          {/* Iris Ring in Theme Color with Dark Perimeter */}
          <circle cx="12" cy="12" r="4.6" fill="currentColor" />
          <circle cx="12" cy="12" r="4.6" fill="none" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.6" />
          {/* Deep Black Pupil */}
          <circle cx="12" cy="12" r="2.4" fill={accentDarkColor} />
          {/* Brilliant Specular Light Catchlights */}
          <circle cx="13.4" cy="10.8" r="1.1" fill="#ffffff" />
          <circle cx="10.8" cy="13.2" r="0.6" fill="#ffffff" opacity="0.8" />
        </svg>
      );

    // Pirate Cove Shapes
    case 'pirate_cutlass':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Wide Curved Steel Saber Blade Base */}
          <path d="M6 19L18 4s3 2 3 5c0 4-5 8-11 11l-4-1z" />
          {/* Polished White Razor Cutting Edge Bevel */}
          <path d="M8 17L18.5 5.5c1 1.5.5 3.5-2 6l-6.5 4.5z" fill={accentColor} opacity="0.85" />
          {/* Deep Dark Fuller Blade Blood Groove */}
          <path d="M9.5 15.5l7-8.5" stroke={accentDarkColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          {/* Solid Brass Basket Hilt Guard with White Glint & Dark Hollow */}
          <path d="M4 16c1.8-1 4.2 0 4.8 1.8s-.2 4-2 4.6c-2 .6-4.2-.6-4.8-2.4-.4-1.2.2-2.8 2-4z" fill="currentColor" />
          <path d="M4.5 17c1.2-.6 2.8 0 3.2 1.2s0 2.6-1.2 3.2c-1.2.6-2.8 0-3.2-1.2-.4-.8 0-2.2 1.2-3.2z" fill={accentDarkColor} fillOpacity="0.5" />
          <path d="M3.5 16.5c1.2-.8 3.2-.2 3.8 1" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.85" />
          {/* Grip Handle & Spherical Pommel Cap */}
          <rect x="5.5" y="17.8" width="3.5" height="1.6" transform="rotate(-45 7.2 18.6)" fill={accentColor} opacity="0.9" />
          <circle cx="4.2" cy="20.8" r="1.1" fill={accentColor} />
        </svg>
      );
    case 'ship_helm':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Outer Wheel Rim */}
          <circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" strokeWidth="2.4" />
          {/* White Specular Cylindrical Arc on Top Rim */}
          <path d="M6 9.5 A 6.5 6.5 0 0 1 18 9.5" fill="none" stroke={accentColor} strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
          {/* Dark Teak Wood Shadow Arc on Lower Rim */}
          <path d="M6.5 14.5 A 6.5 6.5 0 0 0 17.5 14.5" fill="none" stroke={accentDarkColor} strokeWidth="1.5" strokeLinecap="round" fillOpacity="0.45" />
          {/* Sturdy Radial Spokes with 3D Shading */}
          <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.9" y1="19.1" x2="19.1" y2="4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* White Light Highlights on Turned Peg Handles */}
          <circle cx="12" cy="2.5" r="1.1" fill={accentColor} />
          <circle cx="12" cy="21.5" r="1.1" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="2.5" cy="12" r="1.1" fill={accentColor} />
          <circle cx="21.5" cy="12" r="1.1" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="5.2" cy="5.2" r="1" fill={accentColor} />
          {/* Central Brass Spindle Hub with White Glint */}
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <circle cx="12" cy="12" r="2.2" fill={accentDarkColor} fillOpacity="0.45" />
          <circle cx="12" cy="12" r="1.4" fill={accentColor} />
          <circle cx="12" cy="12" r="0.7" fill={accentDarkColor} />
        </svg>
      );
    case 'pirate_skull':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* 3D Crossed Femur Bones Behind Skull */}
          {/* Bone 1: Top-Left to Bottom-Right */}
          <path d="M4 2.8c-.8.8-.8 2 0 2.8l14.4 14.4c.8.8 2 .8 2.8 0s.8-2 0-2.8L6.8 2.8c-.8-.8-2-.8-2.8 0z" />
          {/* Top-Left Knuckles (Sculpted Double Lobes) */}
          <circle cx="3.8" cy="4.8" r="1.8" />
          <circle cx="5" cy="3.5" r="1.8" />
          <circle cx="3.8" cy="4.8" r="1.2" fill={accentColor} opacity="0.85" />
          <circle cx="5" cy="3.5" r="1.2" fill={accentColor} opacity="0.85" />
          {/* Bottom-Right Knuckles */}
          <circle cx="20.2" cy="19.2" r="1.8" />
          <circle cx="19" cy="20.5" r="1.8" />
          <circle cx="20.2" cy="19.2" r="1.2" fill={accentDarkColor} fillOpacity="0.45" />
          <circle cx="19" cy="20.5" r="1.2" fill={accentDarkColor} fillOpacity="0.45" />

          {/* Bone 2: Top-Right to Bottom-Left */}
          <path d="M20 2.8c.8.8.8 2 0 2.8L5.6 20c-.8.8-2 .8-2.8 0s-.8-2 0-2.8L17.2 2.8c.8-.8 2-.8 2.8 0z" />
          {/* Top-Right Knuckles (Sculpted Double Lobes) */}
          <circle cx="20.2" cy="4.8" r="1.8" />
          <circle cx="19" cy="3.5" r="1.8" />
          <circle cx="20.2" cy="4.8" r="1.2" fill={accentColor} opacity="0.85" />
          <circle cx="19" cy="3.5" r="1.2" fill={accentColor} opacity="0.85" />
          {/* Bottom-Left Knuckles */}
          <circle cx="3.8" cy="19.2" r="1.8" />
          <circle cx="5" cy="20.5" r="1.8" />
          <circle cx="3.8" cy="19.2" r="1.2" fill={accentDarkColor} fillOpacity="0.45" />
          <circle cx="5" cy="20.5" r="1.2" fill={accentDarkColor} fillOpacity="0.45" />

          {/* White Specular Edge Along Upper Bone Shafts */}
          <line x1="5.5" y1="5.5" x2="8.5" y2="8.5" stroke={accentColor} strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
          <line x1="18.5" y1="5.5" x2="15.5" y2="8.5" stroke={accentColor} strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />

          {/* Jolly Roger Skull Cranium Base */}
          <path d="M12 4.2c-4.2 0-7.5 3.2-7.5 7.2 0 2.4 1.1 4.4 2.8 5.6v3.2c0 .4.4.8.8.8h7.8c.4 0 .8-.4.8-.8V17c1.7-1.2 2.8-3.2 2.8-5.6 0-4-3.3-7.2-7.5-7.2z" />
          {/* Rounded White Cranial Dome Highlight Arc */}
          <path d="M6.8 10.5c0-2.8 2.3-5 5.2-5s5.2 2.2 5.2 5" fill="none" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
          {/* Skull Suture / Crack Line Detail */}
          <path d="M12 5.2v2.2l.8.8-.4 1.2" fill="none" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.45" />
          {/* Heavy Sinister Brow Ridge */}
          <path d="M6.5 11.2c1.5-.6 3.5-.4 5 .5 1.5-.9 3.5-1.1 5-.5" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.8" />
          {/* Cavernous Hollow Eye Sockets (Dark Grey) */}
          <ellipse cx="9.2" cy="12.5" rx="1.8" ry="2.2" transform="rotate(-8 9.2 12.5)" fill={accentDarkColor} />
          <ellipse cx="14.8" cy="12.5" rx="1.8" ry="2.2" transform="rotate(8 14.8 12.5)" fill={accentDarkColor} />
          {/* Inverted-Heart Nasal Cavity */}
          <polygon points="12,14.5 10.8,16.5 13.2,16.5" fill={accentDarkColor} />
          {/* White Teeth Row with Dark Separator Slits */}
          <rect x="8.8" y="18.2" width="6.4" height="2.2" rx="0.5" fill={accentColor} />
          <line x1="10.4" y1="18.2" x2="10.4" y2="20.4" stroke={accentDarkColor} strokeWidth="0.9" />
          <line x1="12" y1="18.2" x2="12" y2="20.4" stroke={accentDarkColor} strokeWidth="0.9" />
          <line x1="13.6" y1="18.2" x2="13.6" y2="20.4" stroke={accentDarkColor} strokeWidth="0.9" />
        </svg>
      );
    case 'cannon':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Black Iron Cannon Barrel Base */}
          <path d="M3.8 14.5l12.5-7.5 2.5 1.5-12.5 7.5z" />
          <polygon points="18.5,8.5 22,6.5 20.8,4.5 17.3,6.5" />
          {/* Cylindrical White Specular Streak Across Upper Barrel */}
          <path d="M4.5 13.8l12-7.2" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          <circle cx="3.8" cy="14.5" r="1.3" fill={accentColor} opacity="0.8" />
          {/* Barrel Reinforcement Rings & Belly Shadow */}
          <line x1="11" y1="10" x2="12.5" y2="12.5" stroke={accentDarkColor} strokeWidth="1.2" opacity="0.5" />
          <line x1="14.5" y1="8" x2="16" y2="10.5" stroke={accentColor} strokeWidth="1" opacity="0.8" />
          {/* Wooden Gun Carriage Chassis (Dark Grey Shadow) */}
          <path d="M5 19.5l4.5-3.5 5.5 3.5z" fill={accentDarkColor} fillOpacity="0.5" />
          {/* Spoked Iron Carriage Wheel with White Hub Pin */}
          <circle cx="9" cy="16.2" r="4.6" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="9" cy="16.2" r="3.4" fill={accentDarkColor} fillOpacity="0.4" />
          <line x1="6.5" y1="16.2" x2="11.5" y2="16.2" stroke="currentColor" strokeWidth="1.2" />
          <line x1="9" y1="13.7" x2="9" y2="18.7" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="9" cy="16.2" r="1.3" fill={accentColor} />
        </svg>
      );
    case 'treasure_map':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Weathered Parchment Map Body */}
          <path d="M4 4c2-1 4 0 6 1s4 1 6-1 3 0 4 1v15c-1-1-2-1-4-1s-4 0-6-1-4-1-6 1V4z" />
          {/* Curled Frayed Corners Highlighted in White */}
          <path d="M4 4c2-1 4 0 6 1" fill="none" stroke={accentColor} strokeWidth="1.4" opacity="0.85" />
          <path d="M16 5c2-1 3 0 4 1" fill="none" stroke={accentColor} strokeWidth="1.4" opacity="0.85" />
          {/* Aged Paper Creases & Fold Shadows (Dark Grey) */}
          <path d="M9.8 4.8v15" stroke={accentDarkColor} strokeWidth="1.2" opacity="0.35" />
          <path d="M15.8 4.8v15" stroke={accentDarkColor} strokeWidth="1.2" opacity="0.35" />
          {/* Dashed Navigation Trail */}
          <path d="M6.5 8q3 3 5.5 1t4 4.5" fill="none" stroke={accentDarkColor} strokeWidth="1.4" strokeDasharray="1.5 1.5" />
          {/* Bold White & Red X Marks the Spot */}
          <line x1="14.5" y1="14.5" x2="18" y2="18" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="18" y1="14.5" x2="14.5" y2="18" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16.2" cy="16.2" r="0.8" fill="#ef4444" />
          {/* Skull / 4-Point Compass Rose Insignia */}
          <circle cx="7" cy="15" r="1.2" fill={accentDarkColor} fillOpacity="0.45" />
          <polygon points="7,13.2 7.6,15 7,16.8 6.4,15" fill={accentColor} opacity="0.8" />
        </svg>
      );
    case 'gold_doubloon':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Solid Coin Outer Rim */}
          <circle cx="12" cy="12" r="9.6" />
          {/* Milled Dentil Bead Border (Alternating White Beads & Dark Recesses) */}
          <circle cx="12" cy="12" r="8.2" fill="none" stroke={accentDarkColor} strokeWidth="1.2" strokeDasharray="1 1.6" opacity="0.6" />
          <circle cx="12" cy="12" r="8.2" fill="none" stroke={accentColor} strokeWidth="0.8" strokeDasharray="1 1.6" strokeDashoffset="0.5" opacity="0.85" />
          {/* Sunken Dark Coin Field */}
          <circle cx="12" cy="12" r="6.6" fill={accentDarkColor} fillOpacity="0.45" />
          {/* Raised Relief Pirate Skull Crest (Crisp White/Gold) */}
          <circle cx="12" cy="10.8" r="2.8" fill={accentColor} opacity="0.9" />
          <circle cx="11.2" cy="10.8" r="0.8" fill={accentDarkColor} />
          <circle cx="12.8" cy="10.8" r="0.8" fill={accentDarkColor} />
          <rect x="11.2" y="13.2" width="1.6" height="1.6" rx="0.3" fill={accentColor} />
          <line x1="9" y1="16.5" x2="15" y2="16.5" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
          {/* Specular Coin Mint Luster Glint */}
          <path d="M5.5 7.5 A 7.5 7.5 0 0 1 12 4.5" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
        </svg>
      );

    // Cyber Synthwave Shapes
    case 'cassette_tape':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* 1980s Retro Cassette Shell */}
          <rect x="3" y="5" width="18" height="14" rx="2" />
          {/* Polished White Outer Bevel Highlight */}
          <path d="M4 6h16M4 6v12" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
          {/* White Paper Label Band */}
          <rect x="5" y="7" width="14" height="6.5" rx="1" fill={accentColor} fillOpacity="0.85" />
          <line x1="6.5" y1="8.5" x2="17.5" y2="8.5" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.45" />
          {/* Clear Tape Window (Dark Grey Magnetic Housing) */}
          <rect x="7" y="9.5" width="10" height="3.2" rx="1.2" fill={accentDarkColor} fillOpacity="0.85" />
          {/* Diagonal White Specular Glare Streak Across Clear Glass */}
          <line x1="8.5" y1="12" x2="11.5" y2="10" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.85" />
          {/* Dual 6-Toothed Tape Drive Spools */}
          <circle cx="9" cy="11.1" r="1.1" fill={accentColor} />
          <circle cx="9" cy="11.1" r="0.5" fill={accentDarkColor} />
          <circle cx="15" cy="11.1" r="1.1" fill={accentColor} />
          <circle cx="15" cy="11.1" r="0.5" fill={accentDarkColor} />
          {/* Bottom Trapezoid Head Area */}
          <polygon points="7,19 8,16 16,16 17,19" fill={accentDarkColor} fillOpacity="0.5" />
          <circle cx="9.5" cy="17.5" r="0.6" fill={accentColor} />
          <circle cx="14.5" cy="17.5" r="0.6" fill={accentColor} />
        </svg>
      );
    case 'retro_sunglasses':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Glossy Black Frame Brow Bar with White Glint */}
          <rect x="2" y="7" width="20" height="2.4" rx="1.2" />
          <line x1="3" y1="7.6" x2="21" y2="7.6" stroke={accentColor} strokeWidth="0.8" strokeLinecap="round" opacity="0.85" />
          {/* Dual Teardrop Aviator Lenses Base */}
          <path d="M3 10h7v4a3.5 3.5 0 0 1-7 0v-4zM14 10h7v4a3.5 3.5 0 0 1-7 0v-4z" />
          {/* Deep Dark Grey Gradient Tint on Both Lenses */}
          <path d="M3.5 10.5h6v3.5a3 3 0 0 1-6 0v-3.5zM14.5 10.5h6v3.5a3 3 0 0 1-6 0v-3.5z" fill={accentDarkColor} fillOpacity="0.55" />
          {/* Sharp Diagonal White Mirrored Laser-Glare Reflection Stripes */}
          <line x1="4.5" y1="11.2" x2="8.5" y2="15.2" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
          <line x1="6.5" y1="11.2" x2="9" y2="13.7" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
          <line x1="15.5" y1="11.2" x2="19.5" y2="15.2" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
          <line x1="17.5" y1="11.2" x2="20" y2="13.7" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
          {/* Center Bridge & Hinge Screws */}
          <rect x="10.8" y="9.8" width="2.4" height="1" fill={accentColor} />
        </svg>
      );
    case 'sunset_palm':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Outrun Radiant Sunset Disc */}
          <circle cx="12" cy="10" r="6.5" fill={accentColor} opacity="0.8" />
          {/* Horizontal Dark Grid Blind Slits */}
          <line x1="5.8" y1="9.2" x2="18.2" y2="9.2" stroke={accentDarkColor} strokeWidth="1.2" />
          <line x1="6.8" y1="11.2" x2="17.2" y2="11.2" stroke={accentDarkColor} strokeWidth="1.4" />
          <line x1="8.2" y1="13.2" x2="15.8" y2="13.2" stroke={accentDarkColor} strokeWidth="1.6" />
          {/* Silhouetted Twin Palm Trees */}
          <path d="M12 21c1-4 0-7-2-10h1.5c2 3 3 6 2 10z" fill="currentColor" />
          <path d="M11 11c-3-2-6-1-8 2 2-3 5-4 8-2zm1-1c-1-3-4-5-8-4 4 0 7 2 8 4zm1 0c2-3 5-4 8-3-3 0-6 2-8 3zm1 1c3-2 6-1 7 1-2-2-5-2-7-1z" fill="currentColor" />
          {/* Crisp White Neon Edge Lighting Along Palm Fronds */}
          <path d="M12 10c2-3 5-4 8-3" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          <path d="M12 10c-1-3-4-5-8-4" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          {/* Vector Perspective Horizon Base Grid */}
          <line x1="2" y1="21" x2="22" y2="21" stroke={accentColor} strokeWidth="1.4" opacity="0.9" />
          <line x1="4" y1="19.2" x2="20" y2="19.2" stroke={accentColor} strokeWidth="0.8" opacity="0.6" />
        </svg>
      );
    case 'neon_triangle':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* 3D Chrome Penrose / Impossible Triangle */}
          <polygon points="12,2 22,19.5 2,19.5" />
          {/* Facet 1: Polished White Chrome Highlight Facet */}
          <polygon points="12,2 14.5,6.5 6.5,19.5 2,19.5" fill={accentColor} opacity="0.9" />
          {/* Facet 2: Deep Dark Metallic Grey Shadow Facet */}
          <polygon points="2,19.5 22,19.5 19.5,15.5 8.5,15.5" fill={accentDarkColor} fillOpacity="0.5" />
          {/* Facet 3: Vibrant Color Core Inner Triangle Cutout */}
          <polygon points="12,7.5 17.5,16.5 6.5,16.5" fill={accentDarkColor} fillOpacity="0.65" />
          {/* Laser-Sharp White Chrome Bevel Edges & Corner Glints */}
          <polygon points="12,2 22,19.5 2,19.5" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.85" />
          <polygon points="12,7.5 17.5,16.5 6.5,16.5" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.85" />
          <circle cx="12" cy="2.5" r="1" fill="#ffffff" />
          <circle cx="2" cy="19.5" r="0.8" fill="#ffffff" />
          <circle cx="22" cy="19.5" r="0.8" fill="#ffffff" />
        </svg>
      );
    case 'synth_keytar':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Sculpted Keytar Body Base */}
          <polygon points="3,17 9,5 14,8 8,20" />
          {/* Body White Perimeter Bevel Highlight */}
          <path d="M3 17L9 5l5 3" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          {/* Keyboard Bed with Alternating White Natural Keys & Dark Sharps */}
          <rect x="5.5" y="10.5" width="4.5" height="7.5" transform="rotate(-30 7.7 14.2)" fill={accentColor} opacity="0.95" />
          <line x1="5.2" y1="12.5" x2="8.8" y2="10.5" stroke={accentDarkColor} strokeWidth="1.2" />
          <line x1="6.5" y1="14.5" x2="10.1" y2="12.5" stroke={accentDarkColor} strokeWidth="1.2" />
          <line x1="7.8" y1="16.5" x2="11.4" y2="14.5" stroke={accentDarkColor} strokeWidth="1.2" />
          {/* Modulation Neck Handle & Control Sliders */}
          <path d="M12 7l8-4 2 1-7 5z" fill={accentColor} opacity="0.85" />
          <line x1="13.5" y1="6.8" x2="19.5" y2="3.8" stroke={accentDarkColor} strokeWidth="1" />
          <circle cx="18" cy="5.5" r="1.1" fill={accentDarkColor} />
          <circle cx="18" cy="5.5" r="0.6" fill={accentColor} />
        </svg>
      );
    case 'retro_arcade_car':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* 1980s Wedge Supercar Body Base */}
          <path d="M4 14l2-6h12l2 6v5H4v-5z" />
          {/* Dark Raked Windshield with Diagonal White Specular Reflection Glare */}
          <polygon points="7,9 17,9 16,13 8,13" fill={accentDarkColor} fillOpacity="0.75" />
          <line x1="9" y1="12.2" x2="14" y2="9.5" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
          {/* Twin Pop-Up Headlights with White Lenses */}
          <rect x="5.5" y="13.8" width="3.2" height="1.4" rx="0.4" fill={accentColor} />
          <rect x="15.3" y="13.8" width="3.2" height="1.4" rx="0.4" fill={accentColor} />
          {/* Front Bumper & Dark Horizontal Grille Strakes */}
          <rect x="5" y="15.8" width="14" height="1.6" rx="0.4" fill={accentColor} opacity="0.85" />
          <line x1="6" y1="16.6" x2="18" y2="16.6" stroke={accentDarkColor} strokeWidth="0.8" />
          {/* Spoked Wheels & Ground Effect Air Dam */}
          <rect x="3" y="18" width="3.5" height="3" rx="0.5" fill={accentDarkColor} />
          <circle cx="4.7" cy="19.5" r="0.8" fill={accentColor} />
          <rect x="17.5" y="18" width="3.5" height="3" rx="0.5" fill={accentDarkColor} />
          <circle cx="19.2" cy="19.5" r="0.8" fill={accentColor} />
          <rect x="9" y="18.2" width="6" height="1.2" fill={accentDarkColor} fillOpacity="0.6" />
        </svg>
      );
    case 'boombox':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Top Carry Handle */}
          <path d="M7 6V3.5c0-.6.4-1 1-1h8c.6 0 1 .4 1 1V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7.8 3.5h8.4" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.85" />
          {/* Radio Antenna */}
          <line x1="18" y1="6" x2="22" y2="2" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
          <circle cx="22" cy="2" r="0.8" fill={accentColor} />
          {/* Boombox Main Cabinet Chassis */}
          <rect x="2.5" y="6" width="19" height="15" rx="1.8" />
          {/* Top Chassis Specular White Highlight Bevel */}
          <path d="M3.5 7h17M3.5 7v13" stroke={accentColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
          {/* Top Radio Tuner / Button Bar */}
          <rect x="4.5" y="7.5" width="15" height="2.2" rx="0.5" fill={accentDarkColor} fillOpacity="0.5" />
          <line x1="5.5" y1="8.6" x2="11.5" y2="8.6" stroke={accentColor} strokeWidth="0.8" strokeDasharray="1 1" opacity="0.85" />
          <circle cx="14" cy="8.6" r="0.8" fill={accentColor} />
          <circle cx="16.5" cy="8.6" r="0.8" fill={accentColor} />
          {/* Left Large Speaker Woofer with Concentric Cone Rings */}
          <circle cx="7.2" cy="15" r="3.6" fill={accentDarkColor} fillOpacity="0.75" />
          <circle cx="7.2" cy="15" r="2.8" fill="none" stroke={accentColor} strokeWidth="0.9" opacity="0.9" />
          <circle cx="7.2" cy="15" r="1.8" fill="none" stroke={accentColor} strokeWidth="0.7" opacity="0.7" />
          <circle cx="7.2" cy="15" r="0.9" fill={accentColor} />
          {/* Right Large Speaker Woofer with Concentric Cone Rings */}
          <circle cx="16.8" cy="15" r="3.6" fill={accentDarkColor} fillOpacity="0.75" />
          <circle cx="16.8" cy="15" r="2.8" fill="none" stroke={accentColor} strokeWidth="0.9" opacity="0.9" />
          <circle cx="16.8" cy="15" r="1.8" fill="none" stroke={accentColor} strokeWidth="0.7" opacity="0.7" />
          <circle cx="16.8" cy="15" r="0.9" fill={accentColor} />
          {/* Center Cassette Deck Compartment */}
          <rect x="10.8" y="11.5" width="2.4" height="6.5" rx="0.5" fill={accentDarkColor} fillOpacity="0.6" />
          <rect x="11.2" y="12.5" width="1.6" height="3" rx="0.3" fill={accentColor} opacity="0.85" />
          <circle cx="12" cy="14" r="0.5" fill={accentDarkColor} />
          <circle cx="12" cy="17" r="0.4" fill={accentColor} />
        </svg>
      );
    case 'floppy_disk':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* 3.5" Floppy Disk Plastic Casing with Chamfered Corner */}
          <path d="M4 3h13.5L21 6.5V21H4V3z" />
          {/* White Outer Perimeter Bevel Highlight */}
          <path d="M4.8 3.8h12.4l3 3V20.2H4.8V3.8z" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.75" />
          {/* Top Sliding Metal Shutter (Crisp White/Chrome) */}
          <rect x="7" y="3" width="9.5" height="7" rx="0.6" fill={accentColor} opacity="0.95" />
          {/* Shutter Oval Head-Access Window (Dark Recess) */}
          <rect x="9.5" y="4.5" width="2.6" height="4.5" rx="0.8" fill={accentDarkColor} />
          {/* Shutter Spring Guide & Arrow Notch */}
          <line x1="14.2" y1="4.5" x2="14.2" y2="8.5" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.5" />
          {/* Paper Adhesive Label Body (White) */}
          <rect x="6" y="11.5" width="12" height="8" rx="0.8" fill={accentColor} opacity="0.9" />
          {/* Printed Label Information Rule Lines (Dark Grey) */}
          <line x1="7.5" y1="13.5" x2="16.5" y2="13.5" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.45" />
          <line x1="7.5" y1="15.5" x2="16.5" y2="15.5" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.45" />
          <line x1="7.5" y1="17.5" x2="13.5" y2="17.5" stroke={accentDarkColor} strokeWidth="0.8" opacity="0.45" />
          {/* Write-Protect Notch on Bottom-Left Corner */}
          <rect x="4" y="18" width="1.5" height="1.8" fill={accentDarkColor} />
        </svg>
      );
    case 'retro_gamepad':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Controller Wire Cord exiting top */}
          <path d="M12 6.5V3.5c0-.8-.5-1.5-1.5-1.5" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          {/* Classic 80s Rectangular Gamepad Chassis Base */}
          <rect x="2.5" y="6.5" width="19" height="12" rx="2" />
          {/* White Perimeter Bevel Frame */}
          <rect x="3.2" y="7.2" width="17.6" height="10.6" rx="1.5" fill="none" stroke={accentColor} strokeWidth="0.9" opacity="0.85" />
          {/* Faceplate Inset Area (Dark Grey Field) */}
          <rect x="4" y="8" width="16" height="9" rx="1" fill={accentDarkColor} fillOpacity="0.45" />
          {/* Horizontal Red/Color Accent Stripe */}
          <line x1="4.5" y1="12" x2="19.5" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.8" />
          {/* Left Directional D-Pad (Plus Cross) */}
          <path d="M7 10h1.8v1.1H10v1.8H8.8V14H7v-1.1H5.8v-1.8H7V10z" fill={accentDarkColor} />
          <path d="M7 10h1.8v1.1H10v1.8H8.8V14H7v-1.1H5.8v-1.8H7V10z" fill="none" stroke={accentColor} strokeWidth="0.7" opacity="0.9" />
          <circle cx="7.9" cy="12" r="0.4" fill={accentColor} />
          {/* Center Select & Start Rubber Pill Buttons */}
          <rect x="10.4" y="13.2" width="1.4" height="0.8" rx="0.3" transform="rotate(-25 11.1 13.6)" fill={accentColor} opacity="0.9" />
          <rect x="12.6" y="13.2" width="1.4" height="0.8" rx="0.3" transform="rotate(-25 13.3 13.6)" fill={accentColor} opacity="0.9" />
          {/* Right Angled Twin Round Action Buttons (B and A) */}
          <circle cx="15.5" cy="13.2" r="1.3" fill={accentColor} />
          <circle cx="15.5" cy="13.2" r="0.8" fill="currentColor" />
          <circle cx="18.2" cy="11.8" r="1.3" fill={accentColor} />
          <circle cx="18.2" cy="11.8" r="0.8" fill="currentColor" />
        </svg>
      );

    default:
      return null;
  }
});


