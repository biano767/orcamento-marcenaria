import React, { useEffect } from 'react';

interface AdBannerProps {
  position: 'top' | 'bottom' | 'sidebar';
  adSlot?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position, adSlot }) => {
  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      // ignore errors in dev environment
    }
  }, []);

  const containerClass = position === 'sidebar' ? 'w-40' : 'w-full';
  const insStyle: React.CSSProperties = { display: 'block' };

  return (
    <div className={`my-4 ${containerClass}`}>
      <ins
        className="adsbygoogle"
        style={insStyle}
        data-ad-client="ca-pub-REPLACE_WITH_YOUR_ID"
        data-ad-slot={adSlot || 'REPLACE_WITH_AD_SLOT'}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;