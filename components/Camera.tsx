"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { canvasToBlob } from "@/lib/image";
import { Camera as CameraIcon, Flashlight, ImageUp, Sparkles, SwitchCamera } from "lucide-react";
import { Button, I } from "./ui";

export interface CameraProps {
  facing?: "environment" | "user";
  /** Called with the captured or uploaded photo. Omit for a live-only view (IR test). */
  onCapture?: (blob: Blob) => void;
  captureLabel?: string;
  allowFlip?: boolean;
  /** Offered in demo mode next to the capture button. */
  onDemoPhoto?: () => void;
  busy?: boolean;
  className?: string;
}

type TorchTrack = Omit<MediaStreamTrack, "getCapabilities"> & { getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean } };

export function Camera({ facing = "environment", onCapture, captureLabel, allowFlip, onDemoPhoto, busy, className = "" }: CameraProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState(facing);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torchOk, setTorchOk] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let s: MediaStream | null = null;
    (async () => {
      setError(null);
      setStream(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera API");
        s = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        });
        if (cancelled) return s.getTracks().forEach((tr) => tr.stop());
        setStream(s);
        const track = s.getVideoTracks()[0] as unknown as TorchTrack;
        setTorchOk(!!track.getCapabilities?.().torch);
        setTorch(false);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.warn("[camera]", e);
        if (!cancelled) setError(t("cam_denied"));
      }
    })();
    return () => {
      cancelled = true;
      s?.getTracks().forEach((tr) => tr.stop());
    };
  }, [mode, t]);

  const toggleTorch = useCallback(async () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(!torch);
    } catch (e) {
      console.warn("[camera] torch", e);
      setTorchOk(false);
    }
  }, [stream, torch]);

  const capture = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !onCapture || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    onCapture(await canvasToBlob(c));
  }, [onCapture]);

  return (
    <div className={className}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black sm:aspect-[4/3]">
        <video ref={videoRef} playsInline muted autoPlay className={`h-full w-full object-cover ${mode === "user" ? "-scale-x-100" : ""}`} />
        {!stream && !error && <p className="absolute inset-0 flex items-center justify-center text-white/80">{t("cam_starting")}</p>}
        {error && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">{error}</p>}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {torchOk && (
            <button onClick={toggleTorch} aria-pressed={torch} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] ${torch ? "bg-yellow-300 text-black" : "bg-black/60 text-white"}`}>
              <I icon={Flashlight} /> {t("cam_torch")}
            </button>
          )}
          {allowFlip && (
            <button onClick={() => setMode(mode === "user" ? "environment" : "user")} className="flex min-h-11 items-center gap-2 rounded-xl bg-black/60 px-3 font-bold text-white transition-[scale] duration-150 ease-out active:scale-[0.96]">
              <I icon={SwitchCamera} /> {t("cam_flip")}
            </button>
          )}
        </div>
      </div>
      {onCapture && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr]">
          <Button big tone="plain" onClick={capture} disabled={!stream || busy}>
            <I icon={CameraIcon} /> {captureLabel ?? t("cam_take")}
          </Button>
          <Button big tone="ghost" onClick={() => fileRef.current?.click()} disabled={busy} className={onDemoPhoto ? "" : "sm:col-span-2"}>
            <I icon={ImageUp} /> {t("cam_upload")}
          </Button>
          {onDemoPhoto && (
            <Button big tone="ghost" onClick={onDemoPhoto} disabled={busy}>
              <I icon={Sparkles} /> {t("cam_demo_photo")}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onCapture(f);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
