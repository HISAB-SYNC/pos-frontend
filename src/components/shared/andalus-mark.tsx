import Image from "next/image";

import { cn } from "@/lib/utils";

type AndalusLogoProps = {
  variant?: "full" | "compact" | "icon";
  className?: string;
  size?: number;
};

export function AndalusLogo({ variant = "full", className, size }: AndalusLogoProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <div className="relative h-9 w-9 shrink-0 overflow-hidden">
          <Image
            src="/andalus-logo.png"
            alt=""
            width={120}
            height={120}
            className="absolute left-1/2 top-0 h-[120px] w-[120px] max-w-none -translate-x-1/2 object-cover object-top"
            aria-hidden
          />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[#111827]">Andalus</span>
      </div>
    );
  }

  if (variant === "icon") {
    const dimension = size ?? 120;

    return (
      <Image
        src="/andalus-logo.png"
        alt="Andalus"
        width={dimension}
        height={dimension}
        className={cn("object-contain", className)}
        style={size ? { width: size, height: size } : undefined}
        priority
      />
    );
  }

  return (
    <Image
      src="/andalus-logo.png"
      alt="Andalus"
      width={160}
      height={160}
      className={cn("h-auto w-[140px] object-contain", className)}
      priority
    />
  );
}

/** @deprecated Use AndalusLogo instead */
export function AndalusMark(props: { size?: number; className?: string }) {
  return <AndalusLogo variant="icon" size={props.size} className={props.className} />;
}
