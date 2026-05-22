import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, RoundedBox, Environment, ContactShadows } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Download, BookOpen, PartyPopper, Lightbulb } from "lucide-react";
import * as THREE from "three";

/*
  Birthday Stage Landing Page
  Stack: Vite + React + Three.js + @react-three/fiber + drei + framer-motion

  Install:
  npm i three @react-three/fiber @react-three/drei framer-motion lucide-react canvas-confetti

  Replace /reiss.jpg with your real image in /public/reiss.jpg
*/

const PERSON_IMAGE = "/reiss.jpg";

function StageCurtain({ side = "left", open = false }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const targetX = side === "left" ? (open ? -4.7 : -1.55) : open ? 4.7 : 1.55;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.055);
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, side === "left" ? -0.08 : 0.08, 0.04);
  });

  const folds = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  return (
    <group ref={ref} position={[side === "left" ? -1.55 : 1.55, 0.2, 0.45]}>
      <RoundedBox args={[3.2, 5.8, 0.18]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#570018" roughness={0.78} metalness={0.08} />
      </RoundedBox>
      {folds.map((fold) => (
        <mesh key={fold} position={[-1.4 + fold * 0.35, 0, 0.12]}>
          <cylinderGeometry args={[0.035, 0.075, 5.85, 16]} />
          <meshStandardMaterial color={fold % 2 ? "#7b0025" : "#3d0012"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function TopDrapes() {
  return (
    <group position={[0, 2.95, 0.55]}>
      <RoundedBox args={[8.2, 0.45, 0.25]} radius={0.15} smoothness={6}>
        <meshStandardMaterial color="#4b0015" roughness={0.7} metalness={0.05} />
      </RoundedBox>
      {[-3.5, -2.7, -1.9, -1.1, -0.3, 0.5, 1.3, 2.1, 2.9, 3.7].map((x, i) => (
        <mesh key={x} position={[x, -0.2 - Math.sin(i) * 0.08, 0.15]} rotation={[0, 0, Math.sin(i) * 0.08]}>
          <sphereGeometry args={[0.34, 24, 16]} />
          <meshStandardMaterial color={i % 2 ? "#78001f" : "#5c0018"} roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function PersonPortrait() {
  const texture = useMemo(() => new THREE.TextureLoader().load(PERSON_IMAGE), []);

  return (
    <group position={[0, 0.35, 0.1]}>
      <RoundedBox args={[2.6, 3.25, 0.18]} radius={0.18} smoothness={8}>
        <meshStandardMaterial color="#17090d" roughness={0.55} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={[2.28, 2.9]} />
        <meshStandardMaterial map={texture} roughness={0.38} metalness={0.02} />
      </mesh>
      <Text position={[0, -1.82, 0.22]} fontSize={0.18} letterSpacing={0.06} anchorX="center" color="#f7d9a1">
        CELEBRATING RT THE ENGINEER
      </Text>
    </group>
  );
}

function StageLights({ activeLight }: { activeLight: number | null }) {
  const left = useRef<THREE.Group>(null);
  const centre = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (left.current) left.current.rotation.y = -0.45 + Math.sin(t * 0.8) * 0.08;
    if (centre.current) centre.current.rotation.y = Math.sin(t * 0.7) * 0.08;
    if (right.current) right.current.rotation.y = 0.45 + Math.sin(t * 0.9) * 0.08;
  });

  const lights = [
    { id: 0, ref: left, x: -2.3, rot: -0.45, color: "#ffd68a" },
    { id: 1, ref: centre, x: 0, rot: 0, color: "#fff1cc" },
    { id: 2, ref: right, x: 2.3, rot: 0.45, color: "#ffb6c8" },
  ];

  return (
    <group>
      {lights.map((l) => (
        <group key={l.id} ref={l.ref} position={[l.x, -2.05, 1.05]} rotation={[0.18, l.rot, 0]}>
          <spotLight
            position={[0, 0.25, 0]}
            target-position={[0, 1.9, -1.6]}
            intensity={activeLight === l.id ? 25 : 0}
            angle={0.36}
            penumbra={0.75}
            color={l.color}
            distance={9}
          />
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.32, 0.5, 32]} />
            <meshStandardMaterial color="#111111" roughness={0.45} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.35, 1.6, 32, 1, true]} />
            <meshBasicMaterial color={l.color} transparent opacity={activeLight === l.id ? 0.18 : 0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ribbons({ burst }: { burst: number }) {
  const ribbons = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        x: -3.6 + Math.random() * 7.2,
        y: 3.2 + Math.random() * 2,
        z: -0.2 + Math.random() * 1.5,
        speed: 0.004 + Math.random() * 0.008,
        color: ["#f7d9a1", "#b3002d", "#fff3cf", "#da9b42"][i % 4],
      })),
    [burst]
  );

  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      child.position.y -= ribbons[i].speed * (burst ? 7 : 2);
      child.rotation.z += 0.02;
      child.rotation.y += 0.05;
      if (child.position.y < -2.5) child.position.y = 3.5 + Math.random();
    });
  });

  return (
    <group ref={group}>
      {ribbons.map((r, i) => (
        <mesh key={`${burst}-${i}`} position={[r.x, r.y, r.z]} rotation={[0, 0, i * 0.4]} scale={[1, 3.5, 1]}>
          <torusKnotGeometry args={[0.04, 0.012, 64, 8, 1, 6]} />
          <meshPhysicalMaterial color={r.color} roughness={0.15} metalness={0.65} clearcoat={1.0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function BirthdayScene({ curtainsOpen, activeLight, ribbonBurst }: { curtainsOpen: boolean, activeLight: number | null, ribbonBurst: number }) {
  return (
    <Canvas camera={{ position: [0, 0.45, 7.2], fov: 38 }}>
      <color attach="background" args={["#090407"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 4, 5]} intensity={1.4} color="#ffe7b8" />
      <Environment preset="night" />

      <group position={[0, -0.2, 0]}>
        <mesh position={[0, -2.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.25, 4.6, 0.45, 64, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#25000d" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[0, 0.15, -0.18]}>
          <planeGeometry args={[8.5, 5.8]} />
          <meshStandardMaterial color="#11060a" roughness={0.9} />
        </mesh>

        <TopDrapes />
        <PersonPortrait />
        <StageLights activeLight={activeLight} />
        <Ribbons burst={ribbonBurst} />
        <StageCurtain side="left" open={curtainsOpen} />
        <StageCurtain side="right" open={curtainsOpen} />
      </group>

      <ContactShadows position={[0, -2.52, 0]} opacity={0.45} scale={7} blur={2.6} far={4} />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={1.25} maxPolarAngle={1.7} />
    </Canvas>
  );
}

export default function BirthdayStageLanding() {
  const [introDone, setIntroDone] = useState(false);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [activeLight, setActiveLight] = useState<number | null>(1);
  const [ribbonBurst, setRibbonBurst] = useState(0);

  const handleConfetti = async () => {
    setRibbonBurst((n) => n + 1);
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.72 } });
    confetti({ particleCount: 70, spread: 120, origin: { x: 0.15, y: 0.35 } });
    confetti({ particleCount: 70, spread: 120, origin: { x: 0.85, y: 0.35 } });
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#090407] text-white">
      <BirthdayScene curtainsOpen={curtainsOpen} activeLight={activeLight} ribbonBurst={ribbonBurst} />

      <AnimatePresence>
        {!introDone && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-[#090407]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
          >
            <motion.h1
              className="px-6 text-center font-serif text-6xl italic tracking-tight text-[#f7d9a1] drop-shadow-[0_0_25px_rgba(247,217,161,0.45)] md:text-8xl"
              initial={{ x: "-120vw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={() => {
                setTimeout(() => {
                  setIntroDone(true);
                  setCurtainsOpen(true);
                }, 1200);
              }}
            >
              RT THE Engineer - Happy Birthday
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex w-[92%] max-w-3xl -translate-x-1/2 flex-col gap-3 rounded-3xl border border-white/10 bg-black/35 p-3 shadow-2xl backdrop-blur-xl md:flex-row"
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: introDone ? 0 : 90, opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.75, ease: "easeOut" }}
      >
        <a
          href="#download"
          className="flex flex-1 items-center justify-center rounded-2xl border-[0.3px] border-white/20 bg-white px-4 py-3 text-[16px] font-semibold text-black transition hover:scale-[1.02]"
        >
          Download Made Songs
        </a>
        <a
          href="#book"
          className="flex flex-1 items-center justify-center rounded-2xl border-[0.3px] border-[#f7d9a1]/40 bg-[#f7d9a1]/10 px-4 py-3 text-[16px] font-semibold text-[#f7d9a1] transition hover:scale-[1.02]"
        >
          Buy My Book
        </a>
        <button
          onClick={handleConfetti}
          className="flex flex-1 items-center justify-center rounded-2xl border-[0.3px] border-[#9d0023]/60 bg-[#7b0025] px-4 py-3 text-[16px] font-semibold text-white transition hover:scale-[1.02]"
        >
          Pop Confetti
        </button>
      </motion.div>

      <motion.div
        className="absolute right-5 top-5 z-20 flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: introDone ? 0 : 80, opacity: introDone ? 1 : 0 }}
      >
        {[0, 1, 2].map((id) => (
          <button
            key={id}
            onClick={() => setActiveLight((prev) => (prev === id ? null : id))}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border-[0.3px] transition text-[16px] font-semibold ${
              activeLight === id ? "border-[#f7d9a1] bg-[#f7d9a1]/20 text-[#f7d9a1]" : "border-white/10 bg-white/5 text-white/70"
            }`}
            aria-label={`Turn spotlight ${id + 1}`}
          >
            {id + 1}
          </button>
        ))}
      </motion.div>
    </main>
  );
}
