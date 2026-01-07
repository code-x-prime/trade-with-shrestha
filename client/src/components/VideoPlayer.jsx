'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoPlayer = ({
  videoUrl,
  bunnyVideoId, // Bunny.net video ID for streaming
  isLoading,
  onProgress,
  onDuration,
  onEnded,
  className,
  initialProgress = 0,
  chapterId,
  courseAPI,
  isCompleted: isAlreadyCompleted = false, // From parent - if chapter was already completed
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytIntervalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastReportedProgress, setLastReportedProgress] = useState(0);
  const [ytProgress, setYtProgress] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);
  const [isMarkedComplete, setIsMarkedComplete] = useState(false); // Local state for this session
  const bunnyIframeRef = useRef(null);

  // Bunny.net library ID from environment
  const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

  // Check if chapter is completed (either already or just now)
  const isChapterCompleted = isAlreadyCompleted || isMarkedComplete;

  // Check if this is a Bunny video
  const isBunnyVideo = !!(bunnyVideoId && BUNNY_LIBRARY_ID);



  // Anti-screen recording measures
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    const preventScreenCapture = () => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('-webkit-user-select', 'none');
        containerRef.current.style.setProperty('-webkit-touch-callout', 'none');
        containerRef.current.style.setProperty('user-select', 'none');
      }
    };

    const handleKeyDown = (e) => {
      if (
        (e.key === 'PrintScreen') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2000);
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    preventScreenCapture();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Set initial progress when video is ready
  useEffect(() => {
    if (videoRef.current && initialProgress > 0) {
      const setInitialTime = () => {
        if (videoRef.current && videoRef.current.duration > 0) {
          videoRef.current.currentTime = initialProgress;
          setCurrentTime(initialProgress);
          console.log('Initial progress set:', initialProgress);
        }
      };

      if (videoRef.current.readyState >= 2) {
        // Video metadata is loaded
        setInitialTime();
      } else {
        videoRef.current.addEventListener('loadedmetadata', setInitialTime, { once: true });
      }

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', setInitialTime);
        }
      };
    }
  }, [initialProgress, videoUrl]);

  // YouTube IFrame API integration
  useEffect(() => {
    if (!videoUrl || !isYouTubeUrl(videoUrl)) return;

    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return;

    // Load YouTube IFrame API
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        createPlayer();
        return;
      }

      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = createPlayer;
    };

    const createPlayer = () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
      }

      const containerId = `yt-player-${chapterId || 'default'}`;

      ytPlayerRef.current = new window.YT.Player(containerId, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready');
            const dur = event.target.getDuration();
            setYtDuration(dur);
            if (onDuration) onDuration(dur);
          },
          onStateChange: (event) => {
            console.log('YouTube state change:', event.data);
            // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
            if (event.data === 1) { // Playing
              setIsPlaying(true);
              // Start progress tracking
              if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
              ytIntervalRef.current = setInterval(() => {
                if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
                  const current = ytPlayerRef.current.getCurrentTime();
                  const total = ytPlayerRef.current.getDuration();
                  setCurrentTime(current);
                  setYtProgress(current);
                  setYtDuration(total);

                  if (onProgress) {
                    onProgress({
                      playedSeconds: current,
                      played: total > 0 ? current / total : 0,
                    });
                  }

                  // Auto-complete at 90%
                  const progressPercent = total > 0 ? (current / total) * 100 : 0;
                  if (progressPercent >= 90 && !isChapterCompleted) {
                    console.log('YouTube video reached 90%, marking complete');
                    setIsMarkedComplete(true);
                    handleAutoComplete();
                  }
                }
              }, 1000);
            } else if (event.data === 2) { // Paused
              setIsPlaying(false);
            } else if (event.data === 0) { // Ended
              setIsPlaying(false);
              console.log('YouTube video ended');
              if (!isChapterCompleted) {
                setIsMarkedComplete(true);
                handleAutoComplete();
              }
            }
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (ytIntervalRef.current) {
        clearInterval(ytIntervalRef.current);
      }
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          console.log('Error destroying YT player:', e);
        }
      }
    };
  }, [videoUrl, chapterId]);

  // Handle auto-complete when 90% watched
  const handleAutoComplete = useCallback(async () => {
    console.log('Auto-completing chapter:', chapterId);
    if (onEnded) {
      try {
        await onEnded();
      } catch (error) {
        console.error('Error in auto-complete:', error);
      }
    }
  }, [onEnded, chapterId]);

  // Bunny.net Player Integration with postMessage API
  useEffect(() => {
    if (!isBunnyVideo || !bunnyIframeRef.current) return;

    let bunnyPlayer = null;
    let messageHandlerActive = true;

    // PostMessage event handler as primary method
    const handleBunnyMessage = (event) => {
      if (!messageHandlerActive) return;

      // Check for Bunny/mediadelivery origin
      if (!event.origin?.includes('mediadelivery.net') && !event.origin?.includes('bunny')) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // Handle different event types from Bunny Stream
      if (data.event === 'ready' || data.type === 'ready') {
        console.log('Bunny player ready via postMessage');
        if (data.data?.duration) {
          setDuration(data.data.duration);
          if (onDuration) onDuration(data.data.duration);
        }
      }

      if (data.event === 'timeupdate' || data.type === 'timeupdate') {
        const current = data.data?.seconds || data.currentTime || 0;
        const total = data.data?.duration || data.duration || duration;

        if (current > 0) {
          setCurrentTime(current);
          if (total > 0 && total !== duration) {
            setDuration(total);
            if (onDuration) onDuration(total);
          }

          if (onProgress) {
            onProgress({
              playedSeconds: current,
              played: total > 0 ? current / total : 0,
              loadedSeconds: current,
              loaded: total > 0 ? current / total : 0,
            });
          }

          // Auto-complete at 90%
          const progressPercent = total > 0 ? (current / total) * 100 : 0;
          if (progressPercent >= 90 && !isChapterCompleted && !isMarkedComplete) {
            console.log('Bunny video reached 90%, marking complete');
            setIsMarkedComplete(true);
            handleAutoComplete();
          }
        }
      }

      if (data.event === 'play' || data.type === 'play') {
        console.log('Bunny video playing');
        setIsPlaying(true);
      }

      if (data.event === 'pause' || data.type === 'pause') {
        console.log('Bunny video paused');
        setIsPlaying(false);
      }

      if (data.event === 'ended' || data.type === 'ended' || data.event === 'complete') {
        console.log('Bunny video ended via postMessage');
        setIsPlaying(false);
        if (!isChapterCompleted && !isMarkedComplete) {
          setIsMarkedComplete(true);
          handleAutoComplete();
        }
      }
    };

    // Add postMessage listener
    window.addEventListener('message', handleBunnyMessage);

    // Also try player.js as backup (using embed.ly CDN which is more reliable)
    const loadPlayerJS = async () => {
      try {
        // Check if already loaded
        if (window.playerjs) {
          initPlayerJS();
          return;
        }

        // Remove any failed script
        const existingScript = document.getElementById('bunny-player-js');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'bunny-player-js';
        // Use embed.ly CDN which is the official host for player.js
        script.src = 'https://cdn.embed.ly/player-0.1.0.min.js';
        script.async = true;

        script.onload = () => {
          console.log('player.js loaded from embed.ly');
          initPlayerJS();
        };

        script.onerror = () => {
          console.warn('player.js failed to load, using postMessage only');
        };

        document.head.appendChild(script);
      } catch (err) {
        console.warn('Error loading player.js:', err);
      }
    };

    const initPlayerJS = () => {
      if (!bunnyIframeRef.current || !window.playerjs) return;

      try {
        bunnyPlayer = new window.playerjs.Player(bunnyIframeRef.current);

        bunnyPlayer.on('ready', () => {
          console.log('Bunny player ready via player.js');
          bunnyPlayer.getDuration((dur) => {
            setDuration(dur);
            if (onDuration) onDuration(dur);
          });
        });

        bunnyPlayer.on('timeupdate', (data) => {
          const current = data.seconds;
          const total = data.duration;
          setCurrentTime(current);

          if (total > 0 && total !== duration) {
            setDuration(total);
            if (onDuration) onDuration(total);
          }

          if (onProgress) {
            onProgress({
              playedSeconds: current,
              played: total > 0 ? current / total : 0,
              loadedSeconds: current,
              loaded: total > 0 ? current / total : 0,
            });
          }

          const progressPercent = total > 0 ? (current / total) * 100 : 0;
          if (progressPercent >= 90 && !isChapterCompleted && !isMarkedComplete) {
            console.log('Bunny video 90% via player.js');
            setIsMarkedComplete(true);
            handleAutoComplete();
          }
        });

        bunnyPlayer.on('ended', () => {
          console.log('Bunny video ended via player.js');
          setIsPlaying(false);
          if (!isChapterCompleted && !isMarkedComplete) {
            setIsMarkedComplete(true);
            handleAutoComplete();
          }
        });
      } catch (err) {
        console.warn('Error initializing player.js:', err);
      }
    };

    // Initialize after iframe loads
    const initTimeout = setTimeout(loadPlayerJS, 1000);

    return () => {
      messageHandlerActive = false;
      clearTimeout(initTimeout);
      window.removeEventListener('message', handleBunnyMessage);
      if (bunnyPlayer) {
        try {
          bunnyPlayer.off('ready');
          bunnyPlayer.off('timeupdate');
          bunnyPlayer.off('ended');
        } catch (e) { }
      }
    };
  }, [isBunnyVideo, bunnyVideoId, onProgress, onDuration, handleAutoComplete, isChapterCompleted, isMarkedComplete, duration]);

  // Reset local completed state when chapter changes
  useEffect(() => {
    setIsMarkedComplete(false);
    setYtProgress(0);
    setYtDuration(0);
  }, [chapterId, videoUrl]);

  // Update progress on server
  const updateProgressOnServer = async (currentTime, totalDuration) => {
    if (!totalDuration || totalDuration === 0 || !chapterId || !courseAPI) return;

    try {
      const progressPercentage = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));
      const isCompleted = progressPercentage >= 80;

      await courseAPI.updateChapterProgress(chapterId, progressPercentage, isCompleted);
      setLastReportedProgress(progressPercentage);
      console.log('Progress updated:', { currentTime, totalDuration, progressPercentage, isCompleted });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;

    // Update duration if not set or changed
    if (total && total > 0 && (!duration || Math.abs(duration - total) > 1)) {
      setDuration(total);
      if (onDuration) {
        onDuration(total);
      }
    }

    setCurrentTime(current);

    if (onProgress) {
      onProgress({
        playedSeconds: current,
        played: total > 0 ? current / total : 0,
        loadedSeconds: videoRef.current.buffered.length > 0 ? videoRef.current.buffered.end(0) : 0,
        loaded: total > 0 && videoRef.current.buffered.length > 0 ? videoRef.current.buffered.end(0) / total : 0,
      });
    }

    // Update progress on server every 5 seconds or when progress changes significantly
    if (total > 0) {
      const progressPercentage = (current / total) * 100;
      const shouldUpdate = Math.abs(progressPercentage - lastReportedProgress) > 5 ||
        Math.floor(current) % 5 === 0;

      if (shouldUpdate) {
        updateProgressOnServer(current, total);
      }
    }
  };

  // Handle duration change
  const handleDurationChange = () => {
    if (!videoRef.current) return;

    const total = videoRef.current.duration;
    setDuration(total);

    if (onDuration) {
      onDuration(total);
    }
  };

  // Handle video end
  const handleEnded = async () => {
    console.log('Video ended event triggered');
    setIsPlaying(false);

    if (!videoRef.current) {
      console.warn('Video ref not available');
    }

    const finalTime = videoRef.current?.currentTime || currentTime;
    const finalDuration = videoRef.current?.duration || duration;

    console.log('Video ended:', {
      finalTime,
      finalDuration,
      currentTime,
      duration,
      chapterId
    });

    // Calculate progress percentage for logging
    const progressPercentage = finalDuration > 0 ? Math.min(100, (finalTime / finalDuration) * 100) : 100;
    console.log('Progress percentage:', progressPercentage);

    // Call onEnded callback - parent will handle API call and auto-next
    if (onEnded) {
      console.log('Calling onEnded callback');
      // Small delay to ensure video state is updated
      setTimeout(async () => {
        try {
          await onEnded();
        } catch (error) {
          console.error('Error in onEnded callback:', error);
        }
      }, 300);
    } else {
      console.warn('No onEnded callback provided');
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;

    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (!videoRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Check if URL is YouTube (including Shorts)
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;

    // Handle YouTube Shorts
    if (url.includes('/shorts/')) {
      const shortsMatch = url.match(/\/shorts\/([^?#&\/]+)/);
      if (shortsMatch && shortsMatch[1]) {
        return shortsMatch[1];
      }
    }

    // Handle regular YouTube videos
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }

    return null;
  };

  // Check if URL is Vimeo
  const isVimeoUrl = (url) => {
    if (!url) return false;
    return url.includes('vimeo.com');
  };

  // Convert YouTube URL to embed format (supports regular videos and Shorts)
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';

    // Handle YouTube Shorts
    if (url.includes('/shorts/')) {
      const shortsMatch = url.match(/\/shorts\/([^?#&\/]+)/);
      if (shortsMatch && shortsMatch[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}?enablejsapi=1&rel=0&modestbranding=1`;
      }
    }

    // Handle regular YouTube videos
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?enablejsapi=1&rel=0&modestbranding=1`;
    }

    return url;
  };

  // Convert Vimeo URL to embed format
  const getVimeoEmbedUrl = (url) => {
    if (!url) return '';

    // Extract Vimeo video ID
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const match = url.match(vimeoRegex);

    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0`;
    }

    return url;
  };

  // Check if URL is a direct video file (including R2, S3, Bunny CDN, etc.)
  const isDirectVideoFile = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();

    // Video file extensions
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8', '.m4v', '.flv'];
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true;

    // Blob and data URLs
    if (url.startsWith('blob:') || url.startsWith('data:video/')) return true;

    // CDN and storage providers that serve direct video files
    const directVideoProviders = [
      'r2.dev',           // Cloudflare R2
      'r2.cloudflarestorage.com',
      's3.amazonaws.com', // AWS S3
      's3-',              // AWS S3 regional
      'bunnycdn.com',     // Bunny CDN
      'b-cdn.net',        // Bunny CDN alt
      'cloudflarestream.com',
      'videodelivery.net', // Cloudflare Stream
      'storage.googleapis.com', // Google Cloud Storage
      'blob.core.windows.net', // Azure Blob
    ];

    return directVideoProviders.some(provider => lowerUrl.includes(provider));
  };

  // Log video URL for debugging
  useEffect(() => {
    if (videoUrl) {
      console.log('VideoPlayer - Video URL:', videoUrl);
      console.log('VideoPlayer - Chapter ID:', chapterId);
      console.log('VideoPlayer - Is YouTube:', isYouTubeUrl(videoUrl));
    } else {
      console.warn('VideoPlayer - No video URL provided');
    }
  }, [videoUrl, chapterId]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-video select-none bg-black rounded-lg overflow-hidden',
        className
      )}
      style={{
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : (
        <>
          {/* Bunny.net Video - highest priority if bunnyVideoId is provided */}
          {isBunnyVideo ? (
            <div className="relative w-full h-full">
              <iframe
                ref={bunnyIframeRef}
                src={`https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${bunnyVideoId}?autoplay=false&preload=true&responsive=true`}
                className="w-full h-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Video player"
                loading="lazy"
              />

              {/* Progress indicator for Bunny videos */}
              {duration > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
                  <span>{isChapterCompleted ? 100 : Math.round((currentTime / duration) * 100)}%</span>
                  {isChapterCompleted && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                </div>
              )}

              {/* Manual completion button for Bunny videos */}
              {chapterId && !isChapterCompleted && (
                <div className="absolute bottom-16 right-4 z-10">
                  <Button
                    size="sm"
                    onClick={async () => {
                      console.log('Mark Complete clicked for chapter:', chapterId);
                      try {
                        setIsMarkedComplete(true);
                        if (onEnded) {
                          await onEnded();
                        }
                      } catch (error) {
                        console.error('Failed to mark chapter complete:', error);
                        toast.error('Failed to mark chapter as complete');
                      }
                    }}
                    className="text-white shadow-lg text-xs px-3 py-1.5"
                    style={{ backgroundColor: '#803ADB' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B2FB8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#803ADB'}
                  >
                    ✓ Mark Complete
                  </Button>
                </div>
              )}

              {/* Completed badge for Bunny videos */}
              {isChapterCompleted && (
                <div className="absolute bottom-16 right-4 z-10">
                  <div className="bg-green-600/90 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg text-xs">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Completed</span>
                  </div>
                </div>
              )}
            </div>
          ) : videoUrl ? (
            <>
              {isYouTubeUrl(videoUrl) ? (
                // YouTube videos using IFrame API for progress tracking
                <div className="relative w-full h-full">
                  <div
                    id={`yt-player-${chapterId || 'default'}`}
                    className="w-full h-full"
                  />

                  {/* Progress indicator for YouTube */}
                  {ytDuration > 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
                      <span>{isChapterCompleted ? 100 : Math.round((ytProgress / ytDuration) * 100)}%</span>
                      {isChapterCompleted && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                    </div>
                  )}

                  {/* Manual completion button for YouTube - shown if not already completed */}
                  {chapterId && !isChapterCompleted && (
                    <div className="absolute bottom-16 right-4 z-10">
                      <Button
                        size="sm"
                        onClick={async () => {
                          console.log('Mark Complete clicked for chapter:', chapterId);
                          try {
                            setIsMarkedComplete(true);
                            if (onEnded) {
                              await onEnded();
                            }
                          } catch (error) {
                            console.error('Failed to mark chapter complete:', error);
                            toast.error('Failed to mark chapter as complete');
                          }
                        }}
                        className="text-white shadow-lg text-xs px-3 py-1.5"
                        style={{ backgroundColor: '#803ADB' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B2FB8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#803ADB'}
                      >
                        ✓ Mark Complete
                      </Button>
                    </div>
                  )}

                  {/* Show completed badge - smaller */}
                  {isChapterCompleted && (
                    <div className="absolute bottom-16 right-4 z-10">
                      <div className="bg-green-600/90 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg text-xs">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Completed</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : isVimeoUrl(videoUrl) ? (
                // Vimeo videos use iframe
                <div className="relative w-full h-full">
                  <iframe
                    src={getVimeoEmbedUrl(videoUrl)}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Video player"
                    onLoad={() => {
                      console.log('Vimeo iframe loaded');
                    }}
                  />
                  {/* Manual completion button for Vimeo - hidden if already completed */}
                  {chapterId && !isChapterCompleted && (
                    <div className="absolute bottom-16 right-4 z-10">
                      <Button
                        size="sm"
                        onClick={async () => {
                          console.log('Mark Complete clicked for chapter:', chapterId);
                          try {
                            setIsMarkedComplete(true);
                            if (onEnded) {
                              await onEnded();
                            }
                          } catch (error) {
                            console.error('Failed to mark chapter complete:', error);
                            toast.error('Failed to mark chapter as complete');
                          }
                        }}
                        className="text-white shadow-lg text-xs px-3 py-1.5"
                        style={{ backgroundColor: '#803ADB' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B2FB8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#803ADB'}
                      >
                        ✓ Mark Complete
                      </Button>
                    </div>
                  )}
                  {/* Completed badge for Vimeo - smaller */}
                  {isChapterCompleted && (
                    <div className="absolute bottom-16 right-4 z-10">
                      <div className="bg-green-600/90 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg text-xs">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Completed</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : isDirectVideoFile(videoUrl) ? (
                // Direct video files use HTML5 video tag
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    console.log('Video metadata loaded');
                    handleDurationChange();
                    // Set initial progress if available
                    if (initialProgress > 0 && videoRef.current) {
                      videoRef.current.currentTime = initialProgress;
                      setCurrentTime(initialProgress);
                      console.log('Initial progress set:', initialProgress);
                    }
                  }}
                  onDurationChange={() => {
                    console.log('Duration changed');
                    handleDurationChange();
                  }}
                  onLoadedData={() => {
                    console.log('Video data loaded');
                    if (videoRef.current && videoRef.current.duration) {
                      const total = videoRef.current.duration;
                      setDuration(total);
                      if (onDuration) {
                        onDuration(total);
                      }
                      console.log('Duration from loadedData:', total);
                    }
                  }}
                  onCanPlay={() => {
                    console.log('Video can play');
                    if (videoRef.current && videoRef.current.duration) {
                      const total = videoRef.current.duration;
                      if (!duration || Math.abs(duration - total) > 0.1) {
                        setDuration(total);
                        if (onDuration) {
                          onDuration(total);
                        }
                        console.log('Duration from canPlay:', total);
                      }
                    }
                  }}
                  onEnded={handleEnded}
                  onPlay={() => {
                    console.log('Video playing');
                    setIsPlaying(true);
                  }}
                  onPause={() => {
                    console.log('Video paused');
                    setIsPlaying(false);
                  }}
                  onError={(e) => {
                    console.error('Video error:', e);
                    console.error('Video URL:', videoUrl);
                    toast.error('Failed to load video. Please check the video URL.');
                  }}
                  playsInline
                  preload="metadata"
                />
              ) : (
                // Unknown format - try as direct video
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleDurationChange}
                  onDurationChange={handleDurationChange}
                  onEnded={handleEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Video error:', e);
                    toast.error('Failed to load video. Please check the video URL or format.');
                  }}
                  playsInline
                  preload="metadata"
                />
              )}

              {/* Completed indicator for direct video files */}
              {isDirectVideoFile(videoUrl) && isChapterCompleted && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-green-600/90 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg text-xs">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Completed</span>
                  </div>
                </div>
              )}

              {/* Custom Controls - Only show for direct video files */}
              {isDirectVideoFile(videoUrl) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  {/* Progress Bar */}
                  <div
                    className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer group"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full rounded-full transition-all relative"
                      style={{ width: `${progressPercentage}%`, backgroundColor: '#803ADB' }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: '#803ADB' }} />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlayPause}
                      className="text-white hover:text-white hover:bg-white/20 h-10 w-10 p-0"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Time Display */}
                    <div className="text-white text-sm font-mono min-w-[100px]">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: '#803ADB' }}
                      />
                    </div>

                    {/* Fullscreen Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      {isFullscreen ? (
                        <Minimize className="h-4 w-4" />
                      ) : (
                        <Maximize className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Warning Overlay */}
              {showWarning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white text-center p-4 z-50">
                  <div>
                    <p className="text-lg font-semibold mb-2">⚠️ Warning</p>
                    <p>Screen recording and screenshots are not allowed.</p>
                    <p className="text-sm mt-2">Please return to the video tab to continue watching.</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
              <div className="text-center">
                <p className="text-lg mb-2">Video URL not available</p>
                <p className="text-sm text-gray-400">Please check if the video URL is set for this chapter</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
