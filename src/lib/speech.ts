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
    return;
  }

  window.speechSynthesis.cancel(); // Stop any previous speech

  const clean = cleanTextForSpeech(text);
  if (!clean.trim()) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  const targetLang = options?.lang || "hi-IN";
  utterance.lang = targetLang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to find natural neural voice for India / Hindi
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice =
    voices.find((v) => v.lang === "hi-IN" || v.name.includes("Hindi") || v.name.includes("India")) ||
    voices.find((v) => v.lang.startsWith("en-IN") || v.lang.startsWith("hi")) ||
    voices[0];

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

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
  lang: "hi-IN" | "en-IN" = "hi-IN",
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
