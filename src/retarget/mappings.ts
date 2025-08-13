// Bone → [fromIndex, toIndex] in BlazePose (33-landmark) space
export const BLAZE_TO_MIXAMO: Record<string, [number, number]> = {
    LeftUpperArm: [11, 13],
    LeftForeArm: [13, 15],
    RightUpperArm: [12, 14],
    RightForeArm: [14, 16],
    LeftUpLeg: [23, 25],
    LeftLeg: [25, 27],
    RightUpLeg: [24, 26],
    RightLeg: [26, 28],
    Spine: [-1, -2],   // use hipMid → shoulderMid (see util)
    Neck: [-2, 0],     // shoulderMid → nose
};
