import {
  Environment,
  Float,
  Lightformer,
  Line,
  PerformanceMonitor,
  QuadraticBezierLine,
  RoundedBox,
  Sparkles,
} from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three';

/*
 * PROJECTS → TASKS → PROGRESS
 * A central hub (overall progress ring) is orbited by project cards. Each card shows its
 * own progress bar and is circled by its task blocks: cyan = completed, indigo = in
 * progress, dark metal = pending. The data is illustrative only.
 */
const PROJECTS = [
  { progress: 1, lift: 0.45, tasks: ['COMPLETED', 'COMPLETED', 'COMPLETED'] },
  { progress: 0.67, lift: -0.5, tasks: ['COMPLETED', 'COMPLETED', 'IN_PROGRESS'] },
  { progress: 0.25, lift: 0.7, tasks: ['COMPLETED', 'IN_PROGRESS', 'PENDING', 'PENDING'] },
];

const TAU = Math.PI * 2;
const FOV = 32;
// The camera looks down on the orbit plane so the ring spreads vertically as well.
const CAMERA_ELEVATION = MathUtils.degToRad(19);
const PROJECT_RADIUS = 2.1;
const ORBIT_RADIUS = 0.82;
const CARD_SIZE = [1.05, 1.4, 0.1];
const PROGRESS_TRACK_WIDTH = 0.78;
// Half-extents of the structure, used to fit the camera to any canvas aspect ratio.
const SCENE_HALF_WIDTH = PROJECT_RADIUS + ORBIT_RADIUS + 0.2;
const SCENE_HALF_HEIGHT = 2.1;
const FRAMING_MARGIN = 1.04;

const allTasks = PROJECTS.flatMap((project) => project.tasks);
const OVERALL_PROGRESS = allTasks.filter((status) => status === 'COMPLETED').length / allTasks.length;

function createMaterials() {
  return {
    card: new MeshPhysicalMaterial({
      color: '#1a1f2d',
      metalness: 0.88,
      roughness: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.35,
    }),
    chrome: new MeshPhysicalMaterial({
      color: '#1d2333',
      metalness: 1,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.5,
    }),
    track: new MeshStandardMaterial({ color: '#2b3144', metalness: 0.5, roughness: 0.55 }),
    label: new MeshStandardMaterial({
      color: '#aab2c8',
      emissive: '#3c4459',
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.6,
    }),
    completed: new MeshStandardMaterial({
      color: '#67e8f9',
      emissive: '#22d3ee',
      emissiveIntensity: 1.1,
      metalness: 0.2,
      roughness: 0.3,
      toneMapped: false,
    }),
    inProgress: new MeshStandardMaterial({
      color: '#a5b4fc',
      emissive: '#6366f1',
      emissiveIntensity: 0.9,
      metalness: 0.3,
      roughness: 0.3,
      toneMapped: false,
    }),
    pending: new MeshPhysicalMaterial({
      color: '#262b3a',
      metalness: 0.85,
      roughness: 0.3,
      clearcoat: 0.6,
      envMapIntensity: 1.1,
    }),
    orbitPath: new MeshBasicMaterial({ color: '#818cf8', transparent: true, opacity: 0.25, depthWrite: false }),
  };
}

function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function materialForStatus(materials, status) {
  if (status === 'COMPLETED') return materials.completed;
  if (status === 'IN_PROGRESS') return materials.inProgress;
  return materials.pending;
}

function ProgressRing({ radius, tube, progress, materials, rotation }) {
  return (
    <group rotation={rotation}>
      <mesh material={materials.track}>
        <torusGeometry args={[radius, tube * 0.55, 8, 96]} />
      </mesh>
      <mesh material={materials.completed} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius, tube, 10, 96, TAU * progress]} />
      </mesh>
    </group>
  );
}

function Hub({ materials }) {
  return (
    <group>
      <mesh material={materials.chrome}>
        <sphereGeometry args={[0.5, 40, 40]} />
      </mesh>
      {/* Tilted like the Orbit logo so the overall-progress arc reads as an ellipse. */}
      <ProgressRing
        radius={0.85}
        tube={0.03}
        progress={OVERALL_PROGRESS}
        materials={materials}
        rotation={[0.82, 0.25, -0.35]}
      />
    </group>
  );
}

