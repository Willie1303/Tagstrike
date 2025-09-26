// Tumelo Kasumba : 2023738970
// Jan-Willem Greyvenstein : 2023256304

import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { detectImage } from "../pages/utils/detect";
 // your detectImage function
import { COCO_CLASSES } from "../pages/utils/labels"; // the array you pasted earlier

type CameraFeedProps = {
  onPlayerDetected?: (color: { r: number; g: number; b: number }) => void;
};


const CameraFeed: React.FC<CameraFeedProps> = ({ onPlayerDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<tf.GraphModel | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const net = await tf.loadGraphModel("/models/yolov5s_web_model/model.json"); 
        setModel(net);
      } catch (err) {
        console.error("Model load error:", err);
        setError("Failed to load detection model.");
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // back camera on mobile
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please allow access.");
      }
    };
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  // Detection loop
  useEffect(() => {
    let animationId: number;
    const runDetection = async () => {
      if (
        model &&
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.readyState === 4
      ) {
        await detectImage(
          videoRef.current,
          model,
          model.inputs[0].shape as number[], // [1, 640, 640, 3]
          0.5, // threshold
          canvasRef.current,
          onPlayerDetected
        );
      }
      animationId = requestAnimationFrame(runDetection);
    };

    if (model) runDetection();

    return () => cancelAnimationFrame(animationId);
  }, [model, onPlayerDetected]);

  return (
    <div style={{ position: "relative" }}>
      {error && <div className="text-danger">{error}</div>}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-100 rounded"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        className="w-100 rounded"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
};

export default CameraFeed;
