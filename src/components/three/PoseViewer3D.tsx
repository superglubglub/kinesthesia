import React from "react";
import { Canvas } from "@react-three/fiber";
import type { PoseResult } from "../../types/pose";
import DebugPosePoints from "./DebugPosePoints";

/**
 * Future: replace DebugPosePoints with a rigged glTF avatar + retargeting.
 */
const PoseViewer3D: React.FC<{ pose: PoseResult | null }> = ({ pose }) => {
    return (
        <div className="w-full aspect-video bg-black/80 rounded-2xl overflow-hidden ring-1 ring-white/10">
            <Canvas>
                <ambientLight intensity={0.6} />
                <pointLight position={[2, 3, 2]} />
                <DebugPosePoints pose={pose} />
            </Canvas>
        </div>
    );
};

export default PoseViewer3D;