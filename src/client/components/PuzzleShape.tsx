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
    case 'igloo':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Dome Snow Igloo with Entrance Arch & Block Lines */}
          <path d="M12 3C6.5 3 2 7.5 2 13v7h20v-7c0-5.5-4.5-10-10-10zm-1 10a3 3 0 0 1 6 0v7h-6v-7z" />
          <path d="M4 11h16M5 15h14" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
          <path d="M11 13a3 3 0 0 1 6 0v7h-6v-7z" fill="#000000" fillOpacity="0.4" />
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
          {/* Classic 6-Petal Flower Bloom with Center Core */}
          <circle cx="12" cy="5.5" r="3.5" />
          <circle cx="17.6" cy="8.75" r="3.5" />
          <circle cx="17.6" cy="15.25" r="3.5" />
          <circle cx="12" cy="18.5" r="3.5" />
          <circle cx="6.4" cy="15.25" r="3.5" />
          <circle cx="6.4" cy="8.75" r="3.5" />
          <circle cx="12" cy="12" r="3.8" fill="#ffffff" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case 'stump':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="8" rx="8" ry="4" fill="currentColor" fillOpacity="0.2" />
          <ellipse cx="12" cy="8" rx="5" ry="2.5" />
          <ellipse cx="12" cy="8" rx="2" ry="1" />
          <path d="M4 8v10c0 2.2 3.6 4 8 4s8-1.8 8-4V8" />
        </svg>
      );
    case 'owl':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Crisp Woodland Owl with Ear Tufts & Large Eyes */}
          <path d="M12 3C8 3 5 5.5 5 9.5v8.5c0 2 2.5 4 7 4s7-2 7-4V9.5C19 5.5 16 3 12 3zm0 2c3 0 4.5 1.5 5 3.5-1.5 1-3.5 1.5-5 1.5s-3.5-.5-5-1.5c.5-2 2-3.5 5-3.5z" />
          <polygon points="5,9.5 3,3 8,6" />
          <polygon points="19,9.5 21,3 16,6" />
          <circle cx="8.5" cy="11.5" r="2.2" fill="#ffffff" />
          <circle cx="8.5" cy="11.5" r="1.1" fill="currentColor" />
          <circle cx="15.5" cy="11.5" r="2.2" fill="#ffffff" />
          <circle cx="15.5" cy="11.5" r="1.1" fill="currentColor" />
          <polygon points="12,14.5 10.5,12.5 13.5,12.5" fill="#ffffff" />
        </svg>
      );

    // Candy Land shapes
    case 'lollipop':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="6" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 14v8" strokeWidth="2.5" />
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
          <path d="M12 5.2c1.5 0 2.8.4 3.2 1 0.4-1.4 1.8-2.4 3.3-1.4 1.3 1 1 3-.3 3.7 0.4 1.1.2 2.3-.9 3.2 1.3.3 2.7 1.2 2.7 3 0 1.5-1.4 2-2.8 1 0.5 1.1 0.7 2.3.5 3.5-.2 1.5-1.6 2.3-3 2.3-1.3 0-1.7-.9-1.7-2.3 0-.9-2-.9-2 0 0 1.4-.4 2.3-1.7 2.3-1.4 0-2.8-.8-3-2.3-.2-1.2 0-2.4.5-3.5-1.4 1-2.8.5-2.8-1 0-1.8 1.4-2.7 2.7-3-1.1-.9-1.3-2.1-.9-3.2-1.3-.7-1.6-2.7-.3-3.7 1.5-1 2.9 0 3.3 1.4.4-.6 1.7-1 3.2-1zm-2.2 3a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6zm4.4 0a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6zm-2.2 2c-.9 0-1.5.5-1.5 1.1 0 .6.6 1.1 1.5 1.1.9 0 1.5-.5 1.5-1.1 0-.6-.6-1.1-1.5-1.1z" />
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
          {/* Flaming Meteor Head + 3 Speed Trails */}
          <circle cx="6" cy="18" r="4.5" />
          <path d="M9 14.5L22 2l-6 12L9 14.5z" />
          <path d="M4.5 13.5L19 2l-1.5 8.5L4.5 13.5z" opacity="0.6" />
          <circle cx="18" cy="7" r="1.2" />
          <circle cx="14" cy="4" r="0.8" />
        </svg>
      );

    // Ocean Theme
    case 'fish':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Bold Tropical Fish with Tail Fin, Dorsal Fin & Eye */}
          <path d="M12 5c-4.5 0-8.5 2-10 7 1.5 5 5.5 7 10 7 2.5 0 5-.5 7-1.5L22 20v-16l-3 2.5c-2-1-4.5-1.5-7-1.5z" />
          <path d="M7 6.5C8.5 4.5 11 3.5 13 4v3.5L7 6.5z" opacity="0.7" />
          <circle cx="7.5" cy="11.5" r="1.3" fill="#000000" />
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
          {/* Scalloped Fan Clam Shell with Radial Grooves */}
          <path d="M12 2C6.5 2 2.5 6 2 11c0 3 1.5 5.5 3 7l7 4 7-4c1.5-1.5 3-4 3-7 0-5-4.5-9-10-9zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6H6z" />
          <path d="M9 13v6l3 2 3-2v-6H9z" opacity="0.5" />
        </svg>
      );
    case 'wave':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Cresting Ocean Surge Wave */}
          <path d="M2 18c3-4 6-6 10-6 3.5 0 5 1.5 7 1.5 2 0 3-1 3-2 0-2.5-3-5.5-7.5-5.5C10 6 6 8.5 2 14v4zm10-7c-2 0-4.5 1-6.5 2.5C7.5 12.2 10 11 12 11z" />
          <path d="M2 12c3-4 6-6 10-6 2 0 4 1 6 2.5C16 7.2 14 6 12 6 8 6 4 8.5 2 12z" opacity="0.6" />
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
          {/* Bold 3-Arm Saguaro Cactus */}
          <path d="M10 2a2 2 0 0 1 4 0v18h-4V2z" />
          <path d="M6 8a2 2 0 0 1 4 0v4h2V8a4 4 0 0 0-8 0v4h2V8z" />
          <path d="M18 10a2 2 0 0 0-4 0v4h-2v-4a4 4 0 0 1 8 0v3h-2v-3z" />
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

    // Spooky Halloween shapes
    case 'skull':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2C7.03 2 3 6.03 3 11c0 3.24 1.72 6.07 4.3 7.6L7 21a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l-.3-2.4c2.58-1.53 4.3-4.36 4.3-7.6 0-4.97-4.03-9-9-9zm-3 11c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-.5 1.5zm-3 5h-2v-2h2v2z" />
        </svg>
      );
    case 'bat':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Vampire Bat with Wide Scalloped Wings & Ears */}
          <path d="M12 6c1 1.5 2 2 4 2 2.5 0 5-1.5 6-3-.5 3.5-3 6.5-6.5 7.5 1.5 2.5.5 5.5-2.5 6.5-1-.5-2-1.5-3-1.5s-2 1-3 1.5c-3-1-4-4-2.5-6.5C7.5 11.5 5 8.5 4.5 5c1 1.5 3.5 3 6 3 2 0 3-.5 4-2zm-1-3l.8 2.2L12 3l.2 2.2L13 3z" />
        </svg>
      );
    case 'pumpkin':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2a1 1 0 0 1 1 1v1.1c4 0 7 2.2 7 5.9v2c0 4.4-3.6 8-8 8s-8-3.6-8-8v-2c0-3.7 3-5.9 7-5.9V3a1 1 0 0 1 1-1zm-3 8l1.5 1.5L12 10l1.5 1.5L15 10l-1.5 3h-3L9 10zm3 6c2.5 0 4-1.5 4-1.5H8s1.5 1.5 4 1.5z" />
        </svg>
      );
    case 'witch_hat':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L4 16h16L12 2zm0 18c-5 0-9-.5-9-1h18c0 .5-4 1-9 1z" />
        </svg>
      );
    case 'cauldron':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Bubbling Witch Cauldron */}
          <path d="M19 8h2v2h-2v2c0 4.4-3.6 8-8 8s-8-3.6-8-8V10H3V8h2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2zm-7-5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
        </svg>
      );
    case 'potion':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M16 3H8v2h1v3.5L5.2 16.5C4.5 18 5.6 20 7.3 20h9.4c1.7 0 2.8-2 2.1-3.5L15 8.5V5h1V3zm-3 8.5v3.5h-2v-3.5L10 10h4l-1 1.5z" />
        </svg>
      );

    // Volcanic Magma shapes
    case 'fire':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Vibrant 3-Layer Flame Tongue */}
          <path d="M12 2C9.5 5 7 8 7 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-3-2-6-4-8.5-1 2.5-2.5 4-4 4s-2-2-1-5.5z" />
          <path d="M12 11c-1.5 1.5-2.5 3-2.5 5 0 2.2 1.8 4 4 4s4-1.8 4-4c0-2-1-3.5-2.5-5-.5 1-1.2 1.5-1.5 1.5s-1-.5-1.5-1.5z" fill="#ffffff" fillOpacity="0.4" />
        </svg>
      );
    case 'volcano':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Erupting Volcano Peak with Lava Drips */}
          <path d="M4 20l4-11h8l4 11H4zm5-11l-1-4h8l-1 4H9z" />
          <path d="M9 3c0-1 1.5-2 3-2s3 1 3 2-1.5 2-3 2-3-1-3-2z" opacity="0.6" />
        </svg>
      );
    case 'bomb':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="14" r="7" />
          <path d="M12 7V5h2v2zM15 4l2-2" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'key':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="12" r="3" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="16" y1="12" x2="16" y2="15" />
          <line x1="19" y1="12" x2="19" y2="15" />
        </svg>
      );
    case 'chest':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Treasure Chest with Open Lid & Gold Coin Pile */}
          <path d="M3 10v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V10H3zm8 3h2v3h-2v-3z" />
          <path d="M21 8.5L18 3H6L3 8.5h18z" opacity="0.75" />
        </svg>
      );
    case 'anvil':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M20 6h-6v2l2 2v4l-4 2-4-2v-4l2-2V6H4l2 6-4 4h20l-2-4 2-6z" />
        </svg>
      );
    case 'pickaxe':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Mining Forge Pickaxe */}
          <path d="M14.5 3.5l6 6-1.5 1.5-6-6 1.5-1.5zm-11 15.5l10-10 1.5 1.5-10 10h-1.5v-1.5z" />
          <path d="M18 2c-3.5 0-7 2-9 4.5l3.5 3.5C15 8 17 4.5 22 4l-4-2z" opacity="0.85" />
        </svg>
      );

    // High Vantage Wilderness shapes
    case 'mountain':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 3L3 19h18L12 3zm0 4.2l3.8 6.3h-7.6L12 7.2z" />
          <path d="M16.5 11.5L21 19h-9l4.5-7.5z" opacity="0.6" />
        </svg>
      );
    case 'pine':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L5 9h3l-4 5h4l-3 4h14l-3-4h4l-4-5h3L12 2z" />
          <rect x="10.5" y="19" width="3" height="3" />
        </svg>
      );
    case 'campfire':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2c-2.5 3-4 5.5-4 8 0 3 2.5 5 4 5s4-2 4-5c0-2.5-1.5-5-4-8zm0 5c1 1.5 2 2.8 2 4 0 1.2-1 2-2 2s-2-.8-2-2c0-1.2 1-2.5 2-4z" />
          <rect x="3" y="18" width="18" height="3" rx="1.5" transform="rotate(-15 12 19.5)" opacity="0.8" />
          <rect x="3" y="18" width="18" height="3" rx="1.5" transform="rotate(15 12 19.5)" opacity="0.8" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <polygon points="12,5 15,12 12,11 9,12" />
          <polygon points="12,19 15,12 12,13 9,12" opacity="0.5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      );

    // Paper Craftbook Custom Shapes
    case 'origami_crane':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Folded Paper Origami Crane */}
          <polygon points="12,2 17,9 22,7 15,14 12,22 9,14 2,7 7,9" />
          <polygon points="12,2 15,14 12,22 9,14" opacity="0.35" />
        </svg>
      );
    case 'paper_plane':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Folded Paper Airplane */}
          <path d="M2.5 11.5L21 2l-9.5 18.5-2.5-6.5-6.5-2.5zM11.5 14L21 2" />
        </svg>
      );
    case 'scissors':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Craft Paper Scissors */}
          <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8.5 7.5L20 19M8.5 16.5L20 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case 'stamp':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Rubber Craft Stamp */}
          <path d="M10 2h4v4h-4V2zm2 4c-3 0-5 2-5 5v2h10v-2c0-3-2-5-5-5zm-7 9h14v5H5v-5z" />
        </svg>
      );
    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Art Graphite Pencil */}
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
      );
    case 'tape_roll':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          {/* Washi Craft Tape Roll */}
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 21h8v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // High Vantage Wilderness / 2D Papercraft shapes
    case 'mountain':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 3L3 19h18L12 3zm0 4.2l3.8 6.3h-7.6L12 7.2z" />
          <path d="M16.5 11.5L21 19h-9l4.5-7.5z" opacity="0.6" />
        </svg>
      );
    case 'pine':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2L5 9h3l-4 5h4l-3 4h14l-3-4h4l-4-5h3L12 2z" />
          <rect x="10.5" y="19" width="3" height="3" />
        </svg>
      );
    case 'campfire':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M12 2c-2.5 3-4 5.5-4 8 0 3 2.5 5 4 5s4-2 4-5c0-2.5-1.5-5-4-8zm0 5c1 1.5 2 2.8 2 4 0 1.2-1 2-2 2s-2-.8-2-2c0-1.2 1-2.5 2-4z" />
          <rect x="3" y="18" width="18" height="3" rx="1.5" transform="rotate(-15 12 19.5)" opacity="0.8" />
          <rect x="3" y="18" width="18" height="3" rx="1.5" transform="rotate(15 12 19.5)" opacity="0.8" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <polygon points="12,5 15,12 12,11 9,12" />
          <polygon points="12,19 15,12 12,13 9,12" opacity="0.5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      );

    default:
      return null;
  }
};


