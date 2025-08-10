import React from "react";

type Props = {
    videoRef: React.RefObject<HTMLVideoElement>;
    ready: boolean;
    onStart: () => void;
    onStop: () => void;
};

const CameraFeed: React.FC<Props> = ({ videoRef, ready, onStart, onStop }) => {
    return (
        <div className="relative w-full aspect-video bg-black/80 rounded-2xl overflow-hidden ring-1 ring-white/10">
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
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
