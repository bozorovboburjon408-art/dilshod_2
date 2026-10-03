import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Bounds } from '@react-three/drei';
import type { Part } from '../lib/types';
import { nodeById } from '../model/layout';

function Glb({ url }: { url: string }) { const { scene } = useGLTF(url); const o = useMemo(() => scene.clone(true), [scene]); return <primitive object={o} />; }

export function PartMini3D({ part, modelUrl }: { part: Part; modelUrl: string | null }) {
  const n = part.model_object_id ? nodeById.get(part.model_object_id) : undefined;
  return (
    <div className="h-64 overflow-hidden rounded border border-line bg-raised/40">
      <Canvas camera={{ position: [3, 2, 3], fov: 40 }} dpr={[1, 2]}>
        <hemisphereLight args={['#fff', '#555', 1]} /><directionalLight position={[5, 8, 5]} intensity={1.5} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.4}>
            {modelUrl ? <Glb url={modelUrl} /> : n ? (
              <mesh rotation={n.rot}>
                {n.shape.kind === 'box' ? <boxGeometry args={n.shape.size} /> : n.shape.kind === 'torus' ? <torusGeometry args={[n.shape.R, n.shape.t, 16, 72]} /> : <cylinderGeometry args={[n.shape.r, n.shape.r, n.shape.h, n.shape.kind === 'hex' ? 6 : 40]} />}
                <meshStandardMaterial color={n.color} metalness={0.4} roughness={0.5} />
              </mesh>
            ) : null}
          </Bounds>
        </Suspense>
        <OrbitControls autoRotate autoRotateSpeed={2} makeDefault />
      </Canvas>
      {!modelUrl && !n && <div className="-mt-40 text-center text-sm text-mute">3D model mavjud emas</div>}
    </div>
  );
}