function ProjectCard({ progress, materials }) {
  const [width, height, depth] = CARD_SIZE;
  const face = depth / 2 + 0.004;
  const fillWidth = PROGRESS_TRACK_WIDTH * progress;
  const accent = progress === 1 ? materials.completed : materials.inProgress;

  return (
    <group>
      <RoundedBox args={CARD_SIZE} radius={0.05} smoothness={4} material={materials.card} />
      {/* Abstract "title" and "description" lines */}
      <mesh position={[-width * 0.17, height * 0.33, face]} material={materials.label}>
        <boxGeometry args={[width * 0.48, 0.06, 0.008]} />
      </mesh>
      <mesh position={[-width * 0.1, height * 0.2, face]} material={materials.track}>
        <boxGeometry args={[width * 0.62, 0.032, 0.006]} />
      </mesh>
      <mesh position={[-width * 0.19, height * 0.12, face]} material={materials.track}>
        <boxGeometry args={[width * 0.44, 0.032, 0.006]} />
      </mesh>
      <mesh position={[width * 0.33, height * 0.33, face]} material={accent}>
        <circleGeometry args={[0.04, 20]} />
      </mesh>
      {/* Progress bar */}
      <mesh position={[0, -height * 0.36, face]} material={materials.track}>
        <boxGeometry args={[PROGRESS_TRACK_WIDTH, 0.05, 0.008]} />
      </mesh>
      <mesh position={[-PROGRESS_TRACK_WIDTH / 2 + fillWidth / 2, -height * 0.36, face + 0.004]} material={accent}>
        <boxGeometry args={[fillWidth, 0.05, 0.01]} />
      </mesh>
    </group>
  );
}

