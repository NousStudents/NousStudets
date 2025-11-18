import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SoundProvider } from "@/contexts/SoundContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <SoundProvider>
      <App />
    </SoundProvider>
  </ThemeProvider>
);
