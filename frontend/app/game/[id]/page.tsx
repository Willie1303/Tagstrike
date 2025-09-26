/*
  Jan-Willem Greyvenstein: 2023256304
  Tumelo Kasumba: 2023738970
*/

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getWebSocket } from "@/lib/websocket"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGameStore, Player } from "@/lib/store"
import "@tensorflow/tfjs-backend-webgl"
import { Zap, Heart, Users, Clock, Coins, Camera, CameraOff } from "lucide-react"
import * as tf from "@tensorflow/tfjs"
import { detectImage } from "./utils/detect"
import {hexToRgb, rgbToHex, Color} from "@/lib/utils"

export default function GamePage() {
  
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  const webSocket = getWebSocket(); 
  const websocket = getWebSocket();
  let videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [roomPlayers, setRoomPlayers] = useState<typeof players>([]);

  const [detectedColor, setDetectedColor] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string>("")
  const streamRef = useRef<MediaStream | null>(null);

  const players = useGameStore((state) => state.players);
  const { currentPlayer, setCurrentPlayer } = useGameStore();
  const setPlayers = useGameStore((state) => state.setPlayers);
  const setGameTime = useGameStore((state) => state.setGameTime);
  const shootPlayer = useGameStore((state) => state.shootPlayer);
  const healPlayer = useGameStore((state) => state.healPlayer);
  const shieldPlayer = useGameStore((state) => state.shieldPlayer);
  const gameTime = useGameStore((state) => state.gameTime);

  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [net,setNet]= useState<tf.GraphModel | null>(null);
  const [inputShape,setInputShape] = useState<any>(null)
  const [modelReady, setModelReady] = useState(false);
  let damageAmplifier = 1;

  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  
  const modelName = "yolov5n";
  const classThreshold = 0.5;
    
  // POWERUPS START
  const powerups = [
      { name: "Heal Pack", type: "heal", healAmount: 25, icon: "💚", color: "text-green-400" },
      { name: "Shield Boost", type: "shield", shieldAmount: 25, icon: "🛡️", color: "text-cyan-400" },
      { name: "Double Damage", type: "buff", multiplier: 2, duration: 30, icon: "⚔️", color: "text-yellow-400" },
      { name: "Resistance", type: "buff", damageReduction: 0.2, duration: 30, icon: "🛡️", color: "text-purple-400" }
    ];
  const weapons = [
      { name: "Space Pistol", damage: 10},
      { name: "AK-F7", damage: 20},
      { name: "Shotgun", damage: 30},
      { name: "Rocket Launcher", damage: 45},
    ];
  const [currentPowerup, setCurrentPowerup] = useState(powerups[0]);
  const [powerupTimer, setPowerupTimer] = useState(30);
  const [activeBuff, setActiveBuff] = useState<{
    name: string;
    type: string;
    multiplier?: number;
    damageReduction?: number;
    duration: number;
    remainingTime: number;
    icon: string;
    color: string;
  } | null>(null);
  const [currentWeapon, setCurrentWeapon] = useState(weapons[1]); 
  const [lastPowerupTime, setLastPowerupTime] = useState(0);
  const weaponRef = useRef(currentWeapon);

  // USE EFFECTS START
  useEffect(() => {
    websocket.emit("getRoomInfo",gameId);

    const handleUpdateRoom = (playersFromServer : typeof players)=>{
      useGameStore.getState().setPlayers(playersFromServer);
      setRoomPlayers(playersFromServer);
    }

    websocket.on("updateRoom", handleUpdateRoom);

     return () => {
        websocket.off("updateRoom", handleUpdateRoom);
      };
      }, [gameId])

  useEffect(() => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const checkDimensions = () => {
        console.log("Video dimensions:", {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
          canvasWidth: canvasRef.current?.width,
          canvasHeight: canvasRef.current?.height
        });
      };
      
      const interval = setInterval(checkDimensions, 5000);
      return () => clearInterval(interval);
    }
      }, [cameraActive]);

  useEffect(() => {
        tf.ready().then(async () => {
          const yolov5 = await tf.loadGraphModel(
            `/${modelName}_web_model/model.json`,
            {
              onProgress: (fractions) => {
                setLoading({ loading: true, progress: fractions });
              },
            }
          );
    
          setLoading({ loading: false, progress: 1 });
          setNet(yolov5);

          setInputShape(yolov5.inputs[0].shape);
          setModelReady(true);
        });
      }, []);

  useEffect(() => {
    }, [net, inputShape]);

  useEffect(() => {
    if (!gameId) return

    const interval = setInterval(() => {
      webSocket.emit(
        'getRoomInfo',
        gameId,
        (res: { success?: boolean; activePlayers?: any[]; error?: string }) => {
          if (res.error) {
            console.error('Failed to fetch room info:', res.error)
            return
          }
          if (res.success && Array.isArray(res.activePlayers)) {
            setPlayers(res.activePlayers)
            res.activePlayers.forEach((p) => {
              if (p.shotId === currentPlayer?.shotId) {
                setCurrentPlayer(p);
              }
            })
          }
        }
      )
    }, 2_000)

    return () => clearInterval(interval)
    }, [gameId, webSocket, setPlayers])

  useEffect(() => {
      const timer = setInterval(() => {
      setGameTime(Math.max(0, gameTime - 1));
    }, 1000);

    if (gameTime === 0) {
      router.push(`/stats`);
    }
    return () => clearInterval(timer);
      }, [gameTime, gameId, router, setGameTime]);

  /*    
  useEffect(() => {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
          })
          
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setCameraActive(true)
          }
        } catch (err) {
          console.error("Error accessing camera:", err)
        }
      }

      startCamera();

      if (cameraActive && videoRef.current && canvasRef.current && modelReady) {
        console.log("Camera, videoRef, and canvasRef are ready. Attaching click listener.")
        window.addEventListener('mousedown', scanUser);
      } else {
        console.log("Waiting for camera, videoRef, or canvasRef to be ready. Current state: ", {
          cameraActive,
          videoRefCurrent: videoRef.current,
          canvasRefCurrent: canvasRef.current
        });
      }

      return () => {
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
          tracks.forEach((track) => track.stop())
        }
        
        window.removeEventListener('mousedown', scanUser);
        console.log("Cleaning up camera and click listener.");
      }
      }, [cameraActive, videoRef, canvasRef,modelReady])*/

  // --- startCamera (no longer tries to set videoRef directly) ---
