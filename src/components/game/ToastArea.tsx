import { useEffect } from "react";
import { useGameStore } from "../../store/gameStore";

function Toast({ id, text }: { id: number; text: string }) {
  const dismissToast = useGameStore((s) => s.dismissToast);
  useEffect(() => {
    const t = setTimeout(() => dismissToast(id), 2800);
    return () => clearTimeout(t);
  }, [id, dismissToast]);
  return <div className="toast">{text}</div>;
}

export default function ToastArea() {
  const toasts = useGameStore((s) => s.toasts);
  return (
    <div className="toast-area">
      {toasts.map((t) => (
        <Toast key={t.id} id={t.id} text={t.text} />
      ))}
    </div>
  );
}
