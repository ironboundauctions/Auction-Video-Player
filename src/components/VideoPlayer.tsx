import React, { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  videoPath: string;
  onVideoEnd: () => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoPath, 
  onVideoEnd, 
  isFullscreen, 
  setIsFullscreen 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wasFullscreenRef = useRef<boolean>(false);
  const playCountRef = useRef<number>(0);

  useEffect(() => {
    if (videoRef.current) {
      // Stop current video immediately
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      
      // Reset play count for new video
      playCountRef.current = 0;
      
      // Load and play new video
      videoRef.current.load();
      
      // Play the video and restore fullscreen if it was previously fullscreen
      videoRef.current.play().then(() => {
        if (isFullscreen && videoRef.current) {
          // Small delay to ensure video is ready for fullscreen
          setTimeout(() => {
            if (videoRef.current && isFullscreen) {
              videoRef.current.requestFullscreen().catch(console.error);
            }
          }, 100);
        }
      }).catch(console.error);
    }
  }, [videoPath, isFullscreen]);

  const handleVideoEnd = () => {
    playCountRef.current += 1;
    console.log(`Video ended, play count: ${playCountRef.current}`);
    
    if (playCountRef.current < 2) {
      // Replay the video
      console.log('Replaying video...');
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
      }
      return;
    }
    
    // Check if we're currently in fullscreen before the video ends
    wasFullscreenRef.current = !!document.fullscreenElement;
    console.log('Video completed 2 plays, was in fullscreen:', wasFullscreenRef.current);
    
    // Call the parent's onVideoEnd handler
    onVideoEnd();
  };

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        className="w-full h-auto rounded-lg"
        controls
        muted
        onEnded={handleVideoEnd}
        style={{ maxHeight: '70vh' }}
      >
        <source src={`file://${videoPath}`} />
        Your browser does not support the video tag.
      </video>
      
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-lg">
        <span className="text-white text-sm font-medium">
          {videoPath.split('/').pop()}
        </span>
        {isFullscreen && (
          <span className="ml-2 text-green-400">🔲 Fullscreen</span>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;