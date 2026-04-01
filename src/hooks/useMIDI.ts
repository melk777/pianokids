"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface MIDINote {
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
}

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
}

interface UseMIDIReturn {
  isSupported: boolean;
  isConnected: boolean;
  activeNotes: Map<number, MIDINote>;
  devices: MIDIDevice[];
  lastNote: MIDINote | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  error: string | null;
}

export function useMIDI(): UseMIDIReturn {
  // Lazy init: never evaluate `navigator` on the server
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Map<number, MIDINote>>(
    () => new Map()
  );
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [lastNote, setLastNote] = useState<MIDINote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  // Check support only on client (after hydration)
  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" && "requestMIDIAccess" in navigator
    );
  }, []);

  const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0];
    const note = data[1];
    const velocity = data[2];
    const channel = status & 0x0f;
    const command = status >> 4;

    if (command === 9 && velocity > 0) {
      const midiNote: MIDINote = {
        note,
        velocity,
        channel,
        timestamp: typeof performance !== "undefined" ? performance.now() : Date.now(),
      };
      setActiveNotes((prev) => {
        const next = new Map(prev);
        next.set(note, midiNote);
        return next;
      });
      setLastNote(midiNote);
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      setActiveNotes((prev) => {
        const next = new Map(prev);
        next.delete(note);
        return next;
      });
    }
  }, []);

  const enumerateDevices = useCallback((access: MIDIAccess) => {
    const inputDevices: MIDIDevice[] = [];
    access.inputs.forEach((input) => {
      inputDevices.push({
        id: input.id,
        name: input.name || "Unknown Device",
        manufacturer: input.manufacturer || "Unknown",
      });
    });
    setDevices(inputDevices);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("WebMIDI não é suportado neste navegador. Use Chrome ou Edge.");
      return false;
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      midiAccessRef.current = access;

      enumerateDevices(access);

      access.inputs.forEach((input) => {
        input.onmidimessage = handleMIDIMessage;
      });

      access.onstatechange = () => {
        enumerateDevices(access);
        access.inputs.forEach((input) => {
          input.onmidimessage = handleMIDIMessage;
        });
      };

      setIsConnected(true);
      setError(null);
      return true;
    } catch {
      setError("Permissão MIDI negada. Por favor, permita o acesso ao teclado.");
      setIsConnected(false);
      return false;
    }
  }, [isSupported, handleMIDIMessage, enumerateDevices]);

  const disconnect = useCallback(() => {
    if (midiAccessRef.current) {
      midiAccessRef.current.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
      midiAccessRef.current = null;
    }
    setIsConnected(false);
    setActiveNotes(new Map());
    setDevices([]);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isSupported,
    isConnected,
    activeNotes,
    devices,
    lastNote,
    connect,
    disconnect,
    error,
  };
}

export function midiNoteToName(note: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(note / 12) - 1;
  return `${names[note % 12]}${octave}`;
}

export function isBlackKey(note: number): boolean {
  return [1, 3, 6, 8, 10].includes(note % 12);
}
