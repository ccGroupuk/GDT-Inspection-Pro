import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

const calculateCountdown = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let targetYear = today.getFullYear();
  const feb1stThisYear = new Date(targetYear, 1, 1);
  feb1stThisYear.setHours(0, 0, 0, 0);

  if (today.getTime() >= feb1stThisYear.getTime()) {
    targetYear++;
  }
  const targetDate = new Date(targetYear, 1, 1);
  targetDate.setHours(0, 0, 0, 0);

  const previousFeb1st = new Date(targetYear - 1, 1, 1);
  previousFeb1st.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / ONE_DAY_IN_MS);
  const totalDurationDays = Math.round((targetDate.getTime() - previousFeb1st.getTime()) / ONE_DAY_IN_MS);
  const daysElapsedInCycle = Math.round((today.getTime() - previousFeb1st.getTime()) / ONE_DAY_IN_MS);
  const progressPercentage = Math.max(0, Math.min(100, (daysElapsedInCycle / totalDurationDays) * 100));

  return { daysRemaining, progressPercentage };
};

const triggerConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

export function ProjectCountdownWidget() {
  const [countdown, setCountdown] = useState(calculateCountdown());
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleNextUpdate = () => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const newCountdown = calculateCountdown();
      setCountdown(newCountdown);
      
      if (newCountdown.daysRemaining === 0 && !hasTriggeredConfetti) {
        triggerConfetti();
        setHasTriggeredConfetti(true);
      }
      
      scheduleNextUpdate();
    }, msUntilMidnight);
  };

  useEffect(() => {
    if (countdown.daysRemaining === 0 && !hasTriggeredConfetti) {
      triggerConfetti();
      setHasTriggeredConfetti(true);
    }
    
    scheduleNextUpdate();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isLaunchDay = countdown.daysRemaining === 0;

  return (
    <Card className="w-full max-w-sm" data-testid="project-countdown-widget">
      <CardHeader>
        <CardTitle className="text-lg text-center">
          {isLaunchDay ? "Launch Day!" : "Project Launch Countdown"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          {isLaunchDay ? (
            <div className="flex flex-col items-center gap-2">
              <PartyPopper className="w-12 h-12 text-primary animate-bounce" />
              <p className="text-2xl font-bold text-primary" data-testid="days-remaining">
                Today is Launch Day!
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={triggerConfetti}
                data-testid="button-celebrate"
              >
                <PartyPopper className="w-4 h-4 mr-1" />
                Celebrate Again
              </Button>
            </div>
          ) : (
            <>
              <p className="text-6xl md:text-5xl font-extrabold text-primary leading-none" data-testid="days-remaining">
                {countdown.daysRemaining}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Days Left</p>
            </>
          )}
        </div>
        <div className="space-y-2">
          <Progress 
            value={isLaunchDay ? 100 : countdown.progressPercentage} 
            className="h-2 bg-gray-200" 
            data-testid="countdown-progress-bar" 
          />
          <p className="text-xs text-muted-foreground text-center">
            {isLaunchDay 
              ? "100% - Goal Achieved!" 
              : `${Math.round(countdown.progressPercentage)}% through current cycle`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
