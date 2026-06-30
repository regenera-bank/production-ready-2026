import { useState, useCallback, useEffect } from 'react';

export const useRaphaelaVoice = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (isMuted || !window.speechSynthesis) return;

    // Cancel current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find pt-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    // Professional Assistant tuning
    utterance.pitch = 1.1; // Slightly higher/clearer pitch
    utterance.rate = 1.05; // Slightly faster but professional speed

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (next && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  // Handle voice list loading (some browsers load voices asynchronously)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const handleVoicesChanged = () => {
      // Just triggers state refresh for SpeechSynthesis getVoices list if needed
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  return { speak, stop, isMuted, toggleMute, isSpeaking };
};
