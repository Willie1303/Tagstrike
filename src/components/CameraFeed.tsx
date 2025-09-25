import React, { useEffect, useRef, useState } from "react";

const CameraFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request camera access automatically
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please allow camera access.");
      }
    };

    startCamera();

    // Cleanup: stop the camera when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array → runs once on mount

  return (
    <div>
      {error && <div className="text-danger">{error}</div>}
      <video ref={videoRef} autoPlay muted playsInline className="w-100 rounded" />
    </div>
  );
};

export default CameraFeed;
