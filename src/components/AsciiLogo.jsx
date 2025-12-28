import React, { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'
import { AsciiEffect } from './AsciiEffect'

function RotatingText() {
    const groupRef = useRef()

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.5 // Rotate around Y axis
        }
    })

    return (
        <group ref={groupRef}>
            <Text
                position={[0, 0, 0]}
                fontSize={2}
                color="#4880ff"
                anchorX="center"
                anchorY="middle"
                fontWeight={900}
            >
                Swipy
            </Text>
        </group>
    )
}

export default function AsciiLogo() {
    return (
        <div style={{ width: '300px', height: '300px', position: 'relative' }}>
            <Canvas>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <RotatingText />
                    <EffectComposer>
                        <AsciiEffect
                            cellSize={6}
                            color={true}
                            postfx={{
                                colorPalette: 4, // Blue
                                scanlineIntensity: 0.1,
                                scanlineCount: 200
                            }}
                        />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </div>
    )
}

