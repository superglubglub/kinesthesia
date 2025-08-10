// src/hooks/useBlazePose.ts
import { useCallback, useEffect, useRef, useState } from "react";
import {
    FilesetResolver,
    PoseLandmarker,
    type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { PoseResult, Landmark } from "../types/pose";

/**
 * Starts BlazePose (Tasks Vision) on a <video>.
 * - Default model: local /models/pose_landmarker_lite.task
 * - WASM stays on CDN for simplicity/perf
 */
export function useBlazePose(
    videoRef: React.RefObject<HTMLVideoElement>,
    setPose: (p: PoseResult | null) => void,
    modelUrl: string = "/models/pose_landmarker_lite.task"
) {
    const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

    const landmarkerRef = useRef<PoseLandmarker | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastVidTimeRef = useRef<number>(-1);
    const lastPerfMsRef = useRef<number>(0);
    const fpsEmaRef = useRef<number>(0);
    const prevSmoothedRef = useRef<Landmark[] | null>(null);

    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const smooth = (prev: Landmark[] | null, next: Landmark[]): Landmark[] => {
        if (!prev || prev.length !== next.length) return next;
        const alpha = 0.6;
        const out: Landmark[] = new Array(next.length);
        for (let i = 0; i < next.length; i++) {
            const p = prev[i], n = next[i];
            out[i] = {
                x: p.x * (1 - alpha) + n.x * alpha,
                y: p.y * (1 - alpha) + n.y * alpha,
                z: p.z * (1 - alpha) + n.z * alpha,
                visibility:
                    p.visibility !== undefined && n.visibility !== undefined
                        ? p.visibility * (1 - alpha) + n.visibility * alpha
                        : n.visibility,
            };
        }
        return out;
    };

    const mapLandmarks = (arr: any[] | undefined): Landmark[] | null => {
        if (!arr || arr.length === 0) return null;
        const lms = arr[0]; // single-person pre-MVP
        return lms.map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
            visibility: lm.visibility,
        })) as Landmark[];
    };

    const loop = useCallback(() => {
        const video = videoRef.current;
        const landmarker = landmarkerRef.current;
        if (!video || !landmarker) return;

        if (video.currentTime !== lastVidTimeRef.current) {
            const tsMs = Math.round(video.currentTime * 1000);
            const now = performance.now();
            const dt = now - (lastPerfMsRef.current || now);
            lastPerfMsRef.current = now;
            const inst = dt > 0 ? 1000 / dt : 0;
            fpsEmaRef.current = fpsEmaRef.current ? fpsEmaRef.current * 0.9 + inst * 0.1 : inst;

            const result: PoseLandmarkerResult = landmarker.detectForVideo(video, tsMs);

            const img = mapLandmarks(result.landmarks);
            const world = mapLandmarks(result.worldLandmarks);

            let smoothed = img;
            if (img) {
                smoothed = smooth(prevSmoothedRef.current, img);
                prevSmoothedRef.current = smoothed!;
            }

            const payload: PoseResult | null = smoothed
                ? {
                    landmarks: smoothed!,
                    worldLandmarks: world ?? undefined,
                    timestamp: tsMs,
                    fps: Number(fpsEmaRef.current.toFixed(1)),
                }
                : null;

            setPose(payload);
            lastVidTimeRef.current = video.currentTime;
        }

        rafRef.current = requestAnimationFrame(loop);
    }, [setPose, videoRef]);

    const start = useCallback(async () => {
        try {
            if (running) return;
            setError(null);

            const video = videoRef.current;
            if (!video) throw new Error("Video element not ready");

            if (video.readyState < 2) {
                await new Promise<void>((resolve) => {
                    const onCanPlay = () => { video.removeEventListener("canplay", onCanPlay); resolve(); };
                    video.addEventListener("canplay", onCanPlay);
                });
            }

            const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
            const pose = await PoseLandmarker.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" },
                runningMode: "VIDEO",
                numPoses: 1,
                outputSegmentationMasks: false,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            landmarkerRef.current = pose;
            lastVidTimeRef.current = -1;
            lastPerfMsRef.current = performance.now();
            fpsEmaRef.current = 0;
            prevSmoothedRef.current = null;

            setRunning(true);
            rafRef.current = requestAnimationFrame(loop);
        } catch (e: any) {
            setError(e?.message ?? "Failed to start pose detector");
            setRunning(false);
        }
    }, [loop, modelUrl, running, videoRef]);

    const stop = useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (landmarkerRef.current) {
            landmarkerRef.current.close?.();
            landmarkerRef.current = null;
        }
        setPose(null);
        setRunning(false);
    }, [setPose]);

    useEffect(() => () => { if (running) stop(); }, [running, stop]);

    return { running, error, start, stop };
}
