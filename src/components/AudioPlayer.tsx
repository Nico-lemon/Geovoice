import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioBlob?: Blob;
  duration?: number;
  compact?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBlob, duration = 0, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioBlob) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBlob]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => console.warn('Play error:', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!audioBlob && !audioUrl) {
    return (
      <div className="text-xs text-slate-500 italic py-1">
        Aucun enregistrement audio
      </div>
    );
  }

  const effectiveDuration = audioRef.current?.duration || duration || 1;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 w-full shadow-xs">
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        )}
        <button
          onClick={togglePlay}
          id="btn-compact-play"
          type="button"
          className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0 shadow-xs"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <input
          type="range"
          min="0"
          max={effectiveDuration}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-2.5">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Visualiseur de forme d'onde simulée */}
      <div className="flex items-center gap-1 h-8 px-1 justify-between">
        {Array.from({ length: 32 }).map((_, i) => {
          const progress = currentTime / (effectiveDuration || 1);
          const isPassed = i / 32 <= progress;
          const heightPercent = 20 + Math.sin(i * 0.6) * 35 + ((i % 5) * 8);
          return (
            <div
              key={i}
              style={{ height: `${Math.max(15, Math.min(100, heightPercent))}%` }}
              className={`w-1 rounded-full transition-all duration-100 ${
                isPassed ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          id="btn-play-audio"
          type="button"
          className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-transform active:scale-95 shadow-md shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min="0"
            max={effectiveDuration}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={toggleSpeed}
          id="btn-audio-speed"
          type="button"
          className="text-xs font-mono font-bold px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
          title="Vitesse de lecture"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};
