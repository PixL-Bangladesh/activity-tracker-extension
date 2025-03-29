import { useEffect, useState } from 'react';
import { formatTime } from '~/utils';

export function Timer({
  startTime,
  ticking,
}: {
  startTime: number;
  ticking: boolean;
}) {
  const [time, setTime] = useState(Date.now() - startTime);
  
  useEffect(() => {
    if (!ticking) return;
    const interval = setInterval(() => {
      setTime(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, ticking]);
  
  return (
    <div className="text-center mt-4">
      <div className="text-3xl font-bold">{formatTime(time)}</div>
    </div>
  );
}
