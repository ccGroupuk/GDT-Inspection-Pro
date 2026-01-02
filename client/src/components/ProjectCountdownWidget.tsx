import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Helper constant for one day in milliseconds to avoid magic numbers
const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

/**
 * Calculates the days remaining until the next February 1st
 * and the progress percentage through the current annual project cycle.
 */
const calculateCountdown = () => {
  const today = new Date();
  // Normalize today's date to the start of the day to ensure consistent calculations
  today.setHours(0, 0, 0, 0);

  let targetYear = today.getFullYear();
  const feb1stThisYear = new Date(targetYear, 1, 1); // February is month 1 (0-indexed)
  feb1stThisYear.setHours(0, 0, 0, 0);

  // If today is on or past February 1st of the current year,
  // the target date for the countdown should be next year's February 1st.
  if (today.getTime() >= feb1stThisYear.getTime()) {
    targetYear++;
  }
  const targetDate = new Date(targetYear, 1, 1); // This is the upcoming February 1st
  targetDate.setHours(0, 0, 0, 0);

  // The start of the current project cycle is the February 1st of the previous year
  const previousFeb1st = new Date(targetYear - 1, 1, 1);
  previousFeb1st.setHours(0, 0, 0, 0);

  // Calculate the total days remaining until the target launch date
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / ONE_DAY_IN_MS);

  // Calculate the progress for the current annual cycle (from previous Feb 1st to upcoming Feb 1st)
  const totalDurationDays = Math.round((targetDate.getTime() - previousFeb1st.getTime()) / ONE_DAY_IN_MS);
  const daysElapsedInCycle = Math.round((today.getTime() - previousFeb1st.getTime()) / ONE_DAY_IN_MS);

  // Ensure progress stays within 0-100%
  const progressPercentage = Math.max(0, Math.min(100, (daysElapsedInCycle / totalDurationDays) * 100));

  return { daysRemaining, progressPercentage };
};

/**
 * ProjectCountdownWidget Component
 * Displays a card with the days remaining until the next February 1st
 * and a progress bar showing progress through the current annual cycle.
 */
export function ProjectCountdownWidget() {
  const [countdown, setCountdown] = useState(calculateCountdown());
  // useRef to hold the timeout ID, allowing us to clear it reliably
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Schedules the next update for the countdown.
   * This function calculates the time until the next midnight and sets a timeout.
   * When the timeout fires, it updates the countdown and reschedules itself for the *next* midnight.
   * This method ensures accurate daily updates without `setInterval` drift.
   */
  const scheduleNextUpdate = () => {
    const now = new Date();
    // Calculate the exact time for tomorrow's midnight (00:00:00)
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    // Clear any existing timeout to prevent multiple timers running
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to update the countdown at the next midnight
    timeoutRef.current = setTimeout(() => {
      setCountdown(calculateCountdown()); // Update the state
      scheduleNextUpdate(); // Immediately schedule the next update for the following midnight
    }, msUntilMidnight);
  };

  // useEffect to manage the scheduling of daily updates
  useEffect(() => {
    scheduleNextUpdate(); // Schedule the first update when the component mounts

    // Cleanup function: Clear the timeout when the component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <Card className="w-full max-w-sm" data-testid="project-countdown-widget">
      <CardHeader>
        <CardTitle className="text-lg text-center">Project Launch Countdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-6xl md:text-5xl font-extrabold text-primary leading-none" data-testid="days-remaining">
            {countdown.daysRemaining}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Days Left</p>
        </div>
        <div className="space-y-2">
          <Progress value={countdown.progressPercentage} className="h-2 bg-gray-200" data-testid="countdown-progress-bar" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(countdown.progressPercentage)}% through current cycle
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
