import React from "react";
import type { PoseResult } from "../types/pose";

const DebugHUD: React.FC<{ pose: PoseResult | null }> = ({ pose }) => {
    return (
        <div className="text-xs text-white/80">
            <div>FPS: {pose?.fps?.toFixed?.(1) ?? "—"}</div>
            <div>Landmarks: {pose?.landmarks?.length ?? 0}</div>
            <div>Timestamp: {pose?.timestamp ? Math.round(pose.timestamp) : "—"}</div>
        </div>
    );
};

export default DebugHUD;
