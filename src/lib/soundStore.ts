// Shared "is sound on?" state, so the global Sound toggle can also drive
// section-specific audio (e.g. the house ambience in the 3D tour).

type Listener = () => void;

let soundOn = false;
const listeners = new Set<Listener>();

export const soundStore = {
  get: () => soundOn,
  getServer: () => false,
  set(next: boolean) {
    if (next === soundOn) return;
    soundOn = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
