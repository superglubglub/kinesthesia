import type { PosePreset } from "./types";

export const SQUAT_PRESET: PosePreset = {
    name: "squat",
    joints: {
        hipFlexion:   { min: 70,  max: 110, target: 90, weight: 1.0 },
        kneeFlexion:  { min: 80,  max: 115, target: 100, weight: 1.0 },
        ankleDorsiflex:{ min: 10, max: 20,  target: 15, weight: 0.6 },
        torsoLean:    { min: 10,  max: 25,  target: 15, weight: 0.7 },
        pelvisTilt:   { min:  5,  max: 15,  target: 10, weight: 0.5 },
    },
    stance: {
        // distance between feet / body height
        footSeparationRatio: 0.22,
        toeOutDeg: 5,
    },
};