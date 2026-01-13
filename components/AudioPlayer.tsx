import React, { useRef, useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, DownloadIcon } from './Icon';

interface AudioPlayerProps {
  src: string;
  duration?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, duration: initialDuration }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };

    const handleLoadedMetadata = () => {
      if (!initialDuration && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [initialDuration, src]);

  // Reset state when src changes
  useEffect(() => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if(audioRef.current) {
          audioRef.current.currentTime = 0;
      }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="flex items-center space-x-3 bg-gray-800 p-2 rounded-lg border border-gray-700 w-full">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button
        onClick={togglePlay}
        title={isPlaying ? "Pause audio" : "Play audio"}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
      >
        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
         <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
         </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          title="Seek"
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
        />
      </div>

      <a
        href={src}
        download="voxgen-audio.wav"
        className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors"
        title="Download generated audio (WAV)"
      >
        <DownloadIcon className="w-5 h-5" />
      </a>
    </div>
  );
};

export default AudioPlayer;