export const ShopScreen = ({ onReturnToMenu }: { onReturnToMenu: () => void; refreshCurrency?: (() => void) | undefined }) => {
  return (
    <>
      {/* Menu Button - Top Left */}
      <div className="fixed top-4 left-4 sm:left-6 z-50">
        <button
          onClick={onReturnToMenu}
          className="flex items-center justify-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 hover:scale-105 active:scale-95 transition-all text-white font-extrabold text-[11px] tracking-wide cursor-pointer select-none"
        >
          Menu
        </button>
      </div>

      <div className="min-h-screen bg-mesh-gradient text-white p-6 pb-20">
        <div className="max-w-4xl mx-auto relative pt-12">
          {/* Centered Title */}
          <div className="flex justify-center items-center mb-12">
            <h1 className="text-5xl font-black neon-text-title tracking-tight text-center">
              Shop
            </h1>
          </div>

          <div className="text-center text-gray-400 py-12 text-xl">
            Welcome to the Shop! Coming soon.
          </div>
        </div>
      </div>
    </>
  );
};
