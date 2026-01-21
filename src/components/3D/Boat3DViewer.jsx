import React, { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Cheerful low-poly color palette
const COLORS = {
  hull: '#34495e',
  hullDark: '#2c3e50',
  deck: '#5d6d7e',
  water: '#3498db',
  waterLight: '#5dade2',
  port: '#e74c3c',
  starboard: '#27ae60',
  coxswain: '#f39c12',
  empty: '#95a5a6',
  rigger: '#7f8c8d',
  bowBall: '#e74c3c',
  oarShaft: '#ecf0f1',
};

// Seat component - clean low-poly cube
const Seat = ({ position, side, seatNumber, athlete, isSelected, onClick, isCoxswain = false }) => {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const getColor = () => {
    if (isSelected) return '#3498db';
    if (isCoxswain) return athlete ? COLORS.coxswain : COLORS.empty;
    if (athlete) return side === 'Port' ? COLORS.port : COLORS.starboard;
    return COLORS.empty;
  };

  const isOccupied = !!athlete;

  return (
    <group ref={groupRef} position={position}>
      {/* Seat cushion */}
      <mesh
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
        castShadow
      >
        <boxGeometry args={isCoxswain ? [0.3, 0.12, 0.35] : [0.4, 0.1, 0.5]} />
        <meshStandardMaterial
          color={getColor()}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Seat rail/slide */}
      {!isCoxswain && (
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.5, 0.03, 0.1]} />
          <meshStandardMaterial color={COLORS.deck} roughness={0.6} />
        </mesh>
      )}

      {/* Name label - only for occupied seats, using HTML */}
      {isOccupied && (
        <Html
          position={[0, 0.3, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="px-2 py-0.5 glass-card rounded text-xs font-semibold text-text-primary shadow-sm whitespace-nowrap">
            {athlete.lastName?.slice(0, 6) || (isCoxswain ? 'COX' : '')}
          </div>
        </Html>
      )}
    </group>
  );
};

