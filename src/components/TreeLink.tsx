'use client';

import type { ReactNode } from 'react';

export default function TreeLink({
  siblingId,
  children,
}: {
  siblingId: number;
  children: ReactNode;
}) {
  function handleClick() {
    document.getElementById('tree')?.scrollIntoView({ behavior: 'smooth' });
    window.dispatchEvent(new CustomEvent('open-sibling', { detail: siblingId }));
  }

  return (
    <button type="button" className="tree-link" onClick={handleClick}>
      {children}
    </button>
  );
}