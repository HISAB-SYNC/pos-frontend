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
      <div className={cn("flex items-center gap-3.5", className)}>
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden">
          <Image
            src="/andalus-logo.png"
            alt="Andalus"
            width={52}
            height={52}
            className="size-full scale-[1.7] -translate-y-0.5 object-cover object-top"
            priority
          />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#111827]">Andalus</span>
      </div>
    );
  }

  if (variant === "icon") {
    const dimension = size ?? 44;

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
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden">
        <Image
          src="/andalus-logo.png"
          alt="Andalus"
          width={52}
          height={52}
          className="size-full scale-[1.55] -translate-y-0.5 object-cover object-top"
          priority
        />
      </div>
      <span className="text-2xl font-bold tracking-tight text-[#111827]">Andalus</span>
    </div>
  );
}


/** @deprecated Use AndalusLogo instead */
export function AndalusMark(props: { size?: number; className?: string }) {
  return <AndalusLogo variant="icon" size={props.size} className={props.className} />;
}
