import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Sparkles, Check } from "lucide-react";
import { useState } from "react";

interface PinnedBestAnswerProps {
  bestAnswer: string;
  whatChanged: string;
  currentRound: number;
  isRunning: boolean;
}

export function PinnedBestAnswer({ bestAnswer, whatChanged, currentRound, isRunning }: PinnedBestAnswerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bestAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!bestAnswer) {
    return (
      <Card className="p-4 border-dashed" data-testid="card-best-answer-empty">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Best answer will appear here after agents discuss your question</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-visible" data-testid="card-best-answer">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Best Answer</span>
            <Badge variant="secondary" className="text-[10px]">Round {currentRound}</Badge>
            {isRunning && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary font-medium">Updating...</span>
              </span>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={handleCopy} data-testid="button-copy-best-answer">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-best-answer">
          {bestAnswer}
        </div>

        {whatChanged && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">What changed: </span>
              {whatChanged}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
