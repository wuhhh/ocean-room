/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { MeshPhysicalMaterial } from "three";

export function Chair(props) {
  const { nodes } = useGLTF("/d4-model-webgl-transformed.glb");
  const chairMaterial = new MeshPhysicalMaterial({
    color: "DarkGrey",
    roughness: 1.0,
    metalness: 0.22,
    reflectivity: 0.4,
    clearcoat: 0.6,
    clearcoatRoughness: 1.0,
  });

  return (
    <group {...props} dispose={null}>
      <mesh castShadow receiveShadow geometry={nodes.Legs.geometry} material={chairMaterial} />
      <mesh castShadow receiveShadow geometry={nodes.Seat.geometry} material={chairMaterial} />
      <mesh castShadow receiveShadow geometry={nodes.Back.geometry} material={chairMaterial} />
      <mesh castShadow receiveShadow geometry={nodes.Bracket.geometry} material={chairMaterial} />
      <mesh castShadow receiveShadow geometry={nodes.Bracket001.geometry} material={chairMaterial} />
    </group>
  );
}

useGLTF.preload("/d4-model-webgl-transformed.glb");
