export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s?/g, "")
    .replace(/[-*•]\s+/g, "")
    .replace(/\n+/g, ". ");
}

export function speakText(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    lang?: "hi-IN" | "en-IN";
  },
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Web Speech Synthesis is not supported in this browser.");
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel(); // Stop any previous speech
  window.speechSynthesis.resume(); // Ensure speech synthesis is resumed if paused by browser

  const clean = cleanTextForSpeech(text);
  if (!clean.trim()) {
    options?.onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  const targetLang = options?.lang || "en-IN";
  utterance.lang = targetLang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const applyVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice =
      voices.find((v) => v.lang === targetLang || v.name.includes("India") || v.name.includes("Hindi")) ||
      voices.find((v) => v.lang.startsWith("en") || v.lang.startsWith("hi")) ||
      voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  };

  applyVoice();

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  utterance.onerror = () => options?.onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function createVoiceRecognizer(
  onResult: (transcript: string) => void,
  onError?: (err: string) => void,
  lang: "hi-IN" | "en-IN" = "en-IN",
) {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Speech Recognition API is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = lang;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0]?.[0]?.transcript;
    if (transcript) {
      onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event.error || "Voice recognition error");
  };

  return recognition;
}