// Camera setup
  useEffect(() => {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
          })
          
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setCameraActive(true)
            // websocket.emit("playerReadyForStream", { gameId });
          }
        } catch (err) {
          console.error("Error accessing camera:", err)
        }
      }

      startCamera();

      if (cameraActive && videoRef.current && canvasRef.current && modelReady) {
        console.log("Camera, videoRef, and canvasRef are ready. Attaching click listener.")
        window.addEventListener('mousedown', scanUser);
      } else {
        console.log("Waiting for camera, videoRef, or canvasRef to be ready. Current state: ", {
          cameraActive,
          videoRefCurrent: videoRef.current,
          canvasRefCurrent: canvasRef.current
        });
      }

      return () => {
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
          tracks.forEach((track) => track.stop())
        }
        
        // Always remove the event listener on cleanup to prevent memory leaks
        window.removeEventListener('mousedown', scanUser);
        console.log("Cleaning up camera and click listener.");
      }
      }, [cameraActive, videoRef, canvasRef,modelReady])


useEffect(() => {
    if (!cameraActive || !streamRef.current || !websocket || !videoRef.current?.srcObject) return;
    
    const stream = streamRef.current;
    const peerConnections: { [id: string]: RTCPeerConnection } = {};
    
    console.log("Setting up WebRTC for game", gameId);
    
    // Tell server this player is ready to stream
    websocket.emit("playerReadyForStream", { gameId });

    // Handle spectator connection (hyphenated version)
    // In game.tsx - Fix the spectator connection handling
    const handleSpectatorConnected = async (spectatorId: string) => {
      console.log("Spectator connected:", spectatorId);

      const stream = streamRef.current;
      if (!stream || !stream.getTracks().length) {
        console.warn("No stream or tracks available at spectator connect");
        return; // Don't proceed without a valid stream
      }

      console.log("Stream details:", {
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        active: stream.active
      });

      try {
        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ],
        });

        if (!peerConnections[spectatorId]) {
          peerConnections[spectatorId] = peer;
        }

        // Add tracks BEFORE creating offer
        stream.getTracks().forEach(track => {
          console.log("Adding track to peer connection:", {
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            id: track.id
          });
          peer.addTrack(track, stream);
        });

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Sending ICE candidate to spectator:", spectatorId);
            websocket.emit("webrtcCandidate", {
              to: spectatorId,
              candidate: event.candidate,
            });
          }
        };

        // Monitor connection state
        peer.onconnectionstatechange = () => {
          console.log(`Connection state with spectator ${spectatorId}:`, peer.connectionState);
        };

        peer.oniceconnectionstatechange = () => {
          console.log(`ICE connection state with spectator ${spectatorId}:`, peer.iceConnectionState);
        };

        // Create and send offer
        const offer = await peer.createOffer({
          offerToReceiveAudio: false, // We're only sending, not receiving
          offerToReceiveVideo: false
        });
        
        await peer.setLocalDescription(offer);
        
        console.log("Sending offer to spectator:", spectatorId, "SDP:", offer.sdp?.substring(0, 100) + "...");
        
        websocket.emit("webrtcOffer", {
          to: spectatorId,
          from: websocket.id,
          sdp: offer,
          gameId,
        });
      } catch (err) {
        console.error("Failed to handle spectator connection:", err);
      }
    };

    // Handle request for offer (alternative method)
    const handleRequestOffer = async ({ spectatorId }: { spectatorId: string }) => {
      console.log("Offer requested by spectator:", spectatorId);
      await handleSpectatorConnected(spectatorId);
    };

    // Handle answer from spectator
    const handleWebRTCAnswer = async ({ answer, from }: {answer: RTCSessionDescriptionInit; from: string }) => {
      console.log("Received WebRTC answer from:", from);
      const peer = peerConnections[from];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("Successfully set remote description for spectator:", from);
        } catch (err) {
          console.error("Failed to set remote description:", err);
        }
      } else {
        console.warn("No peer connection found for spectator:", from);
      }
    };

    // Handle ICE candidates from spectator
    const handleWebRTCCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      console.log("Received ICE candidate from:", from);
      const peer = peerConnections[from];
      if (peer && candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Successfully added ICE candidate from spectator:", from);
        } catch (err) {
          console.error("Failed to add ICE candidate:", err);
        }
      }
    };

    // Register event listeners
    websocket.on("spectator-connected", handleSpectatorConnected);
    websocket.on("requestOffer", handleRequestOffer);
    websocket.on("webrtcAnswer", handleWebRTCAnswer);
    websocket.on("webrtcCandidate", handleWebRTCCandidate);

    return () => {
      console.log("Cleaning up game WebRTC connections");
      
      // // Close all peer connections
      Object.values(peerConnections).forEach(pc => {
        if (pc) {
          pc.close();
        }
      });
      
      // Remove event listeners
      websocket.off("spectator-connected", handleSpectatorConnected);
      websocket.off("requestOffer", handleRequestOffer);
      websocket.off("webrtcAnswer", handleWebRTCAnswer);
      websocket.off("webrtcCandidate", handleWebRTCCandidate);
    };
    }, [cameraActive, gameId, webSocket]);

