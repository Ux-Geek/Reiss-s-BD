import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html, RoundedBox, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Download, BookOpen, PartyPopper, Lightbulb, Music2, Volume2, VolumeX, Sparkles, Star } from "lucide-react";
import * as THREE from "three";
import confetti from "canvas-confetti";

// A spectacular, premium Unsplash portrait of a smiling black man with headphones around his neck
const PERSON_IMAGE = "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=600&auto=format&fit=crop";

// Web Audio API engine for premium birthday chimes and theater hum
class BirthdayAudioEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  public isMuted: boolean = true;

  constructor() {
    // Lazy initialized on user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    this.initCtx();
    if (this.masterVolume && this.ctx) {
      const targetGain = muted ? 0 : 0.25;
      this.masterVolume.gain.setValueAtTime(this.masterVolume.gain.value, this.ctx.currentTime);
      this.masterVolume.gain.exponentialRampToValueAtTime(targetGain + 0.0001, this.ctx.currentTime + 0.4);
    }
  }

  // Play a beautiful, resonant bell sound for chimes
  public playChime(freq: number, type: "sine" | "triangle" | "sine" = "sine", delay: number = 0) {
    this.initCtx();
    if (this.isMuted || !this.ctx || !this.masterVolume) return;

    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(freq / 2, ctx.currentTime + delay); // Rich lower octave

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.05); // quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 1.2); // long decay

    osc.connect(gainNode);
    subOsc.connect(gainNode);
    gainNode.connect(this.masterVolume);

    osc.start(ctx.currentTime + delay);
    subOsc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 1.3);
    subOsc.stop(ctx.currentTime + delay + 1.3);
  }

  // Soft theater spotlight hum trigger
  public playClickBeep() {
    this.playChime(587.33, "triangle"); // D5 tone
  }

  // Play a customized "Happy Birthday" chime melody
  public playHappyBirthdayChimes() {
    const notes = [
      261.63, 261.63, 293.66, 261.63, 349.23, 329.63, // Happy birthday to you
      261.63, 261.63, 293.66, 261.63, 392.00, 349.23, // Happy birthday to you
      261.63, 261.63, 523.25, 440.00, 349.23, 329.63, 293.66, // Happy birthday dear Reiss
      466.16, 466.16, 440.00, 349.23, 392.00, 349.23  // Happy birthday to you
    ];
    const sequence = [
      { note: 0, dur: 0.3 }, { note: 0, dur: 0.15 }, { note: 1, dur: 0.4 }, { note: 0, dur: 0.4 }, { note: 4, dur: 0.4 }, { note: 5, dur: 0.8 },
      { note: 0, dur: 0.3 }, { note: 0, dur: 0.15 }, { note: 1, dur: 0.4 }, { note: 0, dur: 0.4 }, { note: 10, dur: 0.4 }, { note: 4, dur: 0.8 },
      { note: 0, dur: 0.3 }, { note: 0, dur: 0.15 }, { note: 12, dur: 0.4 }, { note: 13, dur: 0.4 }, { note: 4, dur: 0.4 }, { note: 5, dur: 0.4 }, { note: 1, dur: 0.8 },
      { note: 19, dur: 0.3 }, { note: 19, dur: 0.15 }, { note: 13, dur: 0.4 }, { note: 4, dur: 0.4 }, { note: 10, dur: 0.4 }, { note: 4, dur: 0.8 }
    ];

    let currentDelay = 0;
    sequence.forEach((item) => {
      this.playChime(notes[item.note], "sine", currentDelay);
      currentDelay += item.dur * 1.5;
    });
  }
}

const audio = new BirthdayAudioEngine();

