import React, { useEffect } from 'react';

interface AdBannerProps {
  position: 'top' | 'bottom' | 'sidebar';
  adSlot?: string;
  adTest?: boolean; // quando true adiciona data-adtest="on" para anúncios de teste em localhost
}

const AdBanner: React.FC<AdBannerProps> = ({ position, adSlot, adTest = false }) => {
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
        data-ad-client="ca-pub-8819760043153934"
        data-ad-slot={adSlot || 'REPLACE_WITH_AD_SLOT'}
        data-ad-format="auto"
        data-full-width-responsive="true"
        {...(adTest ? { 'data-adtest': 'on' } : {})}
      ></ins>
    </div>
  );
};

export default AdBanner;