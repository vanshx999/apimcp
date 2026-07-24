'use client'

import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, MeshTransmissionMaterial, Float, Sparkles, Grid } from '@react-three/drei'
import * as THREE from 'three'

function SpecDocument({ phase }: { phase: number }) {
  const group = useRef<THREE.Group>(null!)
  const shakeRef = useRef(0)

  const panels = useMemo(() => {
    const p = []
    for (let i = 0; i < 6; i++) {
      p.push({
        position: [0, i * 0.1 - 0.25, i * 0.04] as [number, number, number],
        wh: [0.85 - i * 0.04, 0.32] as [number, number],
        opacity: 0.5 + i * 0.1,
        color: i % 2 === 0 ? '#6B96FF' : '#FF8C55',
      })
    }
    return p
  }, [])

  const jsonLines = useMemo(() => {
    const lines = []
    for (let i = 0; i < 14; i++) {
      const y = -0.22 + i * 0.038
      const len = 0.12 + Math.random() * 0.45
      lines.push({
        start: [-0.38, y, 0.06],
        end: [-0.38 + len, y, 0.06],
        color: i % 3 === 0 ? '#FF8C55' : '#6B96FF',
        opacity: 0.5 + Math.random() * 0.4,
      })
    }
    return lines
  }, [])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime

    if (phase === 0) {
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 1.4, 0.02)
      group.current.position.y = Math.sin(t * 0.4) * 0.1 + Math.sin(t * 0.7) * 0.04
      group.current.rotation.z = Math.sin(t * 0.15) * 0.04
      group.current.rotation.x = Math.sin(t * 0.1) * 0.02
      shakeRef.current = THREE.MathUtils.lerp(shakeRef.current, 0, 0.05)
    } else if (phase === 1) {
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.6, 0.12)
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0.9, 0.06)
      shakeRef.current = THREE.MathUtils.lerp(shakeRef.current, 0.04, 0.02)
    } else if (phase === 2) {
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, 0, 0.06))
      group.current.position.y += 0.015
      shakeRef.current = THREE.MathUtils.lerp(shakeRef.current, 0, 0.05)
    } else {
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 3.5, 0.015)
      group.current.rotation.z += 0.008
      shakeRef.current = THREE.MathUtils.lerp(shakeRef.current, 0, 0.05)
    }

    const sx = (Math.random() - 0.5) * shakeRef.current
    const sy = (Math.random() - 0.5) * shakeRef.current
    group.current.position.x += sx
    group.current.position.y += sy
  })

  return (
    <group ref={group} position={[-2, 0.3, 0]}>
      {panels.map((p, i) => (
        <mesh key={i} position={p.position}>
          <planeGeometry args={p.wh} />
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={0.2 + i * 0.05}
            chromaticAberration={0.04}
            anisotropy={0.3}
            color={p.color}
            opacity={p.opacity}
            transparent
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      ))}
      {jsonLines.map((line, i) => (
        <Line key={i} points={[new THREE.Vector3(...line.start), new THREE.Vector3(...line.end)]}
          color={line.color} lineWidth={0.4} opacity={line.opacity} transparent />
      ))}
    </group>
  )
}

function StampPress({ phase }: { phase: number }) {
  const group = useRef<THREE.Group>(null!)
  const ram = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.PointLight>(null!)

  useFrame((state) => {
    if (!ram.current || !group.current) return
    if (phase === 0) {
      ram.current.position.y = THREE.MathUtils.lerp(ram.current.position.y, 1.4, 0.015)
      if (glowRef.current) glowRef.current.intensity = THREE.MathUtils.lerp(glowRef.current.intensity, 0, 0.02)
    } else if (phase === 1) {
      ram.current.position.y = THREE.MathUtils.lerp(ram.current.position.y, 0.1, 0.35)
      group.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.008
      if (glowRef.current) glowRef.current.intensity = THREE.MathUtils.lerp(glowRef.current.intensity, 2, 0.1)
    } else {
      ram.current.position.y = THREE.MathUtils.lerp(ram.current.position.y, 1.4, 0.015)
      if (glowRef.current) glowRef.current.intensity = THREE.MathUtils.lerp(glowRef.current.intensity, 0, 0.02)
    }
  })

  return (
    <group ref={group} position={[-0.2, 0, 0]}>
      <pointLight ref={glowRef} position={[0, 0.5, 0]} intensity={0} color="#FF8C55" distance={5} />
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.12, 32]} />
        <meshStandardMaterial color="#555047" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.05, 32]} />
        <meshStandardMaterial color="#FF8C55" metalness={0.2} roughness={0.5} emissive="#FF8C55" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, -0.62, 0]} scale={0.8}>
        <cylinderGeometry args={[0.4, 0.4, 0.03, 32]} />
        <meshStandardMaterial color="#E8C870" metalness={0.6} roughness={0.3} emissive="#D4A843" emissiveIntensity={0.1} />
      </mesh>
      <mesh ref={ram} position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 1, 16]} />
        <meshStandardMaterial color="#302C27" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.1, 16]} />
        <meshStandardMaterial color="#3D3830" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.9, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.46, 16]} />
        <meshStandardMaterial color="#C9C2AF" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function NodeGraph({ phase }: { phase: number }) {
  const group = useRef<THREE.Group>(null!)
  const particlesRef = useRef<THREE.Points>(null!)

  const nodes = useMemo(() => {
    const n = []
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2
      const r = 0.35 + Math.random() * 0.3
      const size = 0.02 + Math.random() * 0.04
      n.push({
        position: [Math.cos(angle) * r, Math.sin(angle) * r * 0.5 + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.3] as [number, number, number],
        size,
            color: Math.random() > 0.5 ? '#6B96FF' : '#FF8C55',
      })
    }
    return n
  }, [])

  const edges = useMemo(() => {
    const e = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          (nodes[i].position[0] - nodes[j].position[0]) ** 2 +
          (nodes[i].position[1] - nodes[j].position[1]) ** 2 +
          (nodes[i].position[2] - nodes[j].position[2]) ** 2
        )
        if (dist < 0.6 && Math.random() > 0.6) {
          e.push({
            start: new THREE.Vector3(...nodes[i].position),
            end: new THREE.Vector3(...nodes[j].position),
        color: Math.random() > 0.5 ? '#6B96FF' : '#FF8C55',
          })
        }
      }
    }
    return e
  }, [nodes])

  const particlePositions = useMemo(() => {
    const pos = new Float32Array(120 * 3)
    for (let i = 0; i < 120; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 0.3 + Math.random() * 0.6
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.5
      pos[i * 3 + 2] = Math.cos(phi) * r * 0.5
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    if (phase >= 2) {
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, 1, 0.06))
      group.current.rotation.y = t * 0.15
      group.current.rotation.x = Math.sin(t * 0.08) * 0.08
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0.6, 0.02)
    } else {
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, 0, 0.06))
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.05
    }
  })

  return (
    <group ref={group} position={[3, 0, 0]} scale={0}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#6B96FF" transparent opacity={0.5} sizeAttenuation />
      </points>
      {nodes.map((n, i) => (
        <mesh key={i} position={n.position}>
          <sphereGeometry args={[n.size, 12, 12]} />
          <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={0.8} metalness={0.1} roughness={0.2} />
        </mesh>
      ))}
      {edges.map((e, i) => (
        <Line key={i} points={[e.start, e.end]} color={e.color} lineWidth={0.3} opacity={0.45} transparent />
      ))}
    </group>
  )
}

