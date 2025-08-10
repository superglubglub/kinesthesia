// src/components/PoseOverlay2D.tsx
import React, { useEffect, useRef } from "react";
import type { PoseResult } from "../types/pose";
import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";

type Props = {
    videoRef: React.RefObject<HTMLVideoElement>;
    pose: PoseResult | null;
};

const PoseOverlay2D: React.FC<Props> = ({ videoRef, pose }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let raf = 0;
        const ctx = canvasRef.current?.getContext("2d");
        const drawer = ctx ? new DrawingUtils(ctx) : null;

        const render = () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !ctx || !video) {
                raf = requestAnimationFrame(render);
                return;
            }

            const w = video.clientWidth || 1;
            const h = video.clientHeight || 1;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            ctx.clearRect(0, 0, w, h);

            const lms = pose?.landmarks ?? [];
            if (lms.length && drawer) {
                // Built-in connections + landmarks via DrawingUtils
                drawer.drawConnectors(
                    lms as any, // NormalizedLandmark[]
                    PoseLandmarker.POSE_CONNECTIONS,
                    { lineWidth: 3 }
                );
                drawer.drawLandmarks(lms as any, { lineWidth: 0, radius: 4 });
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.font = "12px ui-sans-serif, system-ui, -apple-system";
                ctx.fillText("No pose yet...", 12, 20);
            }

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
        return () => cancelAnimationFrame(raf);
    }, [videoRef, pose]);

    return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />;
};

export default PoseOverlay2D;