function TaskOrbit({ tasks, materials, speed, tilt, motion }) {
  const orbitRef = useRef(null);
  const blockRefs = useRef([]);

  useFrame((_, delta) => {
    if (!motion) return;
    orbitRef.current.rotation.y += delta * speed;
    for (const block of blockRefs.current) {
      if (block) block.rotation.x += delta * 0.6;
    }
  });

  return (
    <group rotation={[tilt, 0, 0]} position={[0, -0.12, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.orbitPath}>
        <torusGeometry args={[ORBIT_RADIUS, 0.005, 4, 96]} />
      </mesh>
      <group ref={orbitRef}>
        {tasks.map((status, index) => {
          const angle = (index / tasks.length) * TAU;
          const position = [Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS];
          return (
            <group key={index}>
              <Line
                points={[[0, 0, 0], position]}
                color="#a5b4fc"
                lineWidth={1}
                transparent
                opacity={0.28}
                depthWrite={false}
              />
              <RoundedBox
                ref={(node) => {
                  blockRefs.current[index] = node;
                }}
                args={[0.2, 0.2, 0.2]}
                radius={0.045}
                smoothness={3}
                position={position}
                material={materialForStatus(materials, status)}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}

function ProjectNode({ project, index, materials, motion }) {
  const angle = (index / PROJECTS.length) * TAU + Math.PI / 2;
  const position = [Math.cos(angle) * PROJECT_RADIUS, project.lift, Math.sin(angle) * PROJECT_RADIUS];

  return (
    <>
      <QuadraticBezierLine
        start={[0, 0, 0]}
        end={position}
        mid={[position[0] * 0.5, position[1] + 0.85, position[2] * 0.5]}
        color="#818cf8"
        lineWidth={1.2}
        transparent
        opacity={0.4}
        depthWrite={false}
      />
      {/* Cards face away from the hub so reflections change as the structure turns. */}
      <group position={position} rotation={[0, Math.PI / 2 - angle, 0]}>
        <ProjectCard progress={project.progress} materials={materials} />
        <TaskOrbit
          tasks={project.tasks}
          materials={materials}
          motion={motion}
          speed={0.35 + index * 0.08}
          tilt={0.28 - index * 0.12}
        />
      </group>
    </>
  );
}

/** Slow turntable rotation, a subtle pointer-driven tilt and a camera fitted to the canvas. */
function Rig({ motion, parallax, children }) {
  const tiltRef = useRef(null);
  const spinRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const aspect = useThree((state) => state.size.width / state.size.height);

  // Smallest camera distance at which the whole structure fits both horizontally and vertically.
  const halfFovTan = Math.tan(MathUtils.degToRad(FOV / 2));
  const projectedHalfHeight =
    SCENE_HALF_HEIGHT * Math.cos(CAMERA_ELEVATION) + SCENE_HALF_WIDTH * Math.sin(CAMERA_ELEVATION);
  const distance =
    Math.max(projectedHalfHeight / halfFovTan, SCENE_HALF_WIDTH / (halfFovTan * aspect)) * FRAMING_MARGIN;
  const cameraHeight = distance * Math.sin(CAMERA_ELEVATION);
  const cameraDepth = distance * Math.cos(CAMERA_ELEVATION);

  useEffect(() => {
    if (!parallax) return undefined;
    function handlePointerMove(event) {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [parallax]);

  useFrame(({ camera }, delta) => {
    const { x, y } = pointer.current;
    if (motion) spinRef.current.rotation.y += delta * 0.06;
    tiltRef.current.rotation.x = MathUtils.damp(tiltRef.current.rotation.x, y * 0.08, 2.5, delta);
    tiltRef.current.rotation.z = MathUtils.damp(tiltRef.current.rotation.z, -x * 0.05, 2.5, delta);
    camera.position.x = MathUtils.damp(camera.position.x, x * 0.6, 2, delta);
    camera.position.y = MathUtils.damp(camera.position.y, cameraHeight - y * 0.4, 2, delta);
    camera.position.z = MathUtils.damp(camera.position.z, cameraDepth, 3, delta);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={tiltRef}>
      <group ref={spinRef} rotation={[0, 0.35, 0]}>
        {children}
      </group>
    </group>
  );
}

function StudioLighting({ resolution }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#e0e7ff" />
      <pointLight position={[-5, 1.5, -3]} intensity={28} distance={16} color="#6366f1" />
      <pointLight position={[4, -2, 4]} intensity={12} distance={14} color="#22d3ee" />
      {/* Procedural studio environment for reflections: rendered once, no HDR download. */}
      <Environment resolution={resolution} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -2]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#818cf8"
          position={[-6, 1, 1]}
          rotation-y={Math.PI / 2}
          scale={[6, 2.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#67e8f9"
          position={[6, -1, 2]}
          rotation-y={-Math.PI / 2}
          scale={[6, 2, 1]}
        />
        <Lightformer form="ring" intensity={1.4} color="#c7d2fe" position={[2, 3, 6]} scale={2.5} />
      </Environment>
    </>
  );
}

function FloorGlow({ texture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <planeGeometry args={[9, 9]} />
      <meshBasicMaterial
        map={texture}
        color="#6366f1"
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function Scene({ compact, motion }) {
  const materials = useMemo(() => createMaterials(), []);
  const glowTexture = useMemo(() => createGlowTexture(), []);

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose());
      glowTexture.dispose();
    },
    [materials, glowTexture],
  );

  // Phones get fewer task blocks, no particles and a lower-resolution environment map.
  const projects = compact ? PROJECTS.map((project) => ({ ...project, tasks: project.tasks.slice(0, 2) })) : PROJECTS;

  return (
    <>
      <StudioLighting resolution={compact ? 64 : 128} />
      <Rig motion={motion} parallax={motion && !compact}>
        <Float enabled={motion} speed={1.1} rotationIntensity={0.15} floatIntensity={0.35} floatingRange={[-0.08, 0.08]}>
          <Hub materials={materials} />
          {projects.map((project, index) => (
            <ProjectNode key={index} project={project} index={index} materials={materials} motion={motion} />
          ))}
        </Float>
      </Rig>
      <FloorGlow texture={glowTexture} />
      {motion && !compact && (
        <Sparkles count={36} scale={[9, 5, 6]} size={1.8} speed={0.25} opacity={0.35} color="#a5b4fc" />
      )}
    </>
  );
}

export default function ProjectOrbitScene({ variant, reducedMotion, onContextLost }) {
  const compact = variant === 'compact';
  const maxDpr = compact ? 1.25 : 1.75;
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, maxDpr));
  const [ready, setReady] = useState(false);
  const motion = !reducedMotion;

  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
      <Canvas
        dpr={dpr}
        // With reduced motion the scene is drawn once instead of animating every frame.
        frameloop={motion ? 'always' : 'demand'}
        camera={{ position: [0, 4.5, 13], fov: FOV, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={compact ? { pointerEvents: 'none' } : undefined}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', onContextLost, { once: true });
          setReady(true);
        }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <Scene compact={compact} motion={motion} />
      </Canvas>
    </div>
  );
}
