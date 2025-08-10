import React, { useMemo } from "react";
import type { PoseResult } from "../../types/pose";

const DebugPosePoints: React.FC<{ pose: PoseResult | null; wireframe?: boolean }> = ({ pose, wireframe }) => {
    const points = useMemo(() => {
        if (!pose?.landmarks) return [];
        return pose.landmarks.map((lm) => {
            const x = (lm.x - 0.5) * 2;
            const y = (0.5 - lm.y) * 2;
            const z = -((lm.z ?? 0));
            return [x, y, z] as [number, number, number];
        });
    }, [pose]);

    return (
        <group>
            <gridHelper args={[4, 8]} position={[0, -1, 0]} />
            {points.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.02, 12, 12]} />
                    <meshStandardMaterial wireframe={!!wireframe} />
                </mesh>
            ))}
        </group>
    );
};

export default DebugPosePoints;
