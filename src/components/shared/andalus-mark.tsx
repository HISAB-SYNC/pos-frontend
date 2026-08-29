import Image from "next/image";

import { cn } from "@/lib/utils";

type AndalusLogoProps = {
  variant?: "full" | "compact" | "icon";
  className?: string;
  size?: number;
};

export function AndalusLogo({ variant = "full", className, size }: AndalusLogoProps) {
  const dimension = size ?? (variant === "full" ? 52 : 44);

  if (variant === "icon") {
    return (
      <div className={cn("relative flex size-10 items-center justify-center overflow-hidden", className)}>
        <Image
          src="/andalus-logo.png"
          alt="Andalus"
          width={dimension}
          height={dimension}
          className="size-full scale-[1.7] -translate-y-0.5 object-cover object-top"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center",
        variant === "compact" ? "gap-3.5" : "gap-3",
        className,
      )}
    >
      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden">
        <Image
          src="/andalus-logo.png"
          alt="Andalus"
          width={dimension}
          height={dimension}
          className="size-full scale-[1.7] -translate-y-0.5 object-cover object-top"
          priority
        />
      </div>
      <span
        className={cn(
          "font-bold tracking-tight text-[#111827]",
          variant === "compact" ? "text-xl" : "text-2xl",
        )}
      >
        Andalus
      </span>
    </div>
  );
}

export function AndalusMark(props: { size?: number; className?: string }) {
  return <AndalusLogo variant="icon" size={props.size} className={props.className} />;
}
