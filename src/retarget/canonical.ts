// Normalizes rig-specific names (e.g., "RigLeftArm", "mixamorig:RightForearm")
// into canonical keys the retargeter expects (Hips, LeftUpperArm, LeftForeArm, ...).

export function canonicalizeBoneName(raw: string): string {
    // 1) Strip common prefixes/separators and normalize casing
    let n = raw
        .replace(/^mixamorig:/i, "")
        .replace(/^armature\|/i, "")
        .replace(/^mixamo/i, "")
        .replace(/^rig/i, "")            // <-- your rig: "RigLeftArm" -> "LeftArm"
        .replace(/[:|]/g, "");

    // Fix frequent case variants
    n = n.replace(/forearm/i, "ForeArm");

    // Capitalize first char to stabilize comparisons
    n = n.charAt(0).toUpperCase() + n.slice(1);

    // 2) Remap synonyms to canonical keys
    const remap: Record<string, string> = {
        // Core
        Hips: "Hips",
        Spine: "Spine",
        Spine1: "Spine1",
        Spine2: "Spine2",
        Neck: "Neck",
        Head: "Head",

        // Shoulders
        LeftShoulder: "LeftShoulder",
        RightShoulder: "RightShoulder",

        // Arms
        LeftArm: "LeftUpperArm",          // Mixamo sometimes uses "LeftArm"
        RightArm: "RightUpperArm",
        LeftUpperArm: "LeftUpperArm",
        RightUpperArm: "RightUpperArm",
        LeftForeArm: "LeftForeArm",
        RightForeArm: "RightForeArm",

        // Legs
        LeftUpLeg: "LeftUpLeg",
        RightUpLeg: "RightUpLeg",
        LeftLeg: "LeftLeg",
        RightLeg: "RightLeg",

        // Feet/Toes (not used yet, but handy)
        LeftFoot: "LeftFoot",
        RightFoot: "RightFoot",
        LeftToeBase: "LeftToe",
        RightToeBase: "RightToe",
    };

    return remap[n] ?? n;
}
