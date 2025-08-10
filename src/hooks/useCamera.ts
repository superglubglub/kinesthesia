import { useCallback, useRef, useState } from "react";

export function useCamera() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const start = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setReady(true);
            }
        } catch (e: any) {
            setError(e?.message ?? "Unable to access camera");
        }
    }, []);

    const stop = useCallback(() => {
        const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks() ?? [];
        tracks.forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setReady(false);
    }, []);

    return { videoRef, ready, error, start, stop };
}
