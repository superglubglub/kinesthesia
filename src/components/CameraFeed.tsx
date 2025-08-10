import React from "react";

type Props = {
    videoRef: React.RefObject<HTMLVideoElement>;
    ready: boolean;
    onStart: () => void;
    onStop: () => void;
    mirrored?: boolean;
};

const CameraFeed: React.FC<Props> = ({ videoRef, ready, onStart, onStop, mirrored }) => {
    return (
        <div className="relative w-full h-full">
            <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
                style={mirrored ? { transform: "scaleX(-1)" } : undefined}
            />
            {!ready ? (
                <div className="absolute inset-0 grid place-items-center">
                    <button onClick={onStart} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm">
                        Enable Camera
                    </button>
                </div>
            ) : (
                <div className="absolute top-2 right-2">
                    <button onClick={onStop} className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs">
                        Stop
                    </button>
                </div>
            )}
        </div>
    );
};

export default CameraFeed;