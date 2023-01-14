import { extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Sky } from "@react-three/drei";
import { Brush, Subtraction } from "@react-three/csg";
import { useControls } from "leva";
import { useMemo, useRef } from "react";
import { Water } from "three-stdlib";
import { useEffect } from "react";
// import { LayerMaterial, Noise } from 'lamina';

extend({ Water });

/**
 * Lights
 */

function Lights() {
	const { lightPosition, lightColor, lightIntensity, ambient } = useControls('Lights', {
		lightColor: "#f8c08a",
		lightIntensity: {
			value: 2,
			min: 0,
			max: 3,
			step: 0.05,
		},
		lightPosition: {
			value: { x: 3.9, y: 1.8, z: -3 },
			step: 0.1,
			min: -10,
			max: 10,
		},
		ambient: 0.5,
	}, { collapsed: true });

	return (
		<>
			<directionalLight
				castShadow
				shadow-camera-near={-1}
				shadow-camera-far={20}
				shadow-camera-left={-10}
				shadow-camera-right={10}
				shadow-camera-top={10}
				shadow-camera-bottom={-10}
				shadow-mapSize-width={4096}
				shadow-mapSize-height={4096}
				shadow-normalBias={0.01}
				color={lightColor}
				position={[lightPosition.x, lightPosition.y, lightPosition.z]}
				intensity={lightIntensity}
			/>
			<ambientLight intensity={ambient} />
		</>
	);
}

/**
 * Room
 */

function Room() {
	const room = useRef();

	const { roomSize, wallThickness, windowSize } = useControls('Room', {
		roomSize: {
			value: [4, 4, 7],
			min: 1,
			max: 8,
			step: 0.1,
		},
		wallThickness: {
			value: 0.1,
			min: 0.1,
			max: 0.5,
			step: 0.001,
		},
		windowSize: {
			value: [5, 3.5, 3.5],
			min: 1,
			max: 5,
			step: 0.1,
		},
	}, { collapsed: true });

	const roomMaterialProps = useControls('Room Material', {
		color: "#ff8378",
		metalness: {
			value: 0.22,
			min: 0,
			max: 1,
			step: 0.01,
		},
		roughness: {
			value: 0.6,
			min: 0,
			max: 1,
			step: 0.01,
		},
		clearcoat: {
			value: 0.6,
			min: 0,
			max: 1,
			step: 0.01,
		},
		clearcoatRoughness: {
			value: 0.66,
			min: 0,
			max: 1,
			step: 0.01,
		},
		reflectivity: {
			value: 0.45,
			min: 0,
			max: 1,
			step: 0.01,
		},
	}, { collapsed: true });

	return (
		<mesh
			ref={room}
			castShadow
			receiveShadow
			rotation-y={Math.PI * 0.5}
			scale={1.5}
		>
			<Subtraction>
				<Subtraction a>
					<Brush a position={[0, 0, 0]}>
						<boxGeometry args={[...roomSize]} />
					</Brush>
					<Brush b position={[-0.5, 0, 0]}>
						<boxGeometry
							args={[
								roomSize[0] - wallThickness,
								roomSize[1] - wallThickness,
								roomSize[2] - wallThickness,
							]}
						/>
					</Brush>
				</Subtraction>
				<Brush b>
					<boxGeometry args={[...windowSize]} />
				</Brush>
			</Subtraction>
			<meshPhysicalMaterial {...roomMaterialProps} side={THREE.DoubleSide} />
		</mesh>
	);
}

/**
 * Ocean
 */

function Ocean() {
	let lerpAmt = 0;
	const ref = useRef();
	const gl = useThree((state) => state.gl);
	const waterNormals = useLoader(THREE.TextureLoader, "/waternormals1.jpeg");
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
	
	const geom = useMemo(() => new THREE.PlaneGeometry(50, 50), []);
	const props = useControls('Ocean', {
		sunDirection: new THREE.Vector3(5, 12, -100),
		sunColor: "#f8c08a",
		waterColor: "#93b8c7",
		distortionScale: 4,
	}, { collapsed: true });

	const config = useMemo(
		() => ({
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: waterNormals,
			fog: false,
			format: gl.encoding,
		}),
		[waterNormals]
	);
	useEffect(() => {
		ref.current.material.uniforms.size.value = 0.75;
	});
	useFrame(
		(state, delta) => {
			// if(lerpAmt < 1) { lerpAmt += delta * 0.1; }
			ref.current.material.uniforms.time.value += delta * 0.1;
			// ref.current.material.uniforms.waterColor.value = new THREE.Color(props.waterColor).lerp(new THREE.Color(0xff0000), lerpAmt);
		}
	);

	return (
		<water
			ref={ref}
			args={[geom, {...config, ...props}]}
			position={[0, -4, -25]}
			rotation-x={-Math.PI / 2.1}
		/>
	);
}

function Sun() {
	return (
		<mesh position={[15, 8, -100]}>
			<circleGeometry args={[0.75, 32]} />
			<meshBasicMaterial color="#fdda68" />
		</mesh>
	);
}

/**
 * Sky 
 */

function TheSky() {
	const ref = useRef();
	const props = useControls('Sky', {
		distance: 1000,
		sunPosition: [2, 1, 8], // lerp to [2, -1, 8]
		// inclination: 0,
		// azimuth: 0,
		// mieCoefficient: 0.005,
		// mieDirectionalG: 0.8,
		rayleigh: 0.5, // lerp to 10
		// turbidity: 10,
	}, { collapsed: true });

	useEffect(() => {
		// TODO: Lerp ref.current.material.uniforms here :D
		// console.log(ref.current);
	})

	return (
		<Sky ref={ref} {...props} />
	);
}

/**
 * Experience
 */

export default function Experience() {
	return (
		<>
			<OrbitControls makeDefault />
			<Lights />
			<Room />
			<Ocean />
			<TheSky />
			<Sun />
		</>
	);
}
