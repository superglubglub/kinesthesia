// src/retarget/retarget.ts
import { Bone, Object3D, Quaternion, Vector3 } from "three";
import type { PoseResult, Landmark } from "../types/pose";

export type BoneMap = Record<string, Bone>;

/** Bone → [fromIndex, toIndex] (BlazePose indices) or special keys */
export const BLAZE_TO_MIXAMO: Record<string, [number, number] | "SPINE" | "NECK"> = {
    LeftUpperArm: [11, 13],
    LeftForeArm:  [13, 15],
    RightUpperArm:[12, 14],
    RightForeArm: [14, 16],
    LeftUpLeg:    [23, 25],
    LeftLeg:      [25, 27],
    RightUpLeg:   [24, 26],
    RightLeg:     [26, 28],
    Spine: "SPINE",
    Neck:  "NECK",
};

// ---------- temps ----------
const _vA = new Vector3(), _vB = new Vector3(), _dir = new Vector3();
const _hipMid = new Vector3(), _shoMid = new Vector3();
const _qDelta = new Quaternion(), _qWorldTarget = new Quaternion(), _qLocal = new Quaternion(), _qParent = new Quaternion();
const _rootTarget = new Vector3(), _fwd = new Vector3(), _fwdProj = new Vector3();

// ---------- helpers ----------
function normToVec(lm: Landmark, out = new Vector3()) {
    return out.set((lm.x - 0.5) * 2, (0.5 - lm.y) * 2, -(lm.z ?? 0));
}
function worldToVec(lm: Landmark, scale = 1, out = new Vector3()) {
    return out.set(lm.x * scale, lm.y * scale, -lm.z * scale);
}
function isBone(o: Object3D): o is Bone { return (o as any).isBone === true; }
function findSkeletonRoot(bones: BoneMap): Object3D | null {
    const first = Object.values(bones)[0]; if (!first) return null;
    let p: Object3D = first; while (p.parent) p = p.parent; return p;
}

export class Retargeter {
    private bones: BoneMap;
    private root: Object3D;

    private restDirWorld: Record<string, Vector3> = {};
    private restWorldQuat: Record<string, Quaternion> = {};
    private haveCache = false;

    private scale = 1;         // used when worldLandmarks exist
    private groundY = -1;      // grid plane
    private baseRootQuat = new Quaternion(); // root orientation before dynamic yaw

    // Y-axis calibration (handles upside-down inputs)
    private ySign = 1;
    private yCalibrated = false;

    constructor(bones: BoneMap, root?: Object3D) {
        this.bones = bones;
        const hips = bones["Hips"] || (bones as any)["mixamorig:Hips"] || (bones as any)["RigHips"];
        this.root = root ?? (hips?.parent as Object3D | undefined) ?? findSkeletonRoot(bones) ?? new Object3D();
        this.baseRootQuat.copy(this.root.quaternion);
    }

    setRoot(root: Object3D) { this.root = root; this.baseRootQuat.copy(root.quaternion); }
    setGroundY(y: number) { this.groundY = y; }

    /** Cache bind-pose directions + world quats. Call after any one-time model rotations. */
    cacheRest() {
        if (this.haveCache) return;
        for (const name of Object.keys(BLAZE_TO_MIXAMO)) {
            const b = this.bones[name]; if (!b) continue;
            const child = b.children.find(isBone) as Bone | undefined; if (!child) continue;
            b.updateWorldMatrix(true, false); child.updateWorldMatrix(true, false);
            const bp = b.getWorldPosition(new Vector3()); const cp = child.getWorldPosition(new Vector3());
            this.restDirWorld[name] = cp.sub(bp).normalize().clone();
            this.restWorldQuat[name] = b.getWorldQuaternion(new Quaternion()).clone();
        }
        this.haveCache = true;
    }

    /** Shoulder-width scale (only meaningful for worldLandmarks). */
    calibrateScaleFromPose(pose: PoseResult) {
        const lms = pose.worldLandmarks ?? pose.landmarks; if (!lms?.length) return;
        const get = pose.worldLandmarks ? (i: number, o?: Vector3) => worldToVec(lms[i], 1, o)
            : (i: number, o?: Vector3) => normToVec(lms[i], o);
        const Ls = get(11, _vA), Rs = get(12, _vB);
        const poseShoulder = Ls.distanceTo(Rs) || 1;

        const Lb = this.bones["LeftShoulder"] || (this.bones as any)["mixamorig:LeftShoulder"] || (this.bones as any)["RigLeftShoulder"];
        const Rb = this.bones["RightShoulder"]|| (this.bones as any)["mixamorig:RightShoulder"]|| (this.bones as any)["RigRightShoulder"];
        if (Lb && Rb) {
            const Lbw = Lb.getWorldPosition(new Vector3()), Rbw = Rb.getWorldPosition(new Vector3());
            const rigShoulder = Lbw.distanceTo(Rbw) || 1; this.scale = rigShoulder / poseShoulder;
        }
    }

