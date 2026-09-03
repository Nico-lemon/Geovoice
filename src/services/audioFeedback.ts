import { AudioFeedbackSettings } from '../types';

class AudioFeedbackService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  playTone(frequency: number, type: OscillatorType, duration: number, volume = 0.4) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  // Bip de début d'enregistrement (Ton montant moderne)
  playRecordStart(settings?: AudioFeedbackSettings) {
    if (settings && !settings.beepsEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

      gain.gain.setValueAtTime(0.35 * (settings?.beepVolume ?? 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }

    this.vibrate([70], settings);
  }

  // Bip de validation et sauvegarde (Double carillon harmonieux)
  playRecordStop(settings?: AudioFeedbackSettings) {
    if (settings && !settings.beepsEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = 0.35 * (settings?.beepVolume ?? 1);

      // Première note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Deuxième note plus haute
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.5, now + 0.1);
      gain2.gain.setValueAtTime(vol, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.28);
    } catch {
      // ignore
    }

    this.vibrate([60, 40, 90], settings);
  }

  // Bip d'erreur ou avertissement
  playError(settings?: AudioFeedbackSettings) {
    if (settings && !settings.beepsEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }

    this.vibrate([150, 80, 150], settings);
  }

  // Retour haptique / Vibration
  vibrate(pattern: number[], settings?: AudioFeedbackSettings) {
    if (settings && !settings.vibrationEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback if permission denied
      }
    }
  }

  // Annonce vocale de confirmation (parfait pour garder le téléphone en poche avec oreillette)
  speak(text: string, settings?: AudioFeedbackSettings) {
    if (settings && !settings.voicePromptEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Annule tout message précédent pour réactivité immédiate
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings?.voiceLanguage || 'fr-FR';
      utterance.rate = 1.1; // Légèrement plus rapide pour être concis en poche
      utterance.pitch = 1.0;
      utterance.volume = settings?.beepVolume ?? 1.0;

      // Sélectionner une voix française si possible
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}

export const audioFeedback = new AudioFeedbackService();
