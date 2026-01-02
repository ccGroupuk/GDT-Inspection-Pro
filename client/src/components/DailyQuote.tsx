import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface QuoteData {
  text: string;
  author: string;
}

const motivationalQuotes: QuoteData[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle Onassis" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
];

const DailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const dailyQuote = motivationalQuotes[dayOfYear % motivationalQuotes.length];

  return (
    <Card className="h-full" data-testid="daily-quote-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Quote className="h-4 w-4" />
          Daily Inspiration
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-center">
        <blockquote className="italic text-muted-foreground" data-testid="daily-quote-text">
          "{dailyQuote.text}"
        </blockquote>
        <p className="mt-2 text-sm font-medium text-right" data-testid="daily-quote-author">
          — {dailyQuote.author}
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyQuote;
