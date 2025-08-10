import React, { createContext } from "react";
import type { PoseResult } from "../types/pose";

export type PoseContextValue = {
    pose: PoseResult | null;
    setPose: React.Dispatch<React.SetStateAction<PoseResult | null>>;
};

export const PoseContext = createContext<PoseContextValue>({
    pose: null,
    setPose: () => {},
});
