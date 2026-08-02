import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Mesmos pontos do AuracashIcon.jsx — diamante de 9 lados (não losango).
 * viewBox 24 → Y para cima.
 */
const OUTER_SVG = [
    [12, 2], [18.4, 4.3], [21.8, 10.3], [20.7, 17], [15.4, 21.4],
    [8.6, 21.4], [3.3, 17], [2.2, 10.3], [5.6, 4.3],
];
const INNER_SVG = [
    [12, 7], [16, 9], [17, 14], [14, 17], [10, 17], [7, 14], [8, 9],
];

const toXY = ([x, y]) => new THREE.Vector2((x - 12) / 10, (12 - y) / 10);

function makeShape(points) {
    const shape = new THREE.Shape();
    const pts = points.map(toXY);
    shape.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
    shape.closePath();
    return shape;
}

const EXTRUDE = {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 1,
    curveSegments: 1,
};

function buildBodyGeo() {
    const geo = new THREE.ExtrudeGeometry(makeShape(OUTER_SVG), EXTRUDE);
    geo.center();
    // Face do nonágono no plano XY (Y pra cima) = mesma silhueta do ícone
    return geo;
}

function buildTableGeo() {
    const geo = new THREE.ExtrudeGeometry(makeShape(INNER_SVG), {
        ...EXTRUDE,
        depth: 0.06,
        bevelThickness: 0.02,
        bevelSize: 0.015,
    });
    geo.center();
    // Ligeiramente à frente da face
    geo.translate(0, 0, 0.14);
    return geo;
}

const BODY_GEO = buildBodyGeo();
const TABLE_GEO = buildTableGeo();

const BODY_MAT = new THREE.MeshStandardMaterial({
    color: '#a855f7',
    emissive: '#7e22ce',
    emissiveIntensity: 0.45,
    metalness: 0.5,
    roughness: 0.22,
    flatShading: true,
});
const TABLE_MAT = new THREE.MeshStandardMaterial({
    color: '#9333ea',
    emissive: '#6b21a8',
    emissiveIntensity: 0.3,
    metalness: 0.4,
    roughness: 0.3,
    flatShading: true,
});
const EDGE_MAT = new THREE.LineBasicMaterial({ color: '#e9d5ff', transparent: true, opacity: 0.55 });

export function AuraCashGem({ position = [0, 1, 0], scale = 0.42, bobOffset = 0 }) {
    const groupRef = useRef();
    const baseY = position[1] ?? 1;

    const edges = useMemo(() => new THREE.EdgesGeometry(BODY_GEO, 25), []);

    useFrame((state, delta) => {
        const g = groupRef.current;
        if (!g) return;
        const t = state.clock.elapsedTime + bobOffset;
        g.rotation.y += delta * 1.3;
        g.position.y = baseY + Math.sin(t * 2.2) * 0.1;
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <mesh geometry={BODY_GEO} material={BODY_MAT} />
            <mesh geometry={TABLE_GEO} material={TABLE_MAT} />
            <lineSegments geometry={edges} material={EDGE_MAT} />
        </group>
    );
}