// 3D Curtain component that sweeps outward dynamically
function StageCurtain({ side = "left" as "left" | "right", open = false }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const targetX = side === "left" ? (open ? -4.8 : -1.55) : open ? 4.8 : 1.55;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.055);
    // Slight wavy rotate-out behavior to look like hanging heavy velvet curtains
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, side === "left" ? (open ? -0.12 : -0.01) : (open ? 0.12 : 0.01), 0.04);
  });

  const folds = useMemo(() => Array.from({ length: 11 }, (_, i) => i), []);

  return (
    <group ref={ref} position={[side === "left" ? -1.55 : 1.55, 0.2, 0.45]}>
      {/* Heavy base curtain slab */}
      <RoundedBox args={[3.3, 5.9, 0.16]} radius={0.06} smoothness={4} name={`curtain-base-${side}`}>
        <meshStandardMaterial color="#42000e" roughness={0.85} metalness={0.05} />
      </RoundedBox>
      {/* Rich decorative overlay pleats to look genuinely organic */}
      {folds.map((fold) => (
        <mesh key={fold} position={[-1.5 + fold * 0.3, 0, 0.1]} name={`curtain-fold-${side}-${fold}`}>
          <cylinderGeometry args={[0.02, 0.06, 5.95, 12]} />
          <meshStandardMaterial color={fold % 2 ? "#5e0018" : "#2d000a"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Top theatrical drapes for premium elegance
function TopDrapes() {
  return (
    <group position={[0, 2.95, 0.55]}>
      <RoundedBox args={[8.4, 0.42, 0.25]} radius={0.12} smoothness={6} name="top-drape-base">
        <meshStandardMaterial color="#30000a" roughness={0.8} metalness={0.05} />
      </RoundedBox>
      {/* Curved curtain scallops */}
      {[-3.6, -2.8, -2.0, -1.2, -0.4, 0.4, 1.2, 2.0, 2.8, 3.6].map((x, i) => (
        <mesh key={x} position={[x, -0.16 - Math.sin(i * 0.5) * 0.06, 0.12]} rotation={[0, 0, Math.sin(i * 0.5) * 0.08]} name={`top-drape-scallop-${i}`}>
          <sphereGeometry args={[0.36, 20, 16]} />
          <meshStandardMaterial color={i % 2 ? "#5c0018" : "#3d0012"} roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

// Safe Loading Spinner visible in 3D Canvas
function CanvasLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-4 bg-black/60 px-8 py-6 rounded-2xl border border-[#f7d9a1]/25 backdrop-blur-md min-w-[200px]" id="canvas-loader-overlay">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f7d9a1] border-t-transparent" />
        <div className="flex flex-col items-center gap-1">
          <p className="font-serif italic text-[#f7d9a1] text-md">Lighting Stage...</p>
          <span className="font-mono text-[9px] tracking-widest text-zinc-400 uppercase">Interactive Theatre v1.0</span>
        </div>
      </div>
    </Html>
  );
}

// Portrait frame housing Reiss's photo
function PersonPortrait() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(PERSON_IMAGE, (loadedTexture) => {
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.minFilter = THREE.LinearFilter;
      setTexture(loadedTexture);
    });
  }, []);

  return (
    <group position={[0, 0.35, 0.1]}>
      {/* Royal Gold backdrop frame */}
      <RoundedBox args={[2.7, 3.35, 0.16]} radius={0.15} smoothness={8} name="golden-outer-frame">
        <meshStandardMaterial color="#bc944c" roughness={0.25} metalness={0.65} />
      </RoundedBox>
      {/* Deep velvet interior frame shadow box */}
      <RoundedBox args={[2.54, 3.18, 0.14]} radius={0.12} smoothness={8} name="velvet-inner-frame">
        <meshStandardMaterial color="#1f0308" roughness={0.6} metalness={0.15} />
      </RoundedBox>
      {/* Photographic portrait panel */}
      <mesh position={[0, 0, 0.09]} name="portrait-photo-mesh">
        <planeGeometry args={[2.36, 3.0]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.3} metalness={0.05} />
        ) : (
          <meshStandardMaterial color="#210108" roughness={0.8} metalness={0.1} />
        )}
      </mesh>
      
      {/* Framing labels inside the portrait box */}
      <group position={[0, -1.68, 0.15]}>
        <Text position={[0, 0, 0]} fontSize={0.16} letterSpacing={0.08} anchorX="center" color="#fcd99a" font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZtuNXEI8gTe25vK_eO2VVMb_.woff">
          CELEBRATING REISS
        </Text>
      </group>
    </group>
  );
}

// Stage lights moving smoothly around and changing focus state
function StageLights({ activeLight, onSelectLight }: { activeLight: number; onSelectLight: (id: number) => void }) {
  const left = useRef<THREE.Group>(null);
  const centre = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Swivels left/right softly to simulate authentic stage mechanics
    if (left.current) left.current.rotation.y = -0.45 + Math.sin(t * 0.7) * 0.05;
    if (centre.current) centre.current.rotation.y = Math.sin(t * 0.6) * 0.05;
    if (right.current) right.current.rotation.y = 0.45 + Math.sin(t * 0.85) * 0.05;
  });

  const lights = [
    { id: 0, ref: left, x: -2.4, rot: -0.4, color: "#ffd58a" },
    { id: 1, ref: centre, x: 0, rot: 0, color: "#fff3cf" },
    { id: 2, ref: right, x: 2.4, rot: 0.4, color: "#ffb5c5" },
  ];

  return (
    <group>
      {lights.map((l) => {
        const isActive = activeLight === l.id;
        return (
          <group
            key={l.id}
            ref={l.ref}
            position={[l.x, -2.1, 1.1]}
            rotation={[0.2, l.rot, 0]}
            name={`spotlight-group-${l.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLight(l.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            {/* The physical spotLight source casting actual 3D light onto the portrait backdrop */}
            <spotLight
              position={[0, 0.25, 0]}
              target-position={[0, 1.6, -1.5]}
              intensity={isActive ? 35 : 5}
              angle={0.4}
              penumbra={0.8}
              color={l.color}
              distance={9.5}
            />
            {/* Spotlight chassis geometry */}
            <mesh rotation={[Math.PI / 2, 0, 0]} name={`spotlight-cyl-${l.id}`}>
              <cylinderGeometry args={[0.18, 0.26, 0.45, 16]} />
              <meshStandardMaterial color="#2d2d2d" roughness={0.35} metalness={0.7} />
            </mesh>
            {/* Atmospheric light-beam volume cone */}
            <mesh position={[0, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]} name={`spotlight-cone-${l.id}`}>
              <coneGeometry args={[0.28, 1.4, 24, 1, true]} />
              <meshBasicMaterial color={l.color} transparent opacity={isActive ? 0.22 : 0.04} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Falling celebratory Ribbons (Confetti flakes)
function Ribbons({ burst }: { burst: number }) {
  const ribbons = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: -3.8 + Math.random() * 7.6,
        y: 3.5 + Math.random() * 2.5,
        z: -0.3 + Math.random() * 1.5,
        speed: 0.005 + Math.random() * 0.015,
        sizeX: 0.03 + Math.random() * 0.03,
        sizeY: 0.2 + Math.random() * 0.2,
        rotSpeed: 0.01 + Math.random() * 0.04,
        color: ["#f7d9a1", "#9d0023", "#ffdca3", "#da9b42", "#ffffff"][i % 5],
      })),
    // Reset or reshuffle on ribbonBurst trigger
    [burst]
  );

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const rib = ribbons[i];
      if (!rib) return;
      // Accelerate if a massive confetti burst happened
      child.position.y -= rib.speed * (burst > 0 ? 5 : 2.2);
      child.rotation.z += rib.rotSpeed;
      child.rotation.x += rib.rotSpeed * 0.5;
      
      // Recycle fall
      if (child.position.y < -2.6) {
        child.position.y = 3.8 + Math.random();
      }
    });
  });

  return (
    <group ref={groupRef}>
      {ribbons.map((r, i) => (
        <mesh key={`${burst}-${i}`} position={[r.x, r.y, r.z]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]} name={`ribbon-flake-${i}`}>
          <boxGeometry args={[r.sizeX, r.sizeY, 0.008]} />
          <meshStandardMaterial color={r.color} roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Complete 3D Scene layout
function BirthdayScene({ curtainsOpen, activeLight, ribbonBurst, onSelectLight }: { curtainsOpen: boolean; activeLight: number; ribbonBurst: number; onSelectLight: (id: number) => void }) {
  return (
    <div className="absolute inset-0 h-full w-full" id="theatre-canvas-container">
      <Canvas camera={{ position: [0, 0.4, 7.0], fov: 38 }} eventSource={document.getElementById("theatre-canvas-container") || undefined}>
        <color attach="background" args={["#080306"]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[0, 4.5, 4.8]} intensity={1.2} color="#fcead4" />
        
        <Suspense fallback={<CanvasLoader />}>
          {/* Night environment light preset */}
          <Environment preset="night" />

          <group position={[0, -0.2, 0]}>
            {/* The base stage floor stage deck */}
            <mesh position={[0, -2.4, 0]} rotation={[-Math.PI / 2, 0, 0]} name="stage-deck-floor">
              <cylinderGeometry args={[4.4, 4.75, 0.42, 64]} />
              <meshStandardMaterial color="#21000b" roughness={0.7} metalness={0.2} />
            </mesh>

            {/* Stage bottom golden safety lip */}
            <mesh position={[0, -2.18, 0.02]} rotation={[-Math.PI / 2, 0, 0]} name="stage-deck-golden-lip">
              <cylinderGeometry args={[4.42, 4.44, 0.05, 64]} />
              <meshStandardMaterial color="#c29a4f" roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Back wooden wall stage flats */}
            <mesh position={[0, 0.15, -0.25]} name="back-stage-wall">
              <planeGeometry args={[9.0, 6.0]} />
              <meshStandardMaterial color="#0b0205" roughness={0.9} />
            </mesh>

            <TopDrapes />
            <PersonPortrait />
            <StageLights activeLight={activeLight} onSelectLight={onSelectLight} />
            <Ribbons burst={ribbonBurst} />
            
            <StageCurtain side="left" open={curtainsOpen} />
            <StageCurtain side="right" open={curtainsOpen} />
          </group>

          <ContactShadows position={[0, -2.55, 0]} opacity={0.5} scale={7.2} blur={2.5} far={4} />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={1.2} maxPolarAngle={1.65} minAzimuthAngle={-0.4} maxAzimuthAngle={0.4} />
      </Canvas>
    </div>
  );
}

export default function BirthdayStageLanding() {
  const [introDone, setIntroDone] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [activeLight, setActiveLight] = useState(1);
  const [ribbonBurst, setRibbonBurst] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showNotification, setShowNotification] = useState("");

  // Trigger audio mute state matching local component state
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMute(nextMuted);
    if (!nextMuted) {
      audio.playHappyBirthdayChimes();
      triggerToast("🎵 Playing Golden Chimes theme!");
    } else {
      triggerToast("🔇 Sound muted");
    }
  };

  const triggerToast = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification((curr) => curr === msg ? "" : curr);
    }, 3800);
  };

  // Spectacular confetti trigger which pops particles on screen coordinate
  const handleConfetti = async () => {
    setRibbonBurst((n) => n + 1);
    audio.playClickBeep();
    
    // Core confetti explosion
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.72 },
      colors: ["#bc944c", "#9d0023", "#ffffff", "#ffdca3"],
    });

    // Side synchronized fan sprays
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 110,
        angle: 60,
        origin: { x: 0.15, y: 0.4 },
        colors: ["#bc944c", "#ffdca3"],
      });
      confetti({
        particleCount: 80,
        spread: 110,
        angle: 120,
        origin: { x: 0.85, y: 0.4 },
        colors: ["#bc944c", "#ffdca3"],
      });
    }, 150);

    triggerToast("✨ Confetti burst exploded!");
  };

  const handleSpotlightSelect = (id: number) => {
    setActiveLight(id);
    audio.playClickBeep();
    triggerToast(`🔦 Spotlight ${id + 1} focused`);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#080306] text-white font-sans selection:bg-[#bc944c]/30" id="main-birthday-landing">
      {/* 3D Theatre back stage canvas */}
      <BirthdayScene curtainsOpen={curtainsOpen} activeLight={activeLight} ribbonBurst={ribbonBurst} onSelectLight={handleSpotlightSelect} />

      {/* Elegant Header / Top Navigation utilities bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" id="theatre-nav-bar">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#bc944c] to-[#9d0023] p-[1px] shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#080306]">
              <Star className="text-[#bc944c] h-5 w-5 fill-[#bc944c]" />
            </div>
          </div>
          <div>
            <h2 className="font-serif italic text-lg tracking-wide text-white flex items-center gap-1.5 leading-none">
              Theatre Royal <span className="text-[10px] text-[#bc944c] font-sans font-semibold tracking-normal uppercase border border-[#bc944c]/40 px-1 rounded">VIP</span>
            </h2>
            <p className="font-mono text-[9px] text-[#bc944c]/80 tracking-widest mt-0.5 text-left">EST. 2026</p>
          </div>
        </div>

        {/* Ambient Synthesizer Audio Controller button */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium border transition duration-300 shadow-md ${
              !isMuted
                ? "bg-[#bc944c]/20 border-[#bc944c] text-white"
                : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/20"
            }`}
            id="audio-synth-toggle-btn"
            aria-label="Toggle ambient chimes"
          >
            {!isMuted ? (
              <>
                <Volume2 size={14} className="animate-bounce text-[#bc944c]" />
                <span className="font-mono tracking-wider">CHIMES ON</span>
              </>
            ) : (
              <>
                <VolumeX size={14} />
                <span className="font-mono tracking-wider">CHIME SYNTH</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Atmospheric Intro Curtain Slate, slides open on load gesture */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#070104]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.85, ease: "easeInOut" } }}
            onAnimationComplete={() => {
              // Wait short moment then raise/open curtains
              setTimeout(() => {
                setIntroDone(true);
                setCurtainsOpen(true);
              }, 400);
            }}
            id="elegant-curtain-intro"
          >
            {/* Consecutive Word-by-Word Birthday Text Reveal */}
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-4 items-center justify-center px-6 mb-4">
              {["Happy", "Birthday", "Reiss"].map((word, i) => (
                <motion.span
                  key={i}
                  className="font-serif text-5xl md:text-8xl italic tracking-tight text-[#fcd798] leading-none"
                  style={{ textShadow: "0 0 35px rgba(252,215,152,0.4)" }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.95,
                    delay: 0.3 + i * 0.55,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </div>

            <motion.p
              className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#bc944c]/70 mt-6 max-w-sm text-center font-light leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.7 }}
            >
              Click to Open Royal Stage
            </motion.p>

            <motion.button
              onClick={() => {
                // Instantly unlock AudioContext on standard user gesture
                audio.playChime(440, "sine"); // A4 chime
                setIntroDone(true);
                setCurtainsOpen(true);
                // Also unmute chimes automatically to play sound immediately if requested
                setIsMuted(false);
                audio.setMute(false);
                setTimeout(() => {
                  audio.playHappyBirthdayChimes();
                }, 900);
              }}
              className="mt-8 select-none pointer-events-auto rounded-[99px] border-2 border-[#f7d9a1]/60 bg-[#f7d9a1]/10 px-8 py-3.5 text-[18px] font-medium tracking-wider text-[#f7d9a1] uppercase transition duration-300 hover:bg-[#f7d9a1] hover:text-[#070104]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="unlock-stage-curtains-btn"
            >
              Reveal Backdrop
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Spotlight Settings panel (Top Right) */}
      <motion.div
        className="absolute right-5 top-24 z-20 flex flex-col gap-2.5 rounded-3xl border border-white/10 bg-[#080306]/65 p-3.5 backdrop-blur-xl pointer-events-auto"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: introDone ? 0 : 80, opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.65, delay: 0.2 }}
        id="spotlights-control-card"
      >
        <span className="font-mono text-[9px] tracking-widest text-[#bc944c] font-semibold text-center pb-1 uppercase border-b border-white/5">
          LIGHTS
        </span>
        {[0, 1, 2].map((id) => (
          <button
            key={id}
            onClick={() => handleSpotlightSelect(id)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 ${
              activeLight === id
                ? "border-[#f7d9a1] bg-[#f7d9a1]/20 text-[#f7d9a1] shadow-lg shadow-[#f7d9a1]/15"
                : "border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            aria-label={`Unleash spotlight ${id + 1}`}
            id={`spotlight-btn-${id}`}
          >
            <Lightbulb size={20} className={activeLight === id ? "fill-[#f7d9a1]/30" : ""} />
          </button>
        ))}
      </motion.div>

      {/* Interactive Toast Notifications */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="absolute top-24 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#fbd494]/30 bg-[#080306]/90 px-5 py-2.5 text-xs text-[#fbd494] flex items-center gap-2 shadow-2xl backdrop-blur-md"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.28 }}
            id="toast-notification"
          >
            <Sparkles size={13} className="animate-spin text-[#fbd494]" />
            <span className="font-mono">{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage Backdrop details helper indicator */}
      <motion.div
        className="absolute left-6 bottom-36 z-10 max-w-[240px] hidden md:block select-none pointer-events-none"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: introDone ? 0.75 : 0 }}
        transition={{ delay: 1 }}
        id="side-description-box"
      >
        <p className="font-serif italic text-xs text-zinc-400">
          “Happy Birthday to an artist, songwriter, author, and dreamer.”
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="h-[2px] w-6 bg-[#bc944c]/65" />
          <span className="font-mono text-[9px] text-[#bc944c] tracking-widest uppercase">STAGE BACKDROP</span>
        </div>
      </motion.div>

      {/* Floating Bottom Action Buttons Tray */}
      <motion.div
        className="pointer-events-auto absolute bottom-7 left-1/2 z-20 flex w-[90%] max-w-3xl -translate-x-1/2 flex-col gap-3 rounded-3xl border border-white/10 bg-[#080306]/55 p-3.5 shadow-2xl backdrop-blur-xl md:flex-row shadow-black/80"
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: introDone ? 0 : 90, opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        id="theatre-cta-tray"
      >
        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2.5 rounded-[99px] bg-white px-5 py-3.5 text-[18px] font-medium text-black transition-all duration-300 hover:bg-neutral-100 active:scale-[0.98] shadow-md hover:shadow-lg shadow-white/5 border border-transparent"
          onClick={() => {
            audio.playClickBeep();
            triggerToast("🎸 Redirecting to Premium Songs library!");
          }}
          id="cta-download-songs"
        >
          <Download size={18} className="stroke-[2.5]" />
          <span>Download Made Songs</span>
        </a>
        
        <a
          href="https://amazon.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2.5 rounded-[99px] border border-[#f7d9a1]/40 bg-[#f7d9a1]/10 px-5 py-3.5 text-[18px] font-medium text-[#f7d9a1] transition-all duration-300 hover:bg-[#f7d9a1]/20 active:scale-[0.98] shadow-md border-opacity-60"
          onClick={() => {
            audio.playClickBeep();
            triggerToast("📚 Redirecting to Book store!");
          }}
          id="cta-buy-book"
        >
          <BookOpen size={18} />
          <span>Buy My Book</span>
        </a>
        
        <button
          onClick={handleConfetti}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-[99px] bg-[#9d0023] px-5 py-3.5 text-[18px] font-medium text-white transition-all duration-300 hover:bg-[#bd002c] hover:shadow-lg hover:shadow-[#9d0023]/25 active:scale-[0.98] shadow-md"
          id="cta-pop-confetti"
        >
          <PartyPopper size={18} className="animate-pulse" />
          <span>Pop Confetti</span>
        </button>
      </motion.div>
    </main>
  );
}
