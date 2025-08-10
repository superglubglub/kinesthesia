import React from "react";
import { Canvas } from "@react-three/fiber";
import type { PoseResult } from "../../types/pose";
import DebugPosePoints from "./DebugPosePoints";

const PoseViewer3D: React.FC<{ pose: PoseResult | null; wireframe?: boolean }> = ({ pose, wireframe }) => {
    return (
        <div className="w-full h-full">
            <Canvas>
                <ambientLight intensity={0.6} />
                <pointLight position={[2, 3, 2]} />
                <DebugPosePoints pose={pose} wireframe={wireframe} />
            </Canvas>
        </div>
    );
};

export default PoseViewer3D;
