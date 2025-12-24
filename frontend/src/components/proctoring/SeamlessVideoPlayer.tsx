'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import api from '@/lib/api';

interface SeamlessVideoPlayerProps {
  readonly attemptId: string;
  readonly className?: string;
  readonly onError?: (error: string) => void;
}

interface PlaylistData {
  videos: string[];
  totalChunks: number;
}

export default function SeamlessVideoPlayer({
  attemptId,
  className,
  onError,
}: SeamlessVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chunkDurations, setChunkDurations] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // Load video at index
  const loadVideo = useCallback((index: number) => {
    if (!playlist || !videoRef.current) return;

    if (index < 0 || index >= playlist.videos.length) return;

    const videoUrl = playlist.videos[index];
    videoRef.current.src = videoUrl;
    videoRef.current.load();

    // Preload next video
    if (preloadVideoRef.current && index + 1 < playlist.videos.length) {
      preloadVideoRef.current.src = playlist.videos[index + 1];
      preloadVideoRef.current.load();
    }
  }, [playlist]);

  // Handle video ended - seamlessly transition to next
  const handleVideoEnded = useCallback(() => {
    if (!playlist || !videoRef.current) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.videos.length) {
      // Store current chunk duration if not already stored
      const dur = videoRef.current.duration;
      const safeDuration = isFinite(dur) && !isNaN(dur) ? dur : 10;
      
      // Only add if we haven't stored this chunk's duration yet
      setChunkDurations(prev => {
        if (prev.length <= currentIndex) {
          return [...prev, safeDuration];
        }
        return prev;
      });

      setCurrentIndex(nextIndex);
      
      // Load next video - it will auto-play via canplay handler
      const videoUrl = playlist.videos[nextIndex];
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      
      // Preload the one after
      if (preloadVideoRef.current && nextIndex + 1 < playlist.videos.length) {
        preloadVideoRef.current.src = playlist.videos[nextIndex + 1];
        preloadVideoRef.current.load();
      }
    } else {
      // End of all videos
      setIsPlaying(false);
    }
  }, [playlist, currentIndex]);

  // Calculate total elapsed time
  const calculateTotalTime = useCallback(() => {
    const previousChunksDuration = chunkDurations.slice(0, currentIndex).reduce((a, b) => a + b, 0);
    return previousChunksDuration + currentTime;
  }, [chunkDurations, currentIndex, currentTime]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      // Only set duration if it's a valid finite number
      if (isFinite(videoDuration) && !isNaN(videoDuration)) {
        setDuration(videoDuration);

        // Store duration for current chunk
        if (chunkDurations.length === currentIndex) {
          setChunkDurations(prev => [...prev, videoDuration]);
        }
      } else {
        // Use fallback duration (10 seconds per chunk)
        setDuration(10);
        if (chunkDurations.length === currentIndex) {
          setChunkDurations(prev => [...prev, 10]);
        }
      }
    }
    setIsBuffering(false);
  }, [currentIndex, chunkDurations.length]);

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    }
  }, []);

  // Skip to previous chunk
  const skipPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      loadVideo(currentIndex - 1);
    }
  }, [currentIndex, loadVideo]);

  // Skip to next chunk
  const skipNext = useCallback(() => {
    if (playlist && currentIndex < playlist.videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      loadVideo(currentIndex + 1);
    }
  }, [playlist, currentIndex, loadVideo]);

  // Seek within current video
  const handleSeek = useCallback((value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  // Format time - handle NaN and Infinity
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle buffering
  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsBuffering(false);
    // Auto-play when video is ready and we're in playing state
    if (isPlaying && videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Fetch playlist on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.getProctoringPlaylist(attemptId);
        const data = response.data as PlaylistData;

        if (!isMounted) return;

        if (!data.videos || data.videos.length === 0) {
          setError('No proctoring videos available for this attempt.');
          setIsLoading(false);
          return;
        }

        setPlaylist(data);
        setIsLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Failed to fetch playlist:', err);
        const axiosError = err as { response?: { data?: { message?: string } } };
        const errorMessage = axiosError.response?.data?.message || 'Failed to load proctoring videos.';
        setError(errorMessage);
        onError?.(errorMessage);
        setIsLoading(false);
      }
    };

    loadPlaylist();

    return () => {
      isMounted = false;
    };
  }, [attemptId, onError]);

  // Load first video when playlist is available
  useEffect(() => {
    if (playlist && playlist.videos.length > 0) {
      loadVideo(0);
    }
  }, [playlist, loadVideo]);

  // Calculate total duration estimate
  const getAverageDuration = () => {
    const validDurations = chunkDurations.filter(d => isFinite(d) && d > 0);
    if (validDurations.length > 0) {
      return validDurations.reduce((a, b) => a + b, 0) / validDurations.length;
    }
    return 10; // Default 10 seconds per chunk
  };
  
  // Safe calculated total duration
  const rawTotalDuration = playlist 
    ? getAverageDuration() * playlist.videos.length 
    : 0;
  const calculatedTotalDuration = isFinite(rawTotalDuration) ? rawTotalDuration : 0;

  // Calculate total elapsed time safely
  const totalElapsedTime = () => {
    const prevDurations = chunkDurations.slice(0, currentIndex);
    const prevTotal = prevDurations.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
    const currTime = isFinite(currentTime) ? currentTime : 0;
    return prevTotal + currTime;
  };

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-900 rounded-lg p-8',
        className
      )}>
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-400">Loading proctoring videos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center bg-gray-900 rounded-lg p-8',
        className
      )}>
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <p className="text-gray-400 text-center">{error}</p>
      </div>
    );
  }

  if (!playlist || playlist.videos.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center bg-gray-900 rounded-lg p-8',
        className
      )}>
        <Video className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-gray-400">No proctoring videos available.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
    >
      {/* Main video player */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onEnded={handleVideoEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        muted={isMuted}
        playsInline
        aria-label="Proctoring video playback"
      >
        <track kind="captions" label="No captions available" />
      </video>

      {/* Hidden preload video - not focusable due to hidden class */}
      <video
        ref={preloadVideoRef}
        className="hidden"
        preload="auto"
        muted
        tabIndex={-1}
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 via-transparent to-transparent">
        {/* Progress bar */}
        <div className="px-4 pb-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            {/* Skip previous */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={skipPrevious}
              disabled={currentIndex === 0}
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>

            {/* Skip next */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={skipNext}
              disabled={currentIndex >= playlist.videos.length - 1}
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            {/* Volume */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            {/* Time display */}
            <span className="text-white text-sm ml-2">
              {formatTime(totalElapsedTime())} / {formatTime(calculatedTotalDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Chunk indicator */}
            <span className="text-white text-sm">
              Chunk {currentIndex + 1} / {playlist.videos.length}
            </span>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Click to play overlay */}
      {!isPlaying && !isBuffering && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-transparent border-none"
          onClick={togglePlay}
          aria-label="Play video"
        >
          <div className="bg-black/50 rounded-full p-4">
            <Play className="w-12 h-12 text-white" />
          </div>
        </button>
      )}
    </div>
  );
}
