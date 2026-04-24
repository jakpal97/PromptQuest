'use client';

const ANIM_WIDTHS = { 2: 96, 3: 144, 4: 192, 5: 240, 6: 288, 8: 384, 10: 480 };

const Character = ({ characterId, size = 4, animate = true, flipped = false, className = '', style = {} }) => {
  if (!characterId) return null;

  const px = 16 * size;
  const sheetW = 48 * size;
  const sheetH = 64 * size;
  const animW = ANIM_WIDTHS[size] || 16 * 3 * size;

  return (
    <div
      className={`pixel-art ${className}`}
      style={{
        width: px,
        height: px,
        backgroundImage: `url('/characters/Office_Character_${characterId}.png')`,
        backgroundSize: `${sheetW}px ${sheetH}px`,
        backgroundPosition: '0 0',
        imageRendering: 'pixelated',
        animation: animate ? `walk-sprite-${size}x 0.6s steps(3) infinite` : 'none',
        transform: flipped ? 'scaleX(-1)' : 'none',
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

export default Character;
