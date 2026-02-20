import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PinnedBestAnswer } from "@/components/PinnedBestAnswer";
import { Copy, Check, Send } from "lucide-react";
import { AGENT_INFO } from "@/lib/constants";
import type { Message, RunStatus } from "@shared/schema";

interface TimelineProps {
  messages: Message[];
  bestAnswer: string;
  whatChanged: string;
  currentRound: number;
  runStatus: RunStatus;
  onSendMessage: (text: string) => void;
  canSend: boolean;
}

function MessageCard({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const agentId = message.agentId as keyof typeof AGENT_INFO | null;
  const agentInfo = agentId ? AGENT_INFO[agentId] : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!message.content || message.content.trim().length === 0) return null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`} data-testid={`card-message-${message.id}`}>
      <div className={`flex flex-col items-center gap-1 shrink-0 ${isUser ? "items-end" : ""}`}>
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">You</span>
          </div>
        ) : agentInfo ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: agentInfo.color + "18" }}
          >
            <span className="text-[10px] font-bold" style={{ color: agentInfo.color }}>
              {agentInfo.label.slice(0, 2).toUpperCase()}
            </span>
          </div>
        ) : null}
      </div>

      <Card className={`flex-1 min-w-0 ${isUser ? "border-primary/20 bg-primary/[0.03]" : ""}`}>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2">
              {isUser ? (
                <span className="text-xs font-semibold">You</span>
              ) : agentInfo ? (
                <span className="text-xs font-semibold" style={{ color: agentInfo.color }}>
                  {agentInfo.label}
                </span>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">System</span>
              )}
              {message.round !== null && message.round !== undefined && message.round > 0 && (
                <Badge variant="secondary" className="text-[10px]">Round {message.round}</Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <Button size="icon" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap" data-testid={`text-message-content-${message.id}`}>
            {message.content}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function Timeline({ messages, bestAnswer, whatChanged, currentRound, runStatus, onSendMessage, canSend }: TimelineProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (input.trim() && canSend) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const visibleMessages = messages.filter((m) => m.content && m.content.trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0">
        <PinnedBestAnswer
          bestAnswer={bestAnswer}
          whatChanged={whatChanged}
          currentRound={currentRound}
          isRunning={runStatus === "running"}
        />
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {visibleMessages.length === 0 && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">Ask a question to start the multi-agent discussion</p>
            </div>
          )}
          {visibleMessages.map((msg) => (
            <MessageCard key={msg.id} message={msg} />
          ))}
          {runStatus === "running" && (
            <div className="flex items-center gap-2 py-2 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs">Agents are discussing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question for the agents to discuss..."
            className="resize-none text-sm min-h-[40px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            data-testid="input-question"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || !canSend}
            data-testid="button-send-question"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
