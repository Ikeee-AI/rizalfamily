import type { CSSProperties } from 'react';

const POSITIONS: Record<string, CSSProperties> = {
  'top-left': { top: '-6%', left: '-2%' },
  'top-right': { top: '-6%', right: '-2%' },
  'bottom-left': { bottom: '-8%', left: '-3%' },
  'bottom-right': { bottom: '-8%', right: '-3%' },
  'top-center': { top: '-4%', left: '50%', transform: 'translateX(-50%)' },
};

type Position = keyof typeof POSITIONS;

export default function PlateDecor({
  n,
  position = 'top-left',
}: {
  n: string;
  position?: Position;
}) {
  return (
    <>
      <div className="grain" />
      <div className="watermark" style={POSITIONS[position]}>
        {n}
      </div>
    </>
  );
}