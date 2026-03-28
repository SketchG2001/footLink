import { useEffect, useRef } from "react";

/**
 * Automatically clears a feedback message after `delay` ms.
 * Call `setMessage` with `{ text: "", ok: false }` to clear immediately.
 */
export function useAutoDismiss(
  message: { text: string; ok: boolean },
  setMessage: (m: { text: string; ok: boolean }) => void,
  delay = 4000,
) {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (message.text) {
      timer.current = setTimeout(
        () => setMessage({ text: "", ok: false }),
        delay,
      );
    }
    return () => clearTimeout(timer.current);
  }, [message.text, message.ok, delay, setMessage]);
}
