import { useEffect, useRef } from "react";
import { Fingerprint } from "lucide-react";
import { TypingDots, EmptyState } from "@/atoms";
import { MessageBubble } from "@/molecules";
import type { ChatMessage } from "@/hooks/chatTypes.ts";
import {
  WelcomeMessageContent,
  UserActionContent,
  DeclarationContent,
  EvidenceFoundContent,
  EvidenceExaminedContent,
  PlaceInvestigatedContent,
  HintContent,
  ContradictionContent,
  SuspicionContent,
  VerdictContent,
  SystemContent,
} from "./ChatMessageContent.tsx";

interface ChatThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

function formatHora(fecha: Date): string {
  return new Date(fecha).toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatThread({ messages, isLoading }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {messages.length === 0 && !isLoading && (
          <EmptyState
            icon={<Fingerprint />}
            message="La investigación aún no tiene movimientos"
            hint="Empieza por interrogar a un sospechoso o recorrer un lugar; cada hallazgo aparecerá aquí."
          />
        )}

        {messages.map((msg) => (
          <MessageRow key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <SystemAvatar />
            <div className="rounded-2xl border border-border bg-surface px-4 py-3.5">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function SystemAvatar() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/12 text-accent"
      aria-hidden="true"
    >
      <Fingerprint className="h-4 w-4" />
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.type === "user_action";

  if (isUser) {
    return (
      <div className="animate-fade-up">
        <MessageBubble isUser>
          <UserActionContent message={message} />
        </MessageBubble>
        <p className="mt-1 pr-1 text-right text-xs text-text-dim">
          {formatHora(message.timestamp)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-up items-start gap-3">
      <SystemAvatar />
      <div className="min-w-0 flex-1">
        <MessageBubble>
          <MessageContentSwitch message={message} />
        </MessageBubble>
        <p className="mt-1 pl-1 text-xs text-text-dim">
          {formatHora(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function MessageContentSwitch({ message }: { message: ChatMessage }) {
  switch (message.type) {
    case "welcome":
      return <WelcomeMessageContent message={message} />;
    case "user_action":
      return <UserActionContent message={message} />;
    case "declaration":
      return <DeclarationContent message={message} />;
    case "evidence_found":
      return <EvidenceFoundContent message={message} />;
    case "evidence_examined":
      return <EvidenceExaminedContent message={message} />;
    case "place_investigated":
      return <PlaceInvestigatedContent message={message} />;
    case "hint":
      return <HintContent message={message} />;
    case "contradiction":
      return <ContradictionContent message={message} />;
    case "suspicion":
      return <SuspicionContent message={message} />;
    case "verdict":
      return <VerdictContent message={message} />;
    case "system":
      return <SystemContent message={message} />;
    default:
      return null;
  }
}
