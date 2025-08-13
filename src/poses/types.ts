export type JointRange = { min: number; max: number; target?: number; weight?: number };
export type PosePreset = {
    name: string;
    joints: {
        // flexions in degrees; right/left symmetric unless overridden
        hipFlexion: JointRange;   // both hips
        kneeFlexion: JointRange;
        ankleDorsiflex: JointRange;
        torsoLean: JointRange;    // forward from vertical
        pelvisTilt: JointRange;   // anterior +
        left?: Partial<PosePreset["joints"]>;
        right?: Partial<PosePreset["joints"]>;
    };
    stance?: { footSeparationRatio?: number; toeOutDeg?: number };
};
