"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";

type Props = {
  onTranscription: (text: string) => void;
};

export function VoiceNoteButton({ onTranscription }: Props) {
  const [listening, setListening] = useState(false);

  function toggleListening() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    if (listening) {
      setListening(false);
      return;
    }

    setListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscription(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }

  return (
    <button
      type="button"
      className={`button ${listening ? "button-primary" : ""}`}
      onClick={toggleListening}
      title="Dictate voice research note"
    >
      {listening ? <MicOff size={14} style={{ color: "var(--danger)" }} /> : <Mic size={14} />}
      <span>{listening ? "Listening..." : "Voice Dictate"}</span>
    </button>
  );
}