// Separate useEffect for event listener
useEffect(() => {
  if (cameraActive && videoRef.current && canvasRef.current && modelReady) {
    window.addEventListener('mousedown', scanUser);
    return () => window.removeEventListener('mousedown', scanUser);
  }
}, [cameraActive, modelReady]);

  useEffect(() => {
    if (!cameraActive || !streamRef.current || !websocket || !videoRef.current?.srcObject) return;
    
    const stream = streamRef.current;
    const peerConnections: { [id: string]: RTCPeerConnection } = {};
    
    console.log("Setting up WebRTC for game", gameId);
    
    websocket.emit("playerReadyForStream", { gameId });

    const handleSpectatorConnected = async (spectatorId: string) => {
      console.log("Spectator connected:", spectatorId);

      const stream = streamRef.current;
      if (!stream || !stream.getTracks().length) {
        console.warn("No stream or tracks available at spectator connect");
        return;
      }

      try {
        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ],
        });

        if (!peerConnections[spectatorId]) {
          peerConnections[spectatorId] = peer;
        }

        stream.getTracks().forEach(track => {
          console.log("Adding track to peer connection:", {
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            id: track.id
          });
          peer.addTrack(track, stream);
        });

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Sending ICE candidate to spectator:", spectatorId);
            websocket.emit("webrtcCandidate", {
              to: spectatorId,
              candidate: event.candidate,
            });
          }
        };

        peer.onconnectionstatechange = () => {
          console.log(`Connection state with spectator ${spectatorId}:`, peer.connectionState);
        };

        peer.oniceconnectionstatechange = () => {
          console.log(`ICE connection state with spectator ${spectatorId}:`, peer.iceConnectionState);
        };

        const offer = await peer.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false
        });
        
        await peer.setLocalDescription(offer);
        
        console.log("Sending offer to spectator:", spectatorId);
        
        websocket.emit("webrtcOffer", {
          to: spectatorId,
          from: websocket.id,
          sdp: offer,
          gameId,
        });
      } catch (err) {
        console.error("Failed to handle spectator connection:", err);
      }
    };

    const handleRequestOffer = async ({ spectatorId }: { spectatorId: string }) => {
      console.log("Offer requested by spectator:", spectatorId);
      await handleSpectatorConnected(spectatorId);
    };

    const handleWebRTCAnswer = async ({ answer, from }: {answer: RTCSessionDescriptionInit; from: string }) => {
      console.log("Received WebRTC answer from:", from);
      const peer = peerConnections[from];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("Successfully set remote description for spectator:", from);
        } catch (err) {
          console.error("Failed to set remote description:", err);
        }
      } else {
        console.warn("No peer connection found for spectator:", from);
      }
    };

    const handleWebRTCCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      console.log("Received ICE candidate from:", from);
      const peer = peerConnections[from];
      if (peer && candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Successfully added ICE candidate from spectator:", from);
        } catch (err) {
          console.error("Failed to add ICE candidate:", err);
        }
      }
    };

    websocket.on("spectator-connected", handleSpectatorConnected);
    websocket.on("requestOffer", handleRequestOffer);
    websocket.on("webrtcAnswer", handleWebRTCAnswer);
    websocket.on("webrtcCandidate", handleWebRTCCandidate);

    return () => {
      console.log("Cleaning up game WebRTC connections");
      
      Object.values(peerConnections).forEach(pc => {
        if (pc) {
          pc.close();
        }
      });

      websocket.off("spectator-connected", handleSpectatorConnected);
      websocket.off("requestOffer", handleRequestOffer);
      websocket.off("webrtcAnswer", handleWebRTCAnswer);
      websocket.off("webrtcCandidate", handleWebRTCCandidate);
    };
    }, [cameraActive, gameId, webSocket]);

  useEffect(() => {
      const handleUpdateRoom = (playersFromServer : typeof players)=>{
        useGameStore.getState().setPlayers(playersFromServer);
      }

      webSocket.on("updateRoom", handleUpdateRoom);
      webSocket.on('endSession', () => router.push(`/stats`));
      webSocket.on('updateTimer', (timerVal) => {
        setGameTime(timerVal);
        
        if (timerVal%30==0 && timerVal > 0) {
          const randomWeapon = randomiseWeapon();
          setCurrentWeapon(randomWeapon);
        }

        if (timerVal % 60 === 0 && timerVal > 0 && timerVal !== lastPowerupTime) {
          setLastPowerupTime(timerVal);
          
          const randomPowerup = randomizePowerup();
          console.log(`Randomised powerup: ${randomPowerup.name}`);
          
          if (randomPowerup.type === "heal") {
            webSocket.emit("triggerEvent", {
              gameID: `${gameId}`,
              eventType: 1,
              eventData: {
                playerId: currentPlayer?.shotId,
                healAmount: randomPowerup.healAmount
              }
            });
          } else if (randomPowerup.type === "shield") {
            console.log(`Shield powerup: ${randomPowerup.name} (Shield: ${randomPowerup.shieldAmount})`);
          } else if (randomPowerup.type === "buff") {
            console.log(`New buff: ${randomPowerup.name}`);

            setActiveBuff({
              ...randomPowerup,
              remainingTime: randomPowerup.duration
            });
          }
        }
      });

      return () => {
        webSocket.off("updateRoom", handleUpdateRoom);
        webSocket.off('endSession',()=>{});
        webSocket.off('updateTimer',()=>{});
      };
      }, []);

  useEffect(() => {
    weaponRef.current = currentWeapon;
    console.log("Current weapon updated:", currentWeapon);
  }, [currentWeapon]);

  // FUNCTIONS
  const randomiseWeapon = () => {
    return weapons[Math.floor( Math.random() * weapons.length )];
  }

  const randomizePowerup = () => {
      const newPowerup = powerups[Math.floor(Math.random() * powerups.length)];
      setCurrentPowerup(newPowerup);
      setPowerupTimer(10);
      
      console.log(`New powerup acquired: ${newPowerup.name}`);
      
      if (newPowerup.type === 'buff') {
        setActiveBuff({
          ...newPowerup,
          remainingTime: newPowerup.duration
        });
      }
      
      return newPowerup;
    };

  const audioCtx = useRef(new (window.AudioContext || window.webkitAudioContext)());

  const loadAndPlaySound = async (url = "/sounds/pew.mp3") => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.current.decodeAudioData(arrayBuffer);

        const source = audioCtx.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.current.destination);
        source.start(0);
      } catch (err) {
        console.error("Failed to play sound:", err);
      }
    };

  async function scanUser() {
    if (weaponRef.current.name === "Knife") {
      await loadAndPlaySound("/sounds/knife.mp3");
    }else if (weaponRef.current.name === "Basic Pistol") {
      await loadAndPlaySound("/sounds/pew.mp3");
    }else if (weaponRef.current.name === "Shotgun") {
      await loadAndPlaySound("/sounds/shotgun.mp3");
    }else if (weaponRef.current.name === "Rocket Launcher") {
      await loadAndPlaySound("/sounds/rocket.mp3");
    }

    if (!cameraActive || !videoRef.current || !canvasRef.current || net == null) {
      console.log("Scan user - missing requirements:", {
        cameraActive,
        videoRef: !!videoRef.current,
        canvasRef: !!canvasRef.current,
        net: !!net
      });
      return;
    }

    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      console.log("Video not ready for OCR");
      return;
    }

    console.log("Starting detection with OCR...");
    
    detectImage(
      videoRef.current, 
      net, 
      inputShape, 
      classThreshold, 
      canvasRef.current,
      handlePlayerDetected
    );
  }

  const handlePlayerDetected = async (detectedColor:Color) => {
    if (!currentPlayer) return;

    console.log("Raw detected color:", detectedColor);

    const now = Date.now();
    const lastActionTime = Number.parseInt(localStorage.getItem("lastActionTime") || "0");

    if (now - lastActionTime < 800) return;

    try {
      if (!detectedColor || typeof detectedColor.r !== 'number' || 
          detectedColor.r < 0 || detectedColor.r > 255) {
        console.log("Invalid detected color:", detectedColor);
        return;
      }

      let roomColours = roomPlayers.map(player => player.shotId.toLowerCase());
      console.log("Room hex colors:", roomColours);

      let roomRGB = roomColours
        .map(color => hexToRgb(color))
        .filter((c) => c !== null);
      
      console.log("Room RGB colors:", roomRGB);

      if (roomRGB.length === 0) {
        console.log("No valid room colors found");
        return;
      }

      let closestColour = getClosestColorWithThreshold(detectedColor, roomRGB, 100);
      
      if (!closestColour) {
        console.log("No close color match found");
        setLastAction("No target found.");
        setTimeout(() => setLastAction(""), 1500);
        return;
      }
      
      let closestHex = rgbToHex(closestColour.r, closestColour.g, closestColour.b);
      console.log("Closest match:", closestColour, "->", closestHex);

      const matchedPlayer = roomPlayers.find(
        (player) => player.shotId.toLowerCase() === closestHex.toLowerCase()
      );

      if (matchedPlayer?.shotId === currentPlayer.shotId) {
        console.log("Cannot target yourself");
        setLastAction("Cannot target yourself!");
        setTimeout(() => setLastAction(""), 1500);
        return;
      }

      if (matchedPlayer) {
        console.log("Target acquired:", matchedPlayer.name);
        
        localStorage.setItem("lastActionTime", now.toString());

          let tempWeapon = weaponRef.current;
          tempWeapon.damage = Math.floor(tempWeapon.damage * (activeBuff?.multiplier || 1));
          console.log("Adjusted weapon damage:", tempWeapon.damage);

          webSocket.emit("triggerEvent", {
            gameID: `${gameId}`,
            eventType: 0,
            eventData: {
              shooter: currentPlayer.shotId,
              victim: matchedPlayer.shotId,
              weapon: tempWeapon
            }
          });

        console.log("Shoot event triggered for", matchedPlayer.name);
        setLastAction(`🎯 Shot ${matchedPlayer.name}!`);
      } else {
        console.log("No matching player found for color:", closestHex);
        setLastAction("❌ Target not found");
      }
    } catch (err) {
      console.error("Failed to process player detection:", err);
      setLastAction("⚠️ Detection error");
    }

    setTimeout(() => setLastAction(""), 2000);
  };

  function getClosestColorWithThreshold(
    targetColor:Color,
    colorList:Array<Color>,
    threshold = 100
  ) {
    if (!targetColor || !colorList || colorList.length === 0) {
      return null;
    }

    let closest = null;
    let minDistance = Infinity;

    console.log("Comparing target:", targetColor);

    for (const color of colorList) {
      if (!color || typeof color.r !== 'number') {
        continue;
      }

      const dr = targetColor.r - color.r;
      const dg = targetColor.g - color.g;
      const db = targetColor.b - color.b;
      
      const distance = Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
      
      console.log(`Distance to RGB(${color.r},${color.g},${color.b}): ${distance.toFixed(2)}`);

      if (distance < minDistance) {
        minDistance = distance;
        closest = color;
      }
    }

    console.log("Best match:", closest, "distance:", minDistance.toFixed(2));
    
    if (minDistance <= threshold) {
      return closest;
    }
    
    console.log("No color within threshold of", threshold);
    return null;
  }

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, "0")}`
    }

  const getColorIndicator = () => {
      switch (detectedColor) {
        case "red":
          return <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        case "green":
          return <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
        case "blue":
          return <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
        default:
          return <div className="w-4 h-4 bg-gray-500 rounded-full" />
      }
    }
    
    if (!currentPlayer) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>
    }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80">
      {/* Game HUD - Compact Header */}
      <header className="bg-card/90 backdrop-blur-md border-b border-border p-2 z-10">
        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-primary neon-glow">
              {formatTime(gameTime)}
            </div>
            <div className="text-xs text-muted-foreground">TIME</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-lg font-bold text-primary neon-glow">{currentPlayer.score}</span>
            </div>
            <div className="text-xs text-muted-foreground">SCORE</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold neon-glow text-[color:var(--neon-orange)]">
              {currentWeapon.name}
            </div>
            <div className="text-xs text-muted-foreground">WEAPON</div>
          </div>
        </div>
      </header>

      {/* Fullscreen Camera Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Fullscreen Camera Window */}
          <div className="w-full h-full bg-black relative overflow-hidden">
            
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-muted">
                <div className="text-center space-y-4">
                  <CameraOff className="w-20 h-20 text-muted-foreground mx-auto" />
                  <p className="text-lg text-muted-foreground">Camera Offline</p>
                  <p className="text-sm text-muted-foreground">Activate to scan for enemies</p>
                </div>
              </div>
          

            {/* Hidden canvas for detection */}
            <canvas ref={canvasRef}  />

            {/* Fullscreen HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-primary neon-glow">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full neon-glow"></div>
                  </div>
                </div>
              </div>

              {/* Corner brackets - Larger for fullscreen */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[color:var(--neon-cyan)] neon-glow"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[color:var(--neon-cyan)] neon-glow"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[color:var(--neon-cyan)] neon-glow"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[color:var(--neon-cyan)] neon-glow"></div>

              {/* Status text */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="text-sm font-bold text-[color:var(--neon-lime)] neon-glow bg-black/70 px-3 py-2 rounded">
                  {cameraActive ? "SCANNING..." : "CAMERA OFFLINE"}
                </div>
              </div>

              {/* Player Stats Overlay - Top Left */}
              <div className="absolute top-16 left-4">
                <div className="flex gap-3">
                  <div className="text-center bg-black/70 backdrop-blur-sm rounded-lg p-2 neon-border border-primary/30">
                    <div className="text-sm font-bold text-primary neon-glow">{currentPlayer.score}</div>
                    <div className="text-xs text-muted-foreground">SCORE</div>
                  </div>
                  <div className="text-center bg-black/70 backdrop-blur-sm rounded-lg p-2 neon-border border-red-500/30">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span className="text-sm font-bold text-red-500">{currentPlayer.health}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">HP</div>
                  </div>
                </div>
              </div>

              {/* Last Action Display - Top Right */}
              {lastAction && (
                <div className="absolute top-16 right-4">
                  <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-bold">
                    {lastAction}
                  </div>
                </div>
              )}

              {/* Color Detection Indicator - Bottom Right */}
              <div className="absolute bottom-20 right-4">
                <Card className="bg-black/70 border-gray-600">
                  <CardContent className="p-2">
                    <div className="flex items-center gap-2 text-white text-xs">
                      <span>{lastAction}:</span>
                      {getColorIndicator()}
                      <span className="capitalize">{detectedColor || "None"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weapon Info - Bottom Left */}
              <div className="absolute bottom-20 left-4">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 neon-border border-yellow-500/30">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-bold">{currentWeapon.name}</div>
                      <div className="text-xs">DMG: {currentWeapon.damage}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Red damage overlay */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "red",
                  opacity: 1 - (currentPlayer.health / 100),
                  pointerEvents: "none",
                  transition: "opacity 0.3s ease-in-out",
                  zIndex: 9999,
                }}
                className={currentPlayer.health < 30 ? "low-health" : ""}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Controls - Fixed Footer */}
      <footer className="bg-card/95 backdrop-blur-md border-t border-border p-3 z-10">
        <div className="space-y-3">
          {/* Powerup Timer */}
          <div className="flex items-center gap-2 justify-center">
            <Clock className="w-3 h-3" />
            <span className="text-xs">Next Powerup: {powerupTimer}s</span>
          </div>

          {/* Active Buff Display */}
          {activeBuff && (
            <div className="flex justify-center">
              <Badge variant="outline" className={`${activeBuff.color} border-current text-xs`}>
                {activeBuff.icon} {activeBuff.name}: {activeBuff.remainingTime}s
              </Badge>
            </div>
          )}

          {/* Shooting Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onMouseDown={scanUser}
              className="w-20 h-20 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground neon-glow flex flex-col items-center justify-center transition-all duration-150"
            >
              <Zap className="w-6 h-6" />
              <span className="text-xs font-bold mt-1">FIRE</span>
            </Button>

          </div>
        </div>

        {/* Exit Button */}
          {currentPlayer.isHost && (
            <div className="w-16 h-16 rounded-full neon-glow flex flex-col items-center justify-center">
              <Button onClick={() => {
                webSocket.emit('endGame', gameId);
                router.push(`/stats`);
            }} variant="destructive" className="w-full">
                End Game
              </Button>
            </div>
          )}

        {/* Death Overlay */}
        {!currentPlayer.isAlive && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <Card className="bg-red-900/90 border-red-600 p-8 text-center animate-pulse">
              <div className="text-white text-4xl font-bold mb-4">YOU ARE DEAD!</div>
              <CardContent className="text-red-200 text-lg">
                <p>Wait for the next round or for a revive.</p>
                <p className="mt-2">No more shooting for you.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </footer>
    </div>
  )
}