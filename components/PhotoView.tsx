"use client";

import { useEffect, useState } from "react";
import type { Box } from "@/lib/schemas";

export interface OverlayBox {
  id: string;
  box: Box; // pixels in the photo's natural size
  label?: string;
  tone?: "normal" | "highlight" | "dim" | "defect" | "duplicate" | "unsure";
}

const STROKE: Record<NonNullable<OverlayBox["tone"]>, string> = {
  normal: "#0f766e",
  highlight: "#facc15",
  dim: "rgba(255,255,255,0.35)",
  defect: "#dc2626",
  duplicate: "#9ca3af",
  unsure: "#f59e0b",
};

export function usePhotoUrl(blob: Blob | undefined | null): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL lifecycle follows the blob
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return blob ? url : undefined;
}

export function PhotoView({
  src,
  width,
  height,
  boxes = [],
  onBoxClick,
  dimOthers,
  className = "",
}: {
  src?: string;
  width: number;
  height: number;
  boxes?: OverlayBox[];
  onBoxClick?: (id: string) => void;
  /** Darken the photo so highlighted parts stand out (build mode). */
  dimOthers?: boolean;
  className?: string;
}) {
  const sw = Math.max(width, height) / 220;
  const fs = Math.max(width, height) / 40;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black outline outline-1 -outline-offset-1 outline-black/10 ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URLs */}
      {src && <img src={src} alt="" className="absolute inset-0 h-full w-full" />}
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
        {dimOthers && (
          <>
            <defs>
              <mask id="holes">
                <rect width={width} height={height} fill="white" />
                {boxes
                  .filter((b) => b.tone === "highlight")
                  .map((b) => (
                    <rect key={b.id} x={b.box.x} y={b.box.y} width={b.box.w} height={b.box.h} rx={sw * 3} fill="black" />
                  ))}
              </mask>
            </defs>
            <rect width={width} height={height} fill="rgba(0,0,0,0.55)" mask="url(#holes)" />
          </>
        )}
        {boxes.map((b) => {
          const tone = b.tone ?? "normal";
          const stroke = STROKE[tone];
          return (
            <g key={b.id} onClick={onBoxClick ? () => onBoxClick(b.id) : undefined} style={{ cursor: onBoxClick ? "pointer" : undefined }}>
              <rect
                x={b.box.x}
                y={b.box.y}
                width={b.box.w}
                height={b.box.h}
                rx={sw * 2}
                fill={tone === "highlight" ? "rgba(250,204,21,0.12)" : "transparent"}
                stroke={stroke}
                strokeWidth={tone === "highlight" ? sw * 1.8 : sw}
                strokeDasharray={tone === "duplicate" || tone === "unsure" ? `${sw * 3} ${sw * 2}` : undefined}
              />
              {b.label && tone !== "dim" && (
                <g transform={`translate(${b.box.x}, ${Math.max(fs * 1.25, b.box.y)})`}>
                  <rect y={-fs * 1.25} width={Math.min(width - b.box.x, fs * 0.62 * b.label.length + fs * 0.6)} height={fs * 1.25} rx={sw} fill={stroke} />
                  <text x={fs * 0.3} y={-fs * 0.33} fontSize={fs} fontWeight={700} fill={tone === "highlight" || tone === "unsure" ? "#111" : "#fff"}>
                    {b.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
