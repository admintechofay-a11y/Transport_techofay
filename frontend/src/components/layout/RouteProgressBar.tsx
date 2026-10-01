import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const RouteProgressBar: React.FC = () => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  if (!isNavigating) return null;

  return (
    <div
      key={location.key}
      className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#F97316] to-amber-300 z-[100] shadow-sm pointer-events-none route-progress-bar"
    />
  );
};

export default RouteProgressBar;
