export default function TypingDots() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Analizando">
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
          style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}
