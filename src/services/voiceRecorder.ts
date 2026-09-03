interface VoiceRecorderResult {
  audioBlob: Blob;
  duration: number;
  transcription: string;
}

interface AudioMeterCallback {
  (volumeLevel: number): void;
}

type RecorderState = 'idle' | 'starting' | 'recording' | 'stopping';

export class VoiceRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime = 0;
  private stream: MediaStream | null = null;
  private speechRecognizer: any = null;
  private liveTranscription = '';
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meterAnimationId: number | null = null;
  private onMeterUpdate: AudioMeterCallback | null = null;
  
  private state: RecorderState = 'idle';
  private startPromise: Promise<void> | null = null;
  private pendingStop = false;

  public async startRecording(
    onMeter?: AudioMeterCallback,
    onTranscriptUpdate?: (text: string) => void
  ): Promise<void> {
    // Si déjà en train de démarrer ou d'enregistrer, on réutilise le flux
    if (this.state === 'recording') {
      return;
    }
    if (this.state === 'starting' && this.startPromise) {
      return this.startPromise;
    }

    this.state = 'starting';
    this.pendingStop = false;
    this.audioChunks = [];
    this.liveTranscription = '';
    this.onMeterUpdate = onMeter || null;

    this.startPromise = (async () => {
      // 1. Accès au microphone
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err) {
        this.state = 'idle';
        console.error('Microphone access denied:', err);
        throw new Error('Accès au microphone requis pour la note vocale.');
      }

      // Si un arrêt a été demandé pendant l'obtention des permissions micro
      if (this.pendingStop) {
        this.cleanupResources();
        this.state = 'idle';
        return;
      }

      // 2. Initialisation du MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else {
          mimeType = '';
        }
      }

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // 3. Analyseur audio pour le vumètre / visualiseur sonore
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateMeter = () => {
          if (this.state !== 'recording' && this.state !== 'starting') return;
          if (!this.analyser) return;

          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const normalized = Math.min(100, Math.round((average / 128) * 100));

          if (this.onMeterUpdate) {
            this.onMeterUpdate(normalized);
          }
          this.meterAnimationId = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (e) {
        console.warn('Analyser setup error:', e);
      }

      // 4. Reconnaissance vocale en direct (Web Speech API en Français)
      const SpeechRecClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecClass) {
        try {
          this.speechRecognizer = new SpeechRecClass();
          this.speechRecognizer.continuous = true;
          this.speechRecognizer.interimResults = true;
          this.speechRecognizer.lang = 'fr-FR';

          this.speechRecognizer.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + ' ';
            }
            this.liveTranscription = currentTranscript.trim();
            if (onTranscriptUpdate) {
              onTranscriptUpdate(this.liveTranscription);
            }
          };

          this.speechRecognizer.onerror = (e: any) => {
            console.warn('Speech recognition warning:', e);
          };

          this.speechRecognizer.start();
        } catch (err) {
          console.warn('SpeechRecognition failed to start:', err);
        }
      }

      try {
        this.mediaRecorder.start(100);
      } catch (e) {
        console.warn('MediaRecorder start error:', e);
      }

      this.startTime = Date.now();
      this.state = 'recording';
    })();

    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  public async stopRecording(): Promise<VoiceRecorderResult> {
    // Si l'enregistreur est en train de démarrer, on attend qu'il termine avant d'arrêter
    if (this.state === 'starting' && this.startPromise) {
      this.pendingStop = true;
      try {
        await this.startPromise;
      } catch {
        // Ignorer l'erreur d'initialisation pour renvoyer un fallback propre
      }
    }

    // Si on n'est pas en train d'enregistrer, renvoyer un résultat vide sécurisé au lieu de lancer une exception
    if (this.state !== 'recording' && (!this.mediaRecorder || this.mediaRecorder.state === 'inactive')) {
      const fallbackTranscript = this.liveTranscription.trim();
      this.cleanupResources();
      this.state = 'idle';
      return {
        audioBlob: new Blob([], { type: 'audio/webm' }),
        duration: 0,
        transcription: fallbackTranscript,
      };
    }

    this.state = 'stopping';

    if (this.meterAnimationId !== null) {
      cancelAnimationFrame(this.meterAnimationId);
      this.meterAnimationId = null;
    }

    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.stop();
      } catch {
        // ignore
      }
    }

    const duration = this.startTime > 0 ? Math.max(0.5, (Date.now() - this.startTime) / 1000) : 0;

    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const finalBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanupResources();
        this.state = 'idle';
        resolve({
          audioBlob: finalBlob,
          duration: Number(duration.toFixed(1)),
          transcription: this.liveTranscription.trim(),
        });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const finalBlob = new Blob(this.audioChunks, { type: mimeType });

        this.cleanupResources();
        this.state = 'idle';

        resolve({
          audioBlob: finalBlob,
          duration: Number(duration.toFixed(1)),
          transcription: this.liveTranscription.trim(),
        });
      };

      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        } else {
          this.mediaRecorder.onstop?.(new Event('stop'));
        }
      } catch (err) {
        console.warn('Error during MediaRecorder.stop:', err);
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const finalBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanupResources();
        this.state = 'idle';
        resolve({
          audioBlob: finalBlob,
          duration: Number(duration.toFixed(1)),
          transcription: this.liveTranscription.trim(),
        });
      }
    });
  }

  private cleanupResources() {
    if (this.stream) {
      try {
        this.stream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {});
      } catch {
        // ignore
      }
      this.audioContext = null;
    }

    if (this.meterAnimationId !== null) {
      cancelAnimationFrame(this.meterAnimationId);
      this.meterAnimationId = null;
    }
  }

  public getIsRecording(): boolean {
    return this.state === 'recording' || this.state === 'starting';
  }
}

export const voiceRecorder = new VoiceRecorderService();
