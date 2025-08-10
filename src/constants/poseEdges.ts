// Minimal set of BlazePose edges for a readable skeleton overlay.
// Indexes correspond to BlazePose 33-landmark format.

export const POSE_EDGES: Array<[number, number]> = [
    // Arms
    [11, 13], [13, 15],
    [12, 14], [14, 16],
    // Shoulders & hips
    [11, 12], [23, 24],
    // Torso
    [11, 23], [12, 24],
    // Legs
    [23, 25], [25, 27], [27, 31],
    [24, 26], [26, 28], [28, 32],
];
