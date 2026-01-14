import { useCallback, useEffect, useRef, useState } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  description: string;
}

const STORAGE_KEY = "pt-keyboard-shortcuts-enabled";

function getInitialEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "true" || stored === "false") {
    return stored === "true";
  }

  return true;
}

export function useKeyboardShortcuts() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => getInitialEnabled());
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(isEnabled));
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled || typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Allow Escape key to work in input fields
      if (isInputField && event.key !== "Escape") {
        return;
      }

      const shortcutKey = generateShortcutKey(
        event.key,
        event.ctrlKey || event.metaKey,
        event.metaKey
      );

      const shortcut = shortcutsRef.current.get(shortcutKey);
      if (shortcut) {
        event.preventDefault();
        shortcut.handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEnabled]);

  const register = useCallback((shortcut: KeyboardShortcut) => {
    const key = generateShortcutKey(
      shortcut.key,
      shortcut.ctrlKey || shortcut.metaKey || false,
      shortcut.metaKey || false
    );
    shortcutsRef.current.set(key, shortcut);
  }, []);

  const unregister = useCallback((shortcut: KeyboardShortcut) => {
    const key = generateShortcutKey(
      shortcut.key,
      shortcut.ctrlKey || shortcut.metaKey || false,
      shortcut.metaKey || false
    );
    shortcutsRef.current.delete(key);
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled((current) => !current);
  }, []);

  const getRegisteredShortcuts = useCallback(() => {
    return Array.from(shortcutsRef.current.values());
  }, []);

  return {
    isEnabled,
    register,
    unregister,
    toggleEnabled,
    getRegisteredShortcuts,
  };
}

function generateShortcutKey(
  key: string,
  ctrlOrMeta: boolean,
  meta: boolean
): string {
  const normalizedKey = key.toLowerCase();
  const ctrl = ctrlOrMeta ? "ctrl" : "";
  const metaKey = meta ? "meta" : "";
  return `${ctrl}+${metaKey}+${normalizedKey}`;
}
