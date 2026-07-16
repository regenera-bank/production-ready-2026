import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
  withCosmic?: boolean;
  className?: string;
}

const COSMIC_VIDEO_SOURCES = (
  <>
    <source
      src="https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f6/The_Heliosphere_Within_The_Milky_Way_Galaxy_%28SVS20406_-_MilkyWayZoom_30fps_proRes_wStars%29.webm/The_Heliosphere_Within_The_Milky_Way_Galaxy_%28SVS20406_-_MilkyWayZoom_30fps_proRes_wStars%29.webm.480p.vp9.webm"
      type="video/webm"
    />
    <source
      src="https://v1.pinimg.com/videos/mc/720p/95/25/c2/9525c22c7da4acb6f3356aee566bde9c.mp4"
      type="video/mp4"
    />
  </>
);

const AppShell: React.FC<AppShellProps> = ({
  children,
  withCosmic = false,
  className = '',
}) => (
  <div className="app-shell">
    <div className={`viewport-container ${className}`.trim()}>
      {withCosmic && (
        <>
          <video autoPlay loop muted playsInline preload="metadata" className="cosmic-video" aria-hidden="true">
            {COSMIC_VIDEO_SOURCES}
          </video>
          <div className="cosmic-atmosphere" aria-hidden="true" />
          <div className="cosmic-vignette" aria-hidden="true" />
          <div className="absolute inset-0 z-[3] pointer-events-none stars-bg stars-far" aria-hidden="true" />
          <div className="absolute inset-0 z-[3] pointer-events-none stars-bg stars-near" aria-hidden="true" />
        </>
      )}
      {children}
    </div>
  </div>
);

export default AppShell;