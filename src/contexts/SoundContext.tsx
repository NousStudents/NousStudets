import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playUserCreated: () => void;
  playLoading: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("app-sound-muted");
    if (stored !== null) {
      setIsMuted(stored === "true");
    }
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem("app-sound-muted", String(newValue));
      return newValue;
    });
  };

  const playSound = (frequency: number, duration: number, type: OscillatorType = "sine") => {
    if (isMuted) return;

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const playClick = () => playSound(800, 0.05);
  const playSuccess = () => {
    if (isMuted) return;
    playSound(600, 0.1);
    setTimeout(() => playSound(800, 0.1), 100);
  };
  const playError = () => playSound(300, 0.2, "square");
  
  const playUserCreated = () => {
    if (isMuted) return;
    playSound(700, 0.1, "sine");
    setTimeout(() => playSound(900, 0.1, "sine"), 120);
    setTimeout(() => playSound(1100, 0.15, "sine"), 240);
  };
  
  const playLoading = () => playSound(500, 0.08, "triangle");

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playClick, playSuccess, playError, playUserCreated, playLoading }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