// Low-poly hull - simple and clean
const Hull = ({ length, seats }) => {
  const hullRef = useRef();

  useFrame((state) => {
    if (hullRef.current) {
      // Very subtle rocking
      hullRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.015;
    }
  });

  return (
    <group ref={hullRef}>
      {/* Main hull body - tapered box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, 0.18, 0.45]} />
        <meshStandardMaterial color={COLORS.hull} roughness={0.7} />
      </mesh>

      {/* Bow (front) - pointed */}
      <mesh position={[length / 2 + 0.15, 0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.3]} />
        <meshStandardMaterial color={COLORS.hull} roughness={0.7} />
      </mesh>

      {/* Stern (back) - slightly rounded */}
      <mesh position={[-length / 2 - 0.1, 0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.25, 0.16, 0.35]} />
        <meshStandardMaterial color={COLORS.hull} roughness={0.7} />
      </mesh>

      {/* Deck detail stripe */}
      <mesh position={[0, 0.095, 0]}>
        <boxGeometry args={[length - 0.3, 0.015, 0.12]} />
        <meshStandardMaterial color={COLORS.deck} roughness={0.5} />
      </mesh>

      {/* Bow ball */}
      <mesh position={[length / 2 + 0.35, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={COLORS.bowBall} roughness={0.4} />
      </mesh>

      {/* Riggers */}
      {Array.from({ length: seats }).map((_, i) => {
        const xPos = (i - (seats - 1) / 2) * 0.7;
        const isPort = i % 2 === 0;
        const zOffset = isPort ? -0.35 : 0.35;

        return (
          <group key={i}>
            {/* Rigger arm */}
            <mesh position={[xPos, 0.02, zOffset]} castShadow>
              <boxGeometry args={[0.06, 0.04, 0.35]} />
              <meshStandardMaterial color={COLORS.rigger} roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Oarlock */}
            <mesh position={[xPos, 0.06, isPort ? -0.52 : 0.52]} castShadow>
              <boxGeometry args={[0.04, 0.06, 0.04]} />
              <meshStandardMaterial color={COLORS.rigger} roughness={0.3} metalness={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// Simple oar - only renders if athlete present
const Oar = ({ position, side, hasAthlete }) => {
  if (!hasAthlete) return null;

  const zDir = side === 'Port' ? -1 : 1;
  const oarColor = side === 'Port' ? COLORS.port : COLORS.starboard;

  return (
    <group position={position}>
      {/* Oar shaft */}
      <mesh
        position={[0, 0.08, zDir * 1.1]}
        rotation={[Math.PI / 2, 0, zDir * 0.15]}
      >
        <cylinderGeometry args={[0.018, 0.022, 1.8, 8]} />
        <meshStandardMaterial color={COLORS.oarShaft} roughness={0.6} />
      </mesh>

      {/* Oar blade */}
      <mesh position={[0, 0.08, zDir * 2]}>
        <boxGeometry args={[0.12, 0.03, 0.35]} />
        <meshStandardMaterial color={oarColor} roughness={0.5} />
      </mesh>
    </group>
  );
};

// Stylized water with gentle waves
const Water = () => {
  const waterRef = useRef();
  const initialPositions = useRef(null);

  useFrame((state) => {
    if (waterRef.current) {
      const positions = waterRef.current.geometry.attributes.position;

      // Store initial positions on first frame
      if (!initialPositions.current) {
        initialPositions.current = positions.array.slice();
      }

      const time = state.clock.elapsedTime * 0.5;

      for (let i = 0; i < positions.count; i++) {
        const ix = i * 3;
        const x = initialPositions.current[ix];
        const z = initialPositions.current[ix + 2];

        // Gentle wave displacement
        const wave = Math.sin(x * 0.3 + time) * 0.08 +
                     Math.cos(z * 0.4 + time * 0.7) * 0.06;
        positions.array[ix + 1] = wave;
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
      <planeGeometry args={[40, 40, 20, 20]} />
      <meshStandardMaterial
        color={COLORS.water}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0.92}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Simple cloud puff
const Cloud = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshStandardMaterial color="#fff" roughness={1} />
      </mesh>
      <mesh position={[0.4, -0.05, 0]}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color="#fff" roughness={1} />
      </mesh>
      <mesh position={[-0.35, -0.08, 0.1]}>
        <sphereGeometry args={[0.4, 8, 6]} />
        <meshStandardMaterial color="#fff" roughness={1} />
      </mesh>
    </group>
  );
};

// Main component
const Boat3DViewer = ({
  boat,
  onSeatClick,
  selectedSeat = null,
  className = '',
  autoRotate = false
}) => {
  const numSeats = boat?.seats?.length || 8;
  const hasCoxswain = boat?.boatConfig?.hasCoxswain;
  const boatLength = numSeats * 0.7 + 1.2;

  // Generate seat positions along the boat
  const seatPositions = useMemo(() => {
    const positions = [];

    for (let i = 0; i < numSeats; i++) {
      const xPos = (i - (numSeats - 1) / 2) * 0.7;
      const side = i % 2 === 0 ? 'Port' : 'Starboard';
      positions.push({
        position: [xPos, 0.15, 0],
        side,
        seatNumber: numSeats - i,
        seat: boat?.seats?.[numSeats - 1 - i],
        isCoxswain: false
      });
    }

    if (hasCoxswain) {
      positions.push({
        position: [-boatLength / 2 + 0.2, 0.18, 0],
        side: 'Cox',
        seatNumber: 0,
        seat: { athlete: boat?.coxswain },
        isCoxswain: true
      });
    }

    return positions;
  }, [numSeats, hasCoxswain, boat, boatLength]);

  return (
    <div
      className={`w-full h-full rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #5DADE2 40%, #3498DB 100%)'
      }}
    >
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 3.5, 5]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={0.4}
          minDistance={3}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.1}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 8]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <hemisphereLight args={['#87CEEB', '#3498DB', 0.3]} />

        {/* Clouds in background */}
        <Cloud position={[-10, 5, -8]} scale={1.2} />
        <Cloud position={[8, 6, -10]} scale={0.9} />
        <Cloud position={[0, 4.5, -12]} scale={1} />

        <Suspense fallback={null}>
          {/* Water */}
          <Water />

          {/* Boat group with gentle floating */}
          <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.08}>
            <group position={[0, 0.1, 0]}>
              {/* Hull */}
              <Hull length={boatLength} seats={numSeats} />

              {/* Seats */}
              {seatPositions.map((seatData, i) => (
                <Seat
                  key={i}
                  position={seatData.position}
                  side={seatData.side}
                  seatNumber={seatData.seatNumber}
                  athlete={seatData.seat?.athlete}
                  isSelected={selectedSeat === seatData.seatNumber}
                  isCoxswain={seatData.isCoxswain}
                  onClick={() => onSeatClick?.(seatData.seatNumber, seatData.side)}
                />
              ))}

              {/* Oars - only for occupied seats */}
              {seatPositions
                .filter(s => !s.isCoxswain && s.seat?.athlete)
                .map((seatData, i) => (
                  <Oar
                    key={`oar-${i}`}
                    position={seatData.position}
                    side={seatData.side}
                    hasAthlete={true}
                  />
                ))
              }
            </group>
          </Float>
        </Suspense>
      </Canvas>

      {/* Boat info overlay */}
      <div className="absolute top-4 left-4 glass-card rounded-xl px-4 py-2 shadow-lg">
        <div className="text-sm font-bold text-text-primary">
          {boat?.boatConfig?.name || 'Boat'}
        </div>
        <div className="text-xs text-text-muted">
          {boat?.shellName || 'Select a shell'}
        </div>
      </div>

      {/* Color legend */}
      <div className="absolute bottom-4 left-4 glass-card rounded-xl px-4 py-2 shadow-lg">
        <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.port }} />
            <span>Port</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.starboard }} />
            <span>Starboard</span>
          </div>
          {hasCoxswain && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.coxswain }} />
              <span>Cox</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/90">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default Boat3DViewer;