    /** Decide if incoming coords are Y-up or Y-down (shoulders should be above hips). */
    private calibrateYSign(getRaw: (i: number, o?: Vector3) => Vector3) {
        const lh = getRaw(23, new Vector3()), rh = getRaw(24, new Vector3());
        const hipMid = lh.add(rh).multiplyScalar(0.5);
        const ls = getRaw(11, new Vector3()), rs = getRaw(12, new Vector3());
        const shoMid = ls.add(rs).multiplyScalar(0.5);
        this.ySign = shoMid.y >= hipMid.y ? 1 : -1;
        this.yCalibrated = true;
    }

    /** Compute min Y of the rig feet in *world space* (after bone rotations). */
    private rigMinFootY(): number {
        const candidates = [
            "LeftToe","RightToe","LeftFoot","RightFoot",
            "LeftLeg","RightLeg","LeftUpLeg","RightUpLeg" // fallbacks
        ];
        let minY = Number.POSITIVE_INFINITY;
        for (const name of candidates) {
            const b = this.bones[name as keyof BoneMap]; if (!b) continue;
            const p = b.getWorldPosition(new Vector3());
            if (p.y < minY) minY = p.y;
        }
        // if nothing found, keep current root height
        return isFinite(minY) ? minY : this.root.getWorldPosition(new Vector3()).y;
    }

    /** Main step: place root (XZ + foot plant), compute root yaw, orient bones. Call every frame. */
    update(pose: PoseResult, opts: { slerp?: number; mirrorX?: boolean } = {}) {
        if (!pose.landmarks?.length) return;
        this.cacheRest();

        const slerp = opts.slerp ?? 0.35;

        // Choose coordinate space
        const useWorld = !!pose.worldLandmarks?.length;
        const baseGet = useWorld
            ? (i: number, o?: Vector3) => worldToVec(pose.worldLandmarks![i], this.scale, o)
            : (i: number, o?: Vector3) => normToVec(pose.landmarks[i], o);

        if (!this.yCalibrated) this.calibrateYSign(baseGet);

        const get = (i: number, o?: Vector3) => {
            const v = baseGet(i, o ?? new Vector3()); v.y *= this.ySign; return v;
        };

        // --- torso frame (sign/mirror applied) ---
        const lh = get(23, _vA), rh = get(24, _vB);
        _hipMid.copy(lh).add(rh).multiplyScalar(0.5);

        const ls = get(11, _vA), rs = get(12, _vB);
        _shoMid.copy(ls).add(rs).multiplyScalar(0.5);

        if (opts.mirrorX) { _hipMid.x *= -1; _shoMid.x *= -1; }

        // Root XZ follows hips smoothly (leave Y for foot plant)
        _rootTarget.set(_hipMid.x, this.root.position.y, _hipMid.z);
        this.root.position.lerp(_rootTarget, 0.4);

        // --- ROOT YAW from torso ---
        const up = _shoMid.clone().sub(_hipMid).normalize();       // up direction
        const right = rs.clone().sub(ls).normalize(); if (opts.mirrorX) right.x *= -1;
        _fwd.copy(up).cross(right).normalize();                    // forward ~ up × right
        _fwdProj.set(_fwd.x, 0, _fwd.z);
        if (_fwdProj.lengthSq() > 1e-6) {
            _fwdProj.normalize();
            const qYaw = new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), _fwdProj);
            const qTargetRoot = this.baseRootQuat.clone().multiply(qYaw);
            this.root.quaternion.slerp(qTargetRoot, 0.3);
        }

        // --- Bone orientations ---
        for (const [name, map] of Object.entries(BLAZE_TO_MIXAMO)) {
            const bone = this.bones[name]; if (!bone) continue;
            const restDir = this.restDirWorld[name]; const restWorldQ = this.restWorldQuat[name];
            if (!restDir || !restWorldQ) continue;

            let A: Vector3, B: Vector3;
            if (map === "SPINE") {
                A = _hipMid; B = _shoMid;
            } else if (map === "NECK") {
                A = _shoMid; B = get(0, _vB); if (opts.mirrorX) B.x *= -1;
            } else {
                const [ai, bi] = map;
                A = get(ai, _vA).clone(); B = get(bi, _vB).clone();
                if (opts.mirrorX) { A.x *= -1; B.x *= -1; }
            }

            _dir.copy(B).sub(A); if (_dir.lengthSq() < 1e-6) continue; _dir.normalize();
            _qDelta.setFromUnitVectors(restDir, _dir);
            _qWorldTarget.copy(restWorldQ).premultiply(_qDelta);

            const parent = bone.parent as Object3D | null; if (!parent) continue;
            parent.getWorldQuaternion(_qParent);
            _qLocal.copy(_qParent).invert().multiply(_qWorldTarget);
            bone.quaternion.slerp(_qLocal, slerp);
        }

        // --- FOOT PLANT (rig-based): after rotations, align feet to ground ---
        this.root.updateMatrixWorld(true);
        const minRigY = this.rigMinFootY();
        const dy = this.groundY - minRigY;
        this.root.position.y += dy * 0.5; // smooth a bit
    }
}