import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TopBar } from "@/components/TopBar";
import { LeftSidebar } from "@/components/LeftSidebar";
import { Timeline } from "@/components/Timeline";
import { AgentMonitor } from "@/components/AgentMonitor";
import { AgentThreadDrawer } from "@/components/AgentThreadDrawer";
import { PromptDrawer } from "@/components/PromptDrawer";
import { useAetherStore } from "@/hooks/use-aether-store";
import { connectSSE } from "@/lib/sse";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Menu, Monitor } from "lucide-react";
import type { Room, User, Message, Trigger, RunConfig, Run } from "@shared/schema";

export default function ControlRoom() {
  const store = useAetherStore();
  const isMobile = useIsMobile();
  const [question, setQuestion] = useState("");
  const [mobileTab, setMobileTab] = useState("timeline");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const disconnectRef = useRef<(() => void) | null>(null);

  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: triggers = [] } = useQuery<Trigger[]>({ queryKey: ["/api/triggers"] });

  const activeRoom = rooms.find((r) => r.id === store.activeRoomId);
  const activeUser = users.find((u) => u.id === store.activeUserId);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/rooms", store.activeRoomId, "messages"],
    enabled: !!store.activeRoomId,
  });

  const { data: latestRun } = useQuery<Run | null>({
    queryKey: ["/api/runs", store.activeRoomId, "latest"],
    enabled: !!store.activeRoomId,
  });

  useEffect(() => {
    if (latestRun && latestRun.bestAnswer) {
      store.setBestAnswer(latestRun.bestAnswer);
      store.setCurrentRound(latestRun.currentRound);
      store.setMaxRounds(latestRun.maxRounds);
      if (latestRun.status === "done" || latestRun.status === "error") {
        store.setRunStatus(latestRun.status as any);
      }
    }
  }, [latestRun?.id]);

  useEffect(() => {
    if (rooms.length > 0 && !store.activeRoomId) {
      store.setActiveRoomId(rooms[0].id);
    }
  }, [rooms]);

  useEffect(() => {
    if (users.length > 0 && !store.activeUserId) {
      store.setActiveUserId(users[0].id);
    }
  }, [users]);

  const startRun = useCallback(async (msg: string) => {
    if (!store.activeRoomId || !store.activeUserId || !msg.trim()) return;

    try {
      const res = await apiRequest("POST", "/api/run/start", {
        roomId: store.activeRoomId,
        userId: store.activeUserId,
        message: msg,
        config: store.runConfig,
      });
      const data = await res.json();
      const runId = data.runId;

      store.setActiveRunId(runId);
      store.setRunStatus("running");
      store.setCurrentRound(0);
      store.setMaxRounds(store.runConfig.rounds);
      store.resetAgentStates();
      store.setBestAnswer("");
      store.setWhatChanged("");

      disconnectRef.current?.();
      disconnectRef.current = connectSSE(runId, {
        onRunStarted: () => store.setRunStatus("running"),
        onAgentStarted: (agentId, round) => {
          store.updateAgentStatus(agentId, "running");
          store.setCurrentRound(round);
        },
        onAgentChunk: (agentId, _round, chunk) => {
          store.appendAgentChunk(agentId, chunk);
        },
        onAgentDone: (agentId, _round, content) => {
          store.finalizeAgent(agentId, content);
          queryClient.invalidateQueries({ queryKey: ["/api/rooms", store.activeRoomId, "messages"] });
        },
        onRoundSummary: (round, bestAnswer, whatChanged) => {
          store.setCurrentRound(round);
          store.setBestAnswer(bestAnswer);
          store.setWhatChanged(whatChanged);
          store.clearAgentStreams();
        },
        onBestAnswerUpdated: (bestAnswer) => store.setBestAnswer(bestAnswer),
        onRunDone: () => {
          store.setRunStatus("done");
          queryClient.invalidateQueries({ queryKey: ["/api/rooms", store.activeRoomId, "messages"] });
        },
        onRunError: (err) => {
          store.setRunStatus("error");
          console.error("Run error:", err);
        },
      });
    } catch (err) {
      console.error("Failed to start run:", err);
      store.setRunStatus("error");
    }
  }, [store]);

  const handleSendMessage = (text: string) => {
    setQuestion(text);
    startRun(text);
  };

  const handleRun = () => {
    if (question.trim()) {
      startRun(question);
    } else {
      store.setPromptDrawerOpen(true);
    }
  };

  const handlePause = async () => {
    if (store.activeRunId) {
      await apiRequest("POST", "/api/run/stop", { runId: store.activeRunId });
      store.setRunStatus("paused");
    }
  };

  const handleStop = async () => {
    if (store.activeRunId) {
      await apiRequest("POST", "/api/run/stop", { runId: store.activeRunId });
      store.setRunStatus("done");
      disconnectRef.current?.();
    }
  };

  const handleContinue = async () => {
    if (store.activeRunId) {
      const res = await apiRequest("POST", "/api/run/continue", { runId: store.activeRunId });
      const data = await res.json();
      store.setRunStatus("running");
      store.clearAgentStreams();

      disconnectRef.current?.();
      disconnectRef.current = connectSSE(data.runId || store.activeRunId, {
        onRunStarted: () => store.setRunStatus("running"),
        onAgentStarted: (agentId, round) => {
          store.updateAgentStatus(agentId, "running");
          store.setCurrentRound(round);
        },
        onAgentChunk: (agentId, _round, chunk) => store.appendAgentChunk(agentId, chunk),
        onAgentDone: (agentId, _round, content) => {
          store.finalizeAgent(agentId, content);
          queryClient.invalidateQueries({ queryKey: ["/api/rooms", store.activeRoomId, "messages"] });
        },
        onRoundSummary: (round, bestAnswer, whatChanged) => {
          store.setCurrentRound(round);
          store.setBestAnswer(bestAnswer);
          store.setWhatChanged(whatChanged);
          store.clearAgentStreams();
        },
        onBestAnswerUpdated: (bestAnswer) => store.setBestAnswer(bestAnswer),
        onRunDone: () => {
          store.setRunStatus("done");
          queryClient.invalidateQueries({ queryKey: ["/api/rooms", store.activeRoomId, "messages"] });
        },
        onRunError: () => store.setRunStatus("error"),
      });
    }
  };

  const handleTriggerSelect = (triggerId: string) => {
    const trigger = triggers.find((t) => t.id === triggerId);
    if (trigger?.configJson) {
      store.setRunConfig(trigger.configJson as RunConfig);
    }
  };

  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/rooms", { name });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      store.setActiveRoomId(data.id);
    },
  });

  const canSend = store.runStatus === "idle" || store.runStatus === "done" || store.runStatus === "error";

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <TopBar
          roomName={activeRoom?.name || ""}
          userName={activeUser?.name || ""}
          runStatus={store.runStatus}
          currentRound={store.currentRound}
          maxRounds={store.maxRounds}
          triggers={triggers}
          onRun={handleRun}
          onPause={handlePause}
          onStop={handleStop}
          onContinue={handleContinue}
          onTriggerSelect={handleTriggerSelect}
        />

        <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
            <TabsTrigger value="sidebar" className="text-xs data-[state=active]:bg-muted">
              <Menu className="w-3.5 h-3.5 mr-1" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs data-[state=active]:bg-muted">Timeline</TabsTrigger>
            <TabsTrigger value="agents" className="text-xs data-[state=active]:bg-muted">
              <Monitor className="w-3.5 h-3.5 mr-1" />
              Agents
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sidebar" className="flex-1 min-h-0 mt-0">
            <LeftSidebar
              rooms={rooms} users={users}
              activeRoomId={store.activeRoomId} activeUserId={store.activeUserId}
              runConfig={store.runConfig}
              onSelectRoom={store.setActiveRoomId} onCreateRoom={(n) => createRoomMutation.mutate(n)}
              onSelectUser={store.setActiveUserId} onConfigChange={store.setRunConfig}
              onOpenPromptDrawer={() => store.setPromptDrawerOpen(true)}
            />
          </TabsContent>
          <TabsContent value="timeline" className="flex-1 min-h-0 mt-0">
            <Timeline
              messages={messages} bestAnswer={store.bestAnswer} whatChanged={store.whatChanged}
              currentRound={store.currentRound} runStatus={store.runStatus}
              onSendMessage={handleSendMessage} canSend={canSend}
            />
          </TabsContent>
          <TabsContent value="agents" className="flex-1 min-h-0 mt-0">
            <AgentMonitor
              agentStates={store.agentStates}
              onExpandAgent={store.setThreadDrawerAgent}
            />
          </TabsContent>
        </Tabs>

        <AgentThreadDrawer
          agentId={store.threadDrawerAgent}
          agentState={store.threadDrawerAgent ? store.agentStates[store.threadDrawerAgent] : null}
          messages={messages}
          open={!!store.threadDrawerAgent}
          onClose={() => store.setThreadDrawerAgent(null)}
        />
        <PromptDrawer
          open={store.promptDrawerOpen}
          onClose={() => store.setPromptDrawerOpen(false)}
          question={question}
          onQuestionChange={setQuestion}
          runConfig={store.runConfig}
          onRunNow={() => startRun(question)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        roomName={activeRoom?.name || ""}
        userName={activeUser?.name || ""}
        runStatus={store.runStatus}
        currentRound={store.currentRound}
        maxRounds={store.maxRounds}
        triggers={triggers}
        onRun={handleRun}
        onPause={handlePause}
        onStop={handleStop}
        onContinue={handleContinue}
        onTriggerSelect={handleTriggerSelect}
      />

      <div className="flex flex-1 min-h-0">
        <div className="w-[260px] border-r shrink-0 overflow-hidden">
          <LeftSidebar
            rooms={rooms} users={users}
            activeRoomId={store.activeRoomId} activeUserId={store.activeUserId}
            runConfig={store.runConfig}
            onSelectRoom={store.setActiveRoomId} onCreateRoom={(n) => createRoomMutation.mutate(n)}
            onSelectUser={store.setActiveUserId} onConfigChange={store.setRunConfig}
            onOpenPromptDrawer={() => store.setPromptDrawerOpen(true)}
          />
        </div>

        <div className="flex-1 min-w-0 border-r">
          <Timeline
            messages={messages} bestAnswer={store.bestAnswer} whatChanged={store.whatChanged}
            currentRound={store.currentRound} runStatus={store.runStatus}
            onSendMessage={handleSendMessage} canSend={canSend}
          />
        </div>

        <div className="w-[320px] shrink-0 overflow-hidden">
          <AgentMonitor
            agentStates={store.agentStates}
            onExpandAgent={store.setThreadDrawerAgent}
          />
        </div>
      </div>

      <AgentThreadDrawer
        agentId={store.threadDrawerAgent}
        agentState={store.threadDrawerAgent ? store.agentStates[store.threadDrawerAgent] : null}
        messages={messages}
        open={!!store.threadDrawerAgent}
        onClose={() => store.setThreadDrawerAgent(null)}
      />
      <PromptDrawer
        open={store.promptDrawerOpen}
        onClose={() => store.setPromptDrawerOpen(false)}
        question={question}
        onQuestionChange={setQuestion}
        runConfig={store.runConfig}
        onRunNow={() => startRun(question)}
      />
    </div>
  );
}
