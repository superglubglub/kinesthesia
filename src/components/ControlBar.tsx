import React from "react";

type Props = {
    cameraReady: boolean;
    onCameraStart: () => void;
    onCameraStop: () => void;
    poseRunning: boolean;
    onPoseStart: () => void;
    onPoseStop: () => void;
};

const ControlBar: React.FC<Props> = ({
                                         cameraReady,
                                         onCameraStart,
                                         onCameraStop,
                                         poseRunning,
                                         onPoseStart,
                                         onPoseStop,
                                     }) => {
    return (
        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl ring-1 ring-white/10">
            {!cameraReady ? (
                <button onClick={onCameraStart} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-sm">
                    Start Camera
                </button>
            ) : (
                <button onClick={onCameraStop} className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-sm">
                    Stop Camera
                </button>
            )}

            {!poseRunning ? (
                <button onClick={onPoseStart} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-sm">
                    Start Pose
                </button>
            ) : (
                <button onClick={onPoseStop} className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm">
                    Stop Pose
                </button>
            )}
        </div>
    );
};

export default ControlBar;
