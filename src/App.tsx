// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";

import { PoseContext } from "./context/PoseContext";
import type { PoseResult } from "./types/pose";

import { useCamera } from "./hooks/useCamera";
import { useBlazePose } from "./hooks/useBlazePose";

import CameraFeed from "./components/CameraFeed";
import PoseOverlay2D from "./components/PoseOverlay2D";
import PoseViewer3D from "./components/three/PoseViewer3D";
import ControlBar from "./components/ControlBar";
import DebugHUD from "./components/DebugHUD";

// Local models served from /public/models/...
const MODEL_LITE = "/models/pose_landmarker_lite.task";
const MODEL_FULL = "/models/pose_landmarker_full.task";

const App: React.FC = () => {
    // Shared pose state
    const [pose, setPose] = useState<PoseResult | null>(null);

    // UI toggles
    const [mirrored, setMirrored] = useState(true);
    const [wireframe, setWireframe] = useState(false);
    const [model, setModel] = useState<"lite" | "full">("lite");

    // Camera lifecycle
    const {
        videoRef,
        ready: cameraReady,
        error: cameraError,
        start: startCamera,
        stop: stopCamera,
    } = useCamera();

    // Pose lifecycle (model switches between Lite/Full)
    const modelUrl = model === "lite" ? MODEL_LITE : MODEL_FULL;
    const {
        running: poseRunning,
        error: poseError,
        start: startPose,
        stop: stopPose,
    } = useBlazePose(videoRef, setPose, modelUrl);

    // Auto-restart the detector when the model changes (only if pose is running)
    useEffect(() => {
        if (!poseRunning) return;
        (async () => {
            stopPose();
            // allow resources to free before reinit
            await new Promise((r) => setTimeout(r, 60));
            await startPose();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelUrl]);

    const poseCtx = useMemo(() => ({ pose, setPose }), [pose]);

    return (
        <PoseContext.Provider value={poseCtx}>
            <div className="min-h-screen w-full bg-zinc-900 text-white">
                <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-4">
                    {/* Header + controls */}
                    <header className="flex items-center justify-between">
                        <h1 className="text-xl md:text-3xl font-semibold">Kinesthesia — Pre-MVP</h1>
                        <ControlBar
                            cameraReady={cameraReady}
                            onCameraStart={startCamera}
                            onCameraStop={stopCamera}
                            poseRunning={poseRunning}
                            onPoseStart={startPose}
                            onPoseStop={stopPose}
                            model={model}
                            onModelChange={setModel}
                        />
                    </header>

                    {(cameraError || poseError) && (
                        <div className="text-sm text-rose-300 bg-rose-900/40 border border-rose-700/50 rounded-lg p-2">
                            {cameraError || poseError}
                        </div>
                    )}

                    {/* Three-column layout:
              - Left: webcam + overlay
              - Middle: debug column (fixed width)
              - Right: 3D view
             Use arbitrary CSS property for reliable template at lg+
          */}
                    <main className="grid grid-cols-1 gap-6 lg:[grid-template-columns:minmax(0,1fr)_16rem_minmax(0,1fr)]">
                        {/* Left panel */}
                        <section className="min-w-0">
                            <div className="relative w-full aspect-video bg-rose-200/10 rounded-2xl overflow-hidden ring-1 ring-white/10">
                                <CameraFeed
                                    videoRef={videoRef}
                                    ready={cameraReady}
                                    onStart={startCamera}
                                    onStop={stopCamera}
                                    mirrored={mirrored}
                                />
                                <PoseOverlay2D videoRef={videoRef} pose={pose} mirrored={mirrored} />
                            </div>

                            {/* Buttons below left panel */}
                            <div className="mt-4 flex flex-wrap gap-4">
                                <button
                                    className="px-5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm shadow-sm"
                                    onClick={() => setWireframe((w) => !w)}
                                >
                                    toggle wireframe
                                </button>
                                <button
                                    className="px-5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm shadow-sm"
                                    onClick={() => setMirrored((m) => !m)}
                                >
                                    toggle camera view
                                </button>
                            </div>
                        </section>

                        {/* Middle debug column */}
                        <aside className="hidden lg:flex flex-col min-w-[16rem]">
                            <div className="text-xs text-white/80 leading-6">
                                <div className="font-mono opacity-80 mb-2">debug info column:</div>
                                <div>• landmarks: {pose?.landmarks?.length ?? 0}</div>
                                <div>• FPS: {pose?.fps?.toFixed?.(1) ?? "—"}</div>
                                <div>• timestamp: {pose?.timestamp ? Math.round(pose.timestamp) : "—"}</div>
                                <div className="mt-3 opacity-70">model: {model}</div>
                            </div>
                        </aside>

                        {/* Right panel */}
                        <section className="min-w-0">
                            <div className="w-full aspect-video bg-cyan-100/10 rounded-2xl overflow-hidden ring-1 ring-white/10">
                                <PoseViewer3D pose={pose} wireframe={wireframe} />
                            </div>
                        </section>
                    </main>

                    {/* Mobile HUD (since the aside is hidden below lg) */}
                    <div className="lg:hidden">
                        <DebugHUD pose={pose} />
                    </div>
                </div>
            </div>
        </PoseContext.Provider>
    );
};

export default App;
