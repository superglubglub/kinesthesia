import React from "react";
import { Canvas } from "@react-three/fiber";
import type { PoseResult } from "../../types/pose";
import HumanoidRig from "./HumanoidRig";

const PoseViewer3D: React.FC<{ pose: PoseResult | null; wireframe?: boolean }> = ({ pose, wireframe }) => {
    return (
        <div className="w-full h-full">
            <Canvas>
                <ambientLight intensity={0.6} />
                <pointLight position={[2, 3, 2]} />
                <gridHelper args={[4, 8]} position={[0, -1, 0]} />
                <HumanoidRig url="/models/xbot.glb" pose={pose} wireframe={wireframe} mirrorX={false} slerp={0.35} />
            </Canvas>
        </div>
    );
};

export default PoseViewer3D;
