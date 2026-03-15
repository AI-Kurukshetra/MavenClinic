"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  FileText,
  Info,
  MessageSquareText,
  Mic,
  MicOff,
  MonitorUp,
  PanelRightClose,
  PanelRightOpen,
  PhoneOff,
  Save,
  Video,
  VideoOff,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/Toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type { ConsultationRoomData } from "@/lib/appointments-data";

type Props = ConsultationRoomData & {
  currentUserId: string;
};

type ConsultationMessageRow = {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string | null;
};

type AppointmentRow = {
  status: string | null;
  notes: string | null;
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

function formatElapsed(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m elapsed`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s elapsed`;
  }

  return `${remainingSeconds}s elapsed`;
}

export function ConsultationRoom({ appointment, provider, conversationId, messages: initialMessages, currentUserId }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [activePanelTab, setActivePanelTab] = useState<"chat" | "notes" | "info">("chat");
  const [panelOpen, setPanelOpen] = useState(true);
  const [draftMessage, setDraftMessage] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState(appointment.notes ?? "");
  const [notesSavedValue, setNotesSavedValue] = useState(appointment.notes ?? "");
  const [pipPosition, setPipPosition] = useState({ x: 24, y: 24 });
  const [dragging, setDragging] = useState<{ offsetX: number; offsetY: number } | null>(null);
  const [sendingMessage, startSendingMessage] = useTransition();
  const [endingCall, startEndingCall] = useTransition();
  const [savingNotes, startSavingNotes] = useTransition();
  const pipRef = useRef<HTMLDivElement | null>(null);
  const timerBase = appointment.startedAt ?? appointment.scheduledAt;
  const useDailyEmbed = Boolean(
    appointment.videoRoomUrl &&
    appointment.videoRoomUrl.startsWith("https://")
  );
  const [timerLabel, setTimerLabel] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(timerBase).getTime()) / 1000);
    return formatElapsed(elapsed);
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(timerBase).getTime()) / 1000);
      setTimerLabel(formatElapsed(elapsed));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [timerBase]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const messagesChannel = supabase
      .channel(`consultation-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as ConsultationMessageRow;
          setMessages((current) => {
            if (current.some((message) => message.id === row.id)) {
              return current;
            }

            return [
              ...current,
              {
                id: String(row.id),
                sender: row.sender_id === currentUserId ? "patient" : "provider",
                content: String(row.content),
                createdAt: String(row.created_at),
              },
            ];
          });
        },
      )
      .subscribe();

    const appointmentChannel = supabase
      .channel(`consultation-appointment-${appointment.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${appointment.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as AppointmentRow;
          if (row.status === "completed" || row.status === "cancelled") {
            router.push("/appointments");
          }

          if (typeof row.notes === "string") {
            setConsultationNotes(row.notes);
            setNotesSavedValue(row.notes);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(messagesChannel);
      void supabase.removeChannel(appointmentChannel);
    };
  }, [appointment.id, conversationId, currentUserId, router]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const activeDrag = dragging;

    function handlePointerMove(event: PointerEvent) {
      setPipPosition({
        x: Math.max(16, window.innerWidth - event.clientX - activeDrag.offsetX),
        y: Math.max(16, window.innerHeight - event.clientY - activeDrag.offsetY),
      });
    }

    function handlePointerUp() {
      setDragging(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging]);

  function sendMessage() {
    if (!draftMessage.trim()) {
      return;
    }

    startSendingMessage(async () => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: draftMessage.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to send message.", variant: "error" });
        return;
      }

      setDraftMessage("");
    });
  }

  function saveNotes() {
    startSavingNotes(async () => {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_notes", notes: consultationNotes }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to save consultation notes.", variant: "error" });
        return;
      }

      const savedNotes = typeof data.notes === "string" ? data.notes : consultationNotes.trim();
      setConsultationNotes(savedNotes);
      setNotesSavedValue(savedNotes);
      setToast({ message: "Consultation notes saved.", variant: "success" });
    });
  }

  function endConsultation() {
    if (!window.confirm("End consultation?")) {
      return;
    }

    startEndingCall(async () => {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({ message: data.error ?? "Unable to end consultation.", variant: "error" });
        return;
      }

      router.push(data.redirectTo ?? "/dashboard?toast=consultation-complete");
      router.refresh();
    });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rect = pipRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setDragging({
      offsetX: rect.right - event.clientX,
      offsetY: rect.bottom - event.clientY,
    });
  }

  const notesDirty = consultationNotes.trim() !== notesSavedValue.trim();

  return (
    <div className="min-h-screen bg-[var(--slate-900,#0f172a)] text-white">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Avatar src={provider.avatarUrl} name={provider.fullName} size="lg" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Video consultation</p>
              <h1 className="text-2xl font-semibold">{provider.fullName}</h1>
              <p className="text-sm text-white/70">{provider.specialtyLabel} - {timerLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success">In progress</Badge>
            <span className="text-sm text-white/70">Scheduled for {formatDateTime(appointment.scheduledAt)}</span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="relative flex-1 overflow-hidden p-4 sm:p-6">
            <div className="relative h-full min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(22,78,99,0.92))]">
              {useDailyEmbed && appointment.videoRoomUrl ? (
                <iframe
                  src={appointment.videoRoomUrl}
                  title="Consultation room"
                  className="h-full min-h-[420px] w-full border-0"
                  allow="camera; microphone; fullscreen; display-capture"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="space-y-4 text-center">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/60">Remote video</p>
                    <h2 className="text-4xl font-semibold">{provider.fullName}</h2>
                    <p className="max-w-xl text-sm leading-7 text-white/70">This consultation is running in demo mode. Controls still work for validation and appointment state changes.</p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
                      {sharingScreen ? "Screen share active" : cameraOn ? "Camera on" : "Camera off"}
                    </div>
                  </div>
                </div>
              )}

              <div
                ref={pipRef}
                onPointerDown={startDrag}
                className="absolute flex h-40 w-28 cursor-grab flex-col justify-between rounded-[24px] border border-white/15 bg-[linear-gradient(135deg,rgba(248,250,252,0.2),rgba(244,114,182,0.16))] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                style={{ right: `${pipPosition.x}px`, bottom: `${pipPosition.y}px` }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">You</p>
                <div className="text-sm text-white/80">{cameraOn ? "Local camera preview" : "Camera paused"}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" variant="secondary" className="gap-2 bg-white/10 text-white hover:bg-white/15" onClick={() => setMicOn((current) => !current)}>
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {micOn ? "Mute" : "Unmute"}
              </Button>
              <Button type="button" variant="secondary" className="gap-2 bg-white/10 text-white hover:bg-white/15" onClick={() => setCameraOn((current) => !current)}>
                {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {cameraOn ? "Camera on" : "Camera off"}
              </Button>
              <Button type="button" variant="secondary" className="gap-2 bg-white/10 text-white hover:bg-white/15" onClick={() => setSharingScreen((current) => !current)}>
                <MonitorUp className="h-4 w-4" />
                {sharingScreen ? "Stop share" : "Share screen"}
              </Button>
              <Button type="button" variant="secondary" className="gap-2 bg-white/10 text-white hover:bg-white/15" onClick={() => setPanelOpen((current) => !current)}>
                {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                {panelOpen ? "Hide panel" : "Show panel"}
              </Button>
              <Button type="button" className="gap-2 bg-[var(--rose-500)] text-white hover:bg-[var(--rose-600)]" onClick={endConsultation} disabled={endingCall}>
                <PhoneOff className="h-4 w-4" />
                {endingCall ? "Ending..." : "End call"}
              </Button>
            </div>
          </main>

          {panelOpen ? (
            <aside className="w-full max-w-md border-l border-white/10 bg-[rgba(15,23,42,0.92)] p-4 sm:p-6">
              <div className="flex flex-wrap gap-2">
                {([
                  { key: "chat", label: "Chat", icon: MessageSquareText },
                  { key: "notes", label: "Notes", icon: FileText },
                  { key: "info", label: "Info", icon: Info },
                ] as const).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActivePanelTab(tab.key)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activePanelTab === tab.key ? "bg-white text-[var(--slate-900,#0f172a)]" : "bg-white/10 text-white/80"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activePanelTab === "chat" ? (
                <div className="mt-6 flex h-[calc(100vh-220px)] flex-col">
                  <div className="flex-1 space-y-3 overflow-auto pr-1">
                    {messages.length ? messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === "patient" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm leading-6 ${message.sender === "patient" ? "bg-[var(--rose-500)] text-white" : "bg-white/10 text-white/85"}`}>
                          <p>{message.content}</p>
                          <p className={`mt-2 text-xs ${message.sender === "patient" ? "text-white/75" : "text-white/60"}`}>{formatDateTime(message.createdAt)}</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-white/70">No messages yet for this consultation.</p>}
                  </div>
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-3">
                    <textarea
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      className="min-h-24 w-full resize-none bg-transparent px-2 py-1 text-sm text-white placeholder:text-white/40"
                      placeholder="Write a message to your provider during the visit."
                    />
                    <div className="mt-3 flex justify-end">
                      <Button type="button" onClick={sendMessage} disabled={sendingMessage || !draftMessage.trim()}>{sendingMessage ? "Sending..." : "Send"}</Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {activePanelTab === "notes" ? (
                <div className="mt-6 space-y-4 text-sm">
                  <Card className="space-y-2 bg-white/5 text-white shadow-none">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Chief complaint</p>
                    <p className="leading-7 text-white/85">{appointment.chiefComplaint}</p>
                  </Card>
                  <Card className="space-y-3 bg-white/5 text-white shadow-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Care notes</p>
                        <p className="mt-1 text-xs text-white/55">Add your own notes during the visit. They save back to this appointment.</p>
                      </div>
                      <Button type="button" size="sm" variant="secondary" className="gap-2 bg-white/10 text-white hover:bg-white/15" onClick={saveNotes} disabled={savingNotes || !notesDirty}>
                        <Save className="h-4 w-4" />
                        {savingNotes ? "Saving..." : notesDirty ? "Save notes" : "Saved"}
                      </Button>
                    </div>
                    <textarea
                      value={consultationNotes}
                      onChange={(event) => setConsultationNotes(event.target.value)}
                      className="min-h-44 w-full rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white placeholder:text-white/35"
                      placeholder="Capture takeaways, follow-ups, or questions to revisit after the consultation."
                    />
                  </Card>
                </div>
              ) : null}

              {activePanelTab === "info" ? (
                <div className="mt-6 space-y-4 text-sm">
                  <Card className="space-y-2 bg-white/5 text-white shadow-none">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Specialty</p>
                    <p className="font-medium text-white">{provider.specialtyLabel}</p>
                  </Card>
                  <Card className="space-y-2 bg-white/5 text-white shadow-none">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Bio</p>
                    <p className="leading-7 text-white/85">{provider.bio}</p>
                  </Card>
                  <Card className="space-y-2 bg-white/5 text-white shadow-none">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.languages.map((language) => (
                        <span key={language} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{language}</span>
                      ))}
                    </div>
                  </Card>
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
