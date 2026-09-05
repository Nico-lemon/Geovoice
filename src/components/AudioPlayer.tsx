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
      <div className="flex items-center gap-2 bg-[#12181B] border border-[#2E3E47] px-2.5 py-1.5 w-full shadow-[2px_2px_0px_#000000] font-mono">
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
          className="p-1.5 bg-[#FF6B35] hover:bg-[#ff8252] text-black transition-colors shrink-0 shadow-xs active:translate-x-0.5 active:translate-y-0.5"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>
        <input
          type="range"
          min="0"
          max={effectiveDuration}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-[#172025] rounded-none appearance-none cursor-pointer accent-[#FF6B35]"
        />
        <span className="text-[11px] font-mono font-bold text-[#FF6B35] shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#12181B] border-2 border-[#4A6B52] p-3 shadow-[3px_3px_0px_#000000] space-y-2 font-mono">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Visualiseur de forme d'onde radio tactique */}
      <div className="flex items-center gap-1 h-7 px-1 justify-between bg-[#172025] border border-[#2E3E47] p-1">
        {Array.from({ length: 32 }).map((_, i) => {
          const progress = currentTime / (effectiveDuration || 1);
          const isPassed = i / 32 <= progress;
          const heightPercent = 20 + Math.sin(i * 0.6) * 35 + ((i % 5) * 8);
          return (
            <div
              key={i}
              style={{ height: `${Math.max(15, Math.min(100, heightPercent))}%` }}
              className={`w-1 rounded-none transition-all duration-100 ${
                isPassed ? 'bg-[#FF6B35]' : 'bg-[#2E3E47]'
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={togglePlay}
          id="btn-play-audio"
          type="button"
          className="p-2 bg-[#FF6B35] hover:bg-[#ff8252] text-black font-black transition-transform active:scale-95 shadow shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div className="flex-1 space-y-0.5">
          <input
            type="range"
            min="0"
            max={effectiveDuration}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-[#172025] rounded-none appearance-none cursor-pointer accent-[#FF6B35]"
          />
          <div className="flex justify-between text-[11px] font-mono text-[#8E9CA3]">
            <span className="text-[#FF6B35] font-bold">{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={toggleSpeed}
          id="btn-audio-speed"
          type="button"
          className="text-xs font-mono font-bold px-2 py-1 bg-[#172025] hover:bg-[#2E3E47] text-[#FF6B35] border border-[#4A6B52] transition-colors shadow-xs"
          title="Vitesse de lecture"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};
