import React from 'react';

interface SandboxBannerProps {
  label: string;
}

const SandboxBanner: React.FC<SandboxBannerProps> = ({ label }) => (
  <p
    className="text-[10px] text-amber-400/90 uppercase tracking-widest text-center border border-amber-500/20 rounded-full py-2 px-4"
    data-testid="sandbox-banner"
  >
    {label}
  </p>
);

export default SandboxBanner;