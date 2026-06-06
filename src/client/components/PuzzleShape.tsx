import { ShapeId } from '../../shared/themes';

export const PuzzleShape = ({
  shape,
  className,
}: {
  shape: ShapeId;
  className?: string;
}) => {
  const cn = className || 'w-1/2 h-1/2';

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
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="5" y1="19" x2="19" y2="5" />
          <path d="M12 6l3 3M12 6l-3 3M12 18l3-3M12 18l-3-3M6 12l3 3M6 12l3-3M18 12l-3 3M18 12l-3-3" />
        </svg>
      );
    case 'crystal':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2c0 5.5 4.5 10 10 10-5.5 0-10 4.5-10 10 0-5.5-4.5-10-10-10 5.5 0 10-4.5 10-10z" />
        </svg>
      );
    case 'snowman':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="16" r="5" />
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M8 5h8v1H8zM9 2h6v3H9z" />
        </svg>
      );
    case 'tree':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L6 9h3l-4 5h5v6h4v-6h5l-4-5h3L12 2z" />
        </svg>
      );
    case 'cube':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
          <path d="M12 22V12" />
          <path d="M12 12L3 7" />
          <path d="M12 12l9-7" />
        </svg>
      );

    // Enchanted Forest shapes
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M21 2c-3.87 0-9.87 2.1-13.4 5.6C4.4 10.8 3 15.5 3 20c0 .55.45 1 1 1 4.5 0 9.2-1.4 12.4-4.6 3.5-3.53 5.6-9.53 5.6-13.4 0-.55-.45-1-1-1zm-6.2 9.2c-1.56 1.56-3.8 2.6-6.8 3.2 0-.2.1-.4.1-.6.6-3 1.64-5.24 3.2-6.8 1.56-1.56 3.8-2.6 6.8-3.2-.6 3-1.64 5.24-3.3 6.8z" />
        </svg>
      );
    case 'acorn':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2a2 2 0 0 0-2 2c0 .4.1.8.3 1.1C6.7 5.7 4 8.5 4 12c0 4.5 4.5 9 8 10 3.5-1 8-5.5 8-10 0-3.5-2.7-6.3-6.3-6.9.2-.3.3-.7.3-1.1a2 2 0 0 0-2-2zm0 6c2.8 0 5 1.8 5 4H7c0-2.2 2.2-4 5-4z" />
        </svg>
      );
    case 'mushroom':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7 2 4 6 4 11h16c0-5-3-9-8-9zm-2 10v9a2 2 0 0 0 4 0v-9h-4z" />
        </svg>
      );
    case 'pinecone':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C8 6 6 11 6 15c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-2-9-6-13zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-2-4c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
        </svg>
      );
    case 'flower':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm0 7a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm-3.5-3.5a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0zm14 0a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      );
    case 'stump':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="8" rx="8" ry="4" />
          <ellipse cx="12" cy="8" rx="5" ry="2.5" />
          <ellipse cx="12" cy="8" rx="2" ry="1" />
          <path d="M4 8v10c0 2.2 3.6 4 8 4s8-1.8 8-4V8" />
        </svg>
      );

    // Candy Land shapes
    case 'lollipop':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="6" />
          <path d="M12 14v8" />
          <path d="M12 8a3 3 0 0 0-3-3" />
        </svg>
      );
    case 'wrapped_candy':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M17.5 9h-11C5.1 9 4 10.1 4 11.5s1.1 2.5 2.5 2.5h11c1.4 0 2.5-1.1 2.5-2.5S18.9 9 17.5 9z" />
          <path d="M4 11.5L1.5 9v5zM20 11.5l2.5-2.5v5z" />
        </svg>
      );
    case 'candy_cane':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M16 20V8a4 4 0 0 0-8 0v2" />
        </svg>
      );
    case 'cupcake':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0 .1 1C6 7.4 4.5 9.2 4.5 11.5h15c0-2.3-1.5-4.1-3.6-4.5.1-.3.1-.7.1-1a4 4 0 0 0-4-4z" />
          <path d="M5 13l2 8h10l2-8H5z" />
        </svg>
      );
    case 'gummy_bear':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="8" cy="6" r="2" />
          <circle cx="16" cy="6" r="2" />
          <path d="M12 6.5a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5v4c0 1.1.9 2 2 2s2-.9 2-2v-4c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
        </svg>
      );
    case 'donut':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
        </svg>
      );

    // Space Theme
    case 'rocket':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C9 5 8 9 9 13.5l-3.5 3.5V20l3-1 2 2h2l2-2 3 1v-3L15 13.5C16 9 15 5 12 2zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
        </svg>
      );
    case 'alien':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7 2 3 6 3 11c0 4.5 3.5 8 8 9v2h2v-2c4.5-1 8-4.5 8-9 0-5-4-9-9-9zm-4 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
        </svg>
      );
    case 'planet':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="6" fill="currentColor" fillOpacity="0.2" />
          <path d="M2 12c4-2 16-2 20 0" strokeLinecap="round" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
        </svg>
      );
    case 'ufo':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 4c2.5 0 4.5 1.5 5 3.5h-10c.5-2 2.5-3.5 5-3.5zm9 6c0 2-4 3.5-9 3.5S3 12 3 10c0-1.5 3-2.5 7-2.9v-.6c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v.6c4 .4 7 1.4 7 2.9zm-9 6c-2.8 0-5-1-5.8-2.3.8 1.4 3.1 2.3 5.8 2.3s5-.9 5.8-2.3c-.8 1.3-3.1 2.3-5.8 2.3z" />
        </svg>
      );
    case 'comet':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="6" cy="18" r="4" />
          <path d="M6.5 14L22 2l-6 11.5L6.5 14z" />
          <path d="M10 18l12-10-8.5 7.5L10 18z" />
        </svg>
      );

    // Ocean Theme
    case 'fish':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M2 12c2.5-3 6.5-5 11-5 2.5 0 5 .5 7 1.5L22 6v12l-2-2.5c-2 1-4.5 1.5-7 1.5-4.5 0-8.5-2-11-5zm15-1.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
        </svg>
      );
    case 'anchor':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" />
          <line x1="12" y1="7" x2="12" y2="19" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <path d="M5 12a7 7 0 0 0 14 0" />
          <path d="M2 12l3 3M22 12l-3 3" />
        </svg>
      );
    case 'shell':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C6.5 2 3 6 3 11c0 2 .5 3.5 1.5 4.5l7.5 6.5 7.5-6.5C20.5 14.5 21 13 21 11c0-5-3.5-9-9-9zm-2 15.5c-1-1-2.5-3-2.5-4.5 0-2 1.5-3.5 3.5-3.5v8zm4 0v-8c2 0 3.5 1.5 3.5 3.5 0 1.5-1.5 3.5-2.5 4.5z" />
        </svg>
      );
    case 'wave':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M2 17c4-2 6-4 10-4s6 2 10 4M2 11c4-2 6-4 10-4s6 2 10 4" />
        </svg>
      );
    case 'octopus':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2c-3.8 0-7 2.7-7 6.5 0 2 1.2 3.8 2.5 4.8-.8.5-1.5 1.3-1.5 2.2 0 1.5 2 1.5 2 0 0-.8.6-1.5 1.5-1.5.5 0 1 .2 1.3.5-.8 1-1.3 2.2-1.3 3.5 0 1.5 2 1.5 2 0 0-1.8.8-3.2 2-3.8 1.2.6 2 2 2 3.8 0 1.5 2 1.5 2 0 0-1.3-.5-2.5-1.3-3.5.3-.3.8-.5 1.3-.5.9 0 1.5.7 1.5 1.5 0 1.5 2 1.5 2 0 0-.9-.7-1.7-1.5-2.2 1.3-1 2.5-2.8 2.5-4.8C19 4.7 15.8 2 12 2zm-2.5 7c-.8 0-1.5-.7-1.5-1.5S8.7 6 9.5 6s1.5.7 1.5 1.5S10.3 9 9.5 9zm5 0c-.8 0-1.5-.7-1.5-1.5S13.7 6 14.5 6s1.5.7 1.5 1.5S15.3 9 14.5 9z" />
        </svg>
      );
    case 'submarine':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M19 10h-2V7h-3v3H9C5.1 10 2 12.7 2 16s3.1 6 7 6h10c3.9 0 7-2.7 7-6s-3.1-6-7-6zm-8 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
        </svg>
      );

    // Retro Arcade Theme
    case 'ghost':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7.6 2 4 5.6 4 10v10l3-2 3 2 2-2 2 2 3-2 3 2V10c0-4.4-3.6-8-8-8zm-3 9c-.8 0-1.5-.7-1.5-1.5S8.2 8 9 8s1.5.7 1.5 1.5S9.8 11 9 11zm6 0c-.8 0-1.5-.7-1.5-1.5S14.2 8 15 8s1.5.7 1.5 1.5S15.8 11 15 11z" />
        </svg>
      );
    case 'joystick':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="6" r="4" />
          <rect x="10" y="10" width="4" height="6" rx="1" />
          <path d="M4 18h16v3H4z" />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="2,18 2,7 7,12 12,5 17,12 22,7 22,18" />
          <rect x="2" y="19" width="20" height="2" rx="0.5" />
        </svg>
      );
    case 'gem':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 21,9 12,22 3,9" />
          <polygon points="12,2 17,9 12,22 7,9" opacity="0.3" />
        </svg>
      );
    case 'sword':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M21 3c-1-1-2.5-1-3.5 0L8.5 12 6 10.5 4.5 12l2 2-3 3v2.5H6l3-3 2 2 1.5-1.5L12 15.5l9-9c1-1 1-2.5 0-3.5zM9.5 13.5L5.5 18H5v-.5l4.5-4.5.5.5z" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3z" />
        </svg>
      );

    // Desert Theme
    case 'pyramid':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <polygon points="12,2 22,20 2,20" />
          <polygon points="12,2 22,20 12,20" opacity="0.35" />
        </svg>
      );
    case 'cactus':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M11 2v18H9v-5H6c-.5 0-1-.5-1-1v-4h2v3h2V9H6c-.5 0-1-.5-1-1V4h2v3h2V2h2zm7 8h-3v3h2v4h2v-6c0-.5-.5-1-1-1zm-1-6h-2v3h2v4h2V6c0-.5-.5-1-1-1z" />
        </svg>
      );
    case 'camel':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M22 8.5c0-.8-.7-1.5-1.5-1.5H19l-1 2-2-1c-1-1-2.5-1-3.5 0l-2 1-1-2.5c-.2-.6-.8-1-1.5-1H5c-.8 0-1.5.7-1.5 1.5v3h1l.5 6.5H4.5L5 22h2l.5-5.5h3.5L11.5 22h2l.5-5.5h4.5l.5 2 2-.5-1.5-6c1.5-.5 2.5-2 2.5-3.5z" />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'eye_of_horus':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
          <path d="M12 12v6l-3 3M15 12v3" />
        </svg>
      );
    case 'palm_tree':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M13 10v12h-2V10h2zm-1-8c3.5 0 6.5 2.5 7.5 6H15c-1 0-2-.5-2.5-1.5L12 5l-.5 1.5C11 7.5 10 8 9 8H4.5c1-3.5 4-6 7.5-6z" />
        </svg>
      );

    default:
      return null;
  }
};


