import Image from "next/image";
import type { SVGProps } from "react";

export function AndalusMark(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const size = props.size ?? 120;

  // prefer a raster/vector image in public/andalus.png (or .svg), fallback to inline SVG
  return (
    <span style={{ display: "inline-block", lineHeight: 0, width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <Image src="/andalus.png" alt="Andalus logo" width={size} height={size} style={{ objectFit: "contain" }} />
    </span>
  );
}