function Shockwave({ active }: { active: boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  const ref2 = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (!ref.current || !ref2.current) return
    if (active) {
      const s = THREE.MathUtils.lerp(ref.current.scale.x, 4, 0.15)
      ref.current.scale.setScalar(s)
      ref2.current.scale.setScalar(s * 1.5)
      const m = ref.current.material as THREE.MeshBasicMaterial
      const m2 = ref2.current.material as THREE.MeshBasicMaterial
      m.opacity = Math.max(0, m.opacity - delta * 2)
      m2.opacity = Math.max(0, m2.opacity - delta * 1.5)
    } else {
      ref.current.scale.setScalar(0)
      ref2.current.scale.setScalar(0)
      const m = ref.current.material as THREE.MeshBasicMaterial
      const m2 = ref2.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.6
      m2.opacity = 0.3
    }
  })

  return (
    <group position={[-0.2, -0.35, 0]}>
      <mesh ref={ref} scale={0}>
        <ringGeometry args={[0.05, 0.3, 64]} />
        <meshBasicMaterial color="#FF5A1F" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ref2} scale={0}>
        <ringGeometry args={[0.1, 0.2, 64]} />
        <meshBasicMaterial color="#1F3FE0" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function GridFloor() {
  return (
    <Grid position={[0, -0.85, 0]} args={[8, 8]} cellSize={0.4} cellThickness={0.8} cellColor="#6B96FF" sectionSize={2} sectionThickness={1.5} sectionColor="#6B96FF" fadeDistance={5} fadeStrength={0.6} />
  )
}

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null!)
  const count = 60
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 - 1
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.001
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#6B96FF" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#F0ECE1" />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#F0ECE1" />
      <directionalLight position={[-4, 3, -3]} intensity={0.8} color="#6B96FF" />
      <pointLight position={[0, 3, 0]} intensity={1.2} color="#FF8C55" distance={6} decay={0.8} />
      <pointLight position={[2, 1, 2]} intensity={0.5} color="#E8C870" distance={4} />
      <hemisphereLight args={['#6B96FF', '#F0ECE1', 0.4]} />
    </>
  )
}

function SceneContent({ phase }: { phase: number }) {
  const { mouse, viewport } = useThree()
  const group = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (!group.current) return
    group.current.rotation.x = mouse.y * 0.025
    group.current.rotation.y = mouse.x * 0.025
    group.current.position.x = mouse.x * 0.1
    group.current.position.y = mouse.y * 0.1
  })

  return (
    <group ref={group}>
      <GridFloor />
      <FloatingParticles />
      <SpecDocument phase={phase} />
      <StampPress phase={phase} />
      <NodeGraph phase={phase} />
      <Shockwave active={phase === 1} />
      <Sparkles count={50} scale={4} size={2} speed={0.4} opacity={0.25} color="#FF8C55" />
    </group>
  )
}

export type Hero3DHandle = { triggerStamp: () => void }

export default forwardRef<Hero3DHandle, {}>(function Hero3DScene(_, ref) {
  const [phase, setPhase] = useState(0)

  useImperativeHandle(ref, () => ({
    triggerStamp: () => {
      setPhase(0)
      setTimeout(() => setPhase(1), 50)
      setTimeout(() => setPhase(2), 900)
      setTimeout(() => setPhase(3), 2800)
    },
  }))

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 2800)
    const t2 = setTimeout(() => setPhase(2), 3700)
    const t3 = setTimeout(() => setPhase(3), 5500)
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0.3, 3.5], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <SceneLights />
        <SceneContent phase={phase} />
      </Canvas>
    </div>
  )
})
