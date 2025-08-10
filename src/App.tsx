import React, { useMemo, useState } from "react";
import { PoseContext } from "./context/PoseContext";
import type { PoseResult } from "./types/pose";

import { useCamera } from "./hooks/useCamera";
import { useBlazePose } from "./hooks/useBlazePose";

import CameraFeed from "./components/CameraFeed";
import PoseOverlay2D from "./components/PoseOverlay2D";
import PoseViewer3D from "./components/three/PoseViewer3D";
import ControlBar from "./components/ControlBar";
import DebugHUD from "./components/DebugHUD";

/**
 * Pre-MVP goals:
 * 1) Show webcam output
 * 2) Overlay 2D skeleton from BlazePose landmarks
 * 3) Show a separate 3D pose visualization
 */

//which model we should use

const App: React.FC = () => {
    const [pose, setPose] = useState<PoseResult | null>(null);

    const { videoRef, ready: cameraReady, error: cameraError, start: startCamera, stop: stopCamera } = useCamera();
    const { running: poseRunning, error: poseError, start: startPose, stop: stopPose } = useBlazePose(videoRef, setPose);

    const poseCtx = useMemo(() => ({ pose, setPose }), [pose]);

    return (
        <PoseContext.Provider value={poseCtx}>
            <div className="min-h-screen w-full bg-gradient-to-b from-zinc-900 to-black text-white">
                <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-4">
                    <header className="flex items-center justify-between">
                        <h1 className="text-lg md:text-2xl font-semibold">FitCoach — Pre-MVP</h1>
                        <ControlBar
                            cameraReady={cameraReady}
                            onCameraStart={startCamera}
                            onCameraStop={stopCamera}
                            poseRunning={poseRunning}
                            onPoseStart={startPose}
                            onPoseStop={stopPose}
                        />
                    </header>

                    {(cameraError || poseError) && (
                        <div className="text-sm text-rose-300 bg-rose-900/40 border border-rose-700/50 rounded-lg p-2">
                            {cameraError || poseError}
                        </div>
                    )}

                    <main className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left: Camera + overlay */}
                        <div className="relative">
                            <CameraFeed videoRef={videoRef} ready={cameraReady} onStart={startCamera} onStop={stopCamera} />
                            <PoseOverlay2D videoRef={videoRef} pose={pose} />
                            <div className="absolute bottom-2 left-2">
                                <DebugHUD pose={pose} />
                            </div>
                        </div>

                        {/* Right: 3D pose view */}
                        <PoseViewer3D pose={pose} />
                    </main>

                    <footer className="pt-2 text-xs text-white/60">
                        <p>Next: wire BlazePose Tasks → smoothing → retarget to 3D rig.</p>
                    </footer>
                </div>
            </div>
        </PoseContext.Provider>
    );
};

export default App;
