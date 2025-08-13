// src/components/three/HumanoidRig.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Bone, Object3D, Material, Mesh, Group, Vector3 as TVector3 } from "three";
import { Vector3 } from "three";
import type { PoseResult } from "../../types/pose";
import { canonicalizeBoneName } from "../../retarget/canonical";
import { Retargeter, type BoneMap, BLAZE_TO_MIXAMO } from "../../retarget/retarget";

type Props = {
    url?: string;                  // GLB path
    pose: PoseResult | null;       // BlazePose result
    wireframe?: boolean;
    mirrorX?: boolean;
    slerp?: number;                // 0..1 smoothing for bone slerp
    showHelpers?: boolean;         // axes + hip marker
    groundY?: number;
};

function isBone(o: Object3D): o is Bone { return (o as any).isBone === true; }
function isMesh(o: Object3D): o is Mesh { return (o as any).isMesh === true; }
function materialsOf(mesh: Mesh): Material[] {
    const m = mesh.material as Material | Material[];
    return Array.isArray(m) ? m : [m];
}
function hasWireframe(m: Material): m is Material & { wireframe: boolean } {
    return "wireframe" in (m as object);
}

export default function HumanoidRig({
                                        url = "/models/xbot.glb",
                                        pose,
                                        wireframe = false,
                                        mirrorX = false,
                                        slerp = 0.35,
                                        showHelpers = true,
                                        groundY = -1,
                                    }: Props) {
    // A wrapper whose origin we set to the hip. This becomes the retarget "root".
    const hipRootRef = useRef<Group>(null);
    const { scene } = useGLTF(url) as unknown as { scene: Object3D };
    const [rigReady, setRigReady] = useState(false);
    const calibratedRef = useRef(false);

    // Canonical bone map (normalize names like "RigLeftArm" → "LeftUpperArm")
    const bones: BoneMap = useMemo(() => {
        const raw: Record<string, Bone> = {};
        scene.traverse((o: Object3D) => { if (isBone(o)) raw[o.name] = o; });

        const map: BoneMap = {};
        for (const [rawName, bone] of Object.entries(raw)) {
            const canon = canonicalizeBoneName(rawName);
            if (!map[canon]) map[canon] = bone;
        }
        if (!map["Spine"] && map["Spine1"]) map["Spine"] = map["Spine1"];
        return map;
    }, [scene]);

    // Diagnostics: ensure we have expected bones
    useEffect(() => {
        const missing = Object.keys(BLAZE_TO_MIXAMO).filter((k) => !bones[k]);
        if (missing.length) console.warn("[Rig] Missing bones:", missing);
    }, [bones]);

    // Toggle wireframe safely
    useEffect(() => {
        scene.traverse((o: Object3D) => {
            if (isMesh(o)) for (const mat of materialsOf(o)) if (hasWireframe(mat)) mat.wireframe = wireframe;
        });
    }, [scene, wireframe]);

    const retargeter = useMemo(() => new Retargeter(bones), [bones]);

    useEffect(() => {
        const hipRoot = hipRootRef.current;
        const hips = bones["Hips"] || bones["mixamorig:Hips"];
        if (!hipRoot || !hips) return;

        if (scene.parent !== hipRoot) hipRoot.add(scene);

        // Face forward; hipRoot becomes the world transform we move
        hipRoot.rotation.set(0, 0, 0);

        // Recenter: put hip bone at hipRoot origin
        hipRoot.updateMatrixWorld(true);
        const hipWorld = new Vector3();
        hips.getWorldPosition(hipWorld);
        const hipLocalToScene = scene.worldToLocal(hipWorld.clone());
        scene.position.sub(hipLocalToScene);

        hipRoot.updateMatrixWorld(true);
        retargeter.setRoot(hipRoot);
        retargeter.setGroundY(groundY);
        retargeter.cacheRest();

        setRigReady(true);
    }, [bones, scene, retargeter, groundY]);

    // Calibrate scale once when we have a real pose
    useEffect(() => {
        if (!rigReady || !pose || calibratedRef.current) return;
        retargeter.calibrateScaleFromPose(pose);
        calibratedRef.current = true;
    }, [rigReady, pose, retargeter]);

    // Drive the rig only when both pose and rig are ready
    useFrame(() => {
        if (!rigReady || !pose) return;
        retargeter.update(pose, { slerp, mirrorX });
    });

    // --- Alignment helpers (hip axes + small hip marker + up arrow) ---
    const helpers = showHelpers ? (
        <group>
            {/* Axes at the hip origin (X=red,Y=green,Z=blue) */}
            <axesHelper args={[0.25]} />
            {/* Tiny sphere exactly at the hip origin */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshStandardMaterial />
            </mesh>
            {/* Optional up-arrow line for quick orientation sanity */}
            <Line
                points={[
                    [0, 0, 0],
                    [0, 0.4, 0],
                ]}
                lineWidth={1.5}
                dashed={false}
            />
        </group>
    ) : null;

    return (
        <group ref={hipRootRef} /* hip-root: origin == hip */>
            {helpers}
            <primitive object={scene} dispose={null} />
        </group>
    );
}

// Preload a default to avoid a first-frame hitch
useGLTF.preload("/models/xbot.glb");
