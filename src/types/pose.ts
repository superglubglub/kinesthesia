// Shared pose types across hooks/components

export type Landmark = { x: number; y: number; z: number; visibility?: number };

export type PoseResult = {
    landmarks: Landmark[];        // normalized [0..1] x,y; z is model-relative depth
    worldLandmarks?: Landmark[];  // optional: world space landmarks if available
    timestamp: number;
    fps?: number;
};
