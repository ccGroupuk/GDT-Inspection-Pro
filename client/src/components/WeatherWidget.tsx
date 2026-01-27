import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain } from 'lucide-react';

const WeatherWidget = () => {
  return (
    <Card className="h-full" data-testid="weather-widget">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Cardiff Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Sun className="h-10 w-10 text-yellow-500" />
          <div>
            <p className="text-3xl font-bold" data-testid="weather-temp">12°C</p>
            <p className="text-sm text-muted-foreground" data-testid="weather-condition">Partly Cloudy</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Cloud className="h-3 w-3" />
            <span>Wind: 15 mph</span>
          </div>
          <div className="flex items-center gap-1">
            <CloudRain className="h-3 w-3" />
            <span>Humidity: 68%</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Static demo - integrate weather API for live data
        </p>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
