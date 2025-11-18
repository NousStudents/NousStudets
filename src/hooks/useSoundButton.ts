import { useSound } from "@/contexts/SoundContext";

export function useSoundButton() {
  const { playClick } = useSound();

  const withSound = <T extends (...args: any[]) => any>(handler?: T) => {
    return (...args: Parameters<T>) => {
      playClick();
      if (handler) {
        return handler(...args);
      }
    };
  };

  return { withSound };
}
