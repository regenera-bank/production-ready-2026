
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useEffect } from 'react';

interface UseSpeechReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useSpeech = (): UseSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.lang = 'pt-BR';
        recog.continuous = false;
        recog.interimResults = false;

        recog.onstart = () => setIsListening(true);
        recog.onend = () => setIsListening(false);
        recog.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                setIsListening(false);
                return;
            }
            console.error("Speech Error:", event.error);
            setError(event.error);
            setIsListening(false);
        };
        recog.onresult = (event: any) => {
            const result = event.results[0][0].transcript;
            setTranscript(result);
        };
        
        setRecognition(recog);
      } else {
        setError("Navegador não suporta reconhecimento de voz.");
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setError(null);
      } catch (e) {
        console.error(e);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
};