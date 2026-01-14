import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KeyboardShortcut, useKeyboardShortcuts } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes from localStorage when available", () => {
    localStorage.setItem("pt-keyboard-shortcuts-enabled", "false");
    const { result } = renderHook(() => useKeyboardShortcuts());

    expect(result.current.isEnabled).toBe(false);
  });

  it("defaults to enabled when localStorage is not set", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    expect(result.current.isEnabled).toBe(true);
  });

  it("persists enabled state to localStorage", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => result.current.toggleEnabled());
    expect(localStorage.getItem("pt-keyboard-shortcuts-enabled")).toBe("false");

    act(() => result.current.toggleEnabled());
    expect(localStorage.getItem("pt-keyboard-shortcuts-enabled")).toBe("true");
  });

  it("toggles enabled state", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    expect(result.current.isEnabled).toBe(true);

    act(() => result.current.toggleEnabled());
    expect(result.current.isEnabled).toBe(false);

    act(() => result.current.toggleEnabled());
    expect(result.current.isEnabled).toBe(true);
  });

  it("registers and retrieves shortcuts", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrlKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));

    const registered = result.current.getRegisteredShortcuts();
    expect(registered).toHaveLength(1);
    expect(registered[0]).toEqual(shortcut);
  });

  it("unregisters shortcuts", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrlKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));
    expect(result.current.getRegisteredShortcuts()).toHaveLength(1);

    act(() => result.current.unregister(shortcut));
    expect(result.current.getRegisteredShortcuts()).toHaveLength(0);
  });

  it("triggers handler when shortcut key is pressed", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrlKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not trigger handler when shortcuts are disabled", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrlKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));
    act(() => result.current.toggleEnabled());

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("handles case insensitive keys", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrlKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));

    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      bubbles: true,
    });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("works with metaKey shortcuts", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      metaKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignores shortcuts in input fields", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrlKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));

    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: input, enumerable: true });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("allows Escape key in input fields", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "Escape",
      handler,
      description: "Close dialog",
    };

    act(() => result.current.register(shortcut));

    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: input, enumerable: true });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });

  it("prevents default behavior when shortcut is triggered", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const handler = vi.fn();
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrlKey: true,
      handler,
      description: "Test shortcut",
    };

    act(() => result.current.register(shortcut));

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });
});
