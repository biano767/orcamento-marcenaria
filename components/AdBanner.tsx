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
  }, [adSlot]);

  const containerClass = position === 'sidebar' ? 'w-56' : 'w-full';
  const insStyle: React.CSSProperties = { display: 'block' };

  // Use default slot if not provided
  const slotId = adSlot || '1950953442';

  return (
    <div className={`my-4 ${containerClass}`}>
      <ins
        className="adsbygoogle"
        style={insStyle}
        data-ad-client="ca-pub-8819760043153934"
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
        {...(adTest ? { 'data-adtest': 'on' } : {})}
      ></ins>
    </div>
  );
};

export default AdBanner;