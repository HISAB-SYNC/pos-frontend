"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function OtpInput({ length = 6, value, onChange, disabled }: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  function updateDigit(index: number, digit: string) {
    const sanitized = digit.replace(/\D/g, "").slice(-1);
    const next = digits.map((char, i) => (i === index ? sanitized : char.trim())).join("");
    onChange(next.slice(0, length));

    if (sanitized && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);

    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="flex gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event.key)}
          onPaste={handlePaste}
          className={cn(
            "h-14 w-12 rounded-xl border bg-white text-center text-xl font-semibold outline-none transition",
            digit.trim()
              ? "border-[#111111] text-[#111111]"
              : "border-[#d1d5db] text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10",
            disabled && "opacity-60",
          )}
        />
      ))}
    </div>
  );
}
