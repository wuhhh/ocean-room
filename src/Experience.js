import { extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Sky } from "@react-three/drei";
import { Brush, Subtraction } from "@react-three/csg";
import { useControls } from "leva";
import { useMemo, useRef } from "react";
import { Water } from "three-stdlib";
import { useEffect } from "react";
import { LayerMaterial, Noise } from 'lamina';

extend({ Water });

function Lights() {
	const { lightPosition, lightColor, lightIntensity, ambient, normalBias } =
		useControls({
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
			normalBias: {
				value: 0.05,
				min: 0.0001,
				max: 0.1,
				step: 0.0001,
			},
		});

	return (
		<>
			<directionalLight
				castShadow
				shadow-camera-near={0.1}
				shadow-camera-far={20}
				shadow-camera-left={-10}
				shadow-camera-right={10}
				shadow-camera-top={10}
				shadow-camera-bottom={-10}
				shadow-mapSize-width={4096}
				shadow-mapSize-height={4096}
				shadow-normalBias={0.05}
				color={lightColor}
				position={[lightPosition.x, lightPosition.y, lightPosition.z]}
				intensity={lightIntensity}
			/>
			<ambientLight intensity={ambient} />
		</>
	);
}

function Room() {
	const room = useRef();

	const { roomSize, wallThickness, windowSize } = useControls({
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
	});

	const roomMaterialProps = useControls({
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
			value: 0.18,
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
	});

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
			<meshPhysicalMaterial
				{...roomMaterialProps}
				side={THREE.DoubleSide}
			/>
		</mesh>
	);
}

function Ocean() {
	const ref = useRef();
	const gl = useThree((state) => state.gl);
	const waterNormals = useLoader(THREE.TextureLoader, "/waternormals1.jpeg");
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
	const geom = useMemo(() => new THREE.PlaneGeometry(300, 300), []);
	const config = useMemo(
		() => ({
			textureWidth: 512,
			textureHeight: 512,
			waterNormals,
			sunDirection: new THREE.Vector3(5, 12, -100),
			sunColor: 0xf8c08a,
			waterColor: 0xe0ffff,
			distortionScale: 3.7,
			fog: false,
			format: gl.encoding,
		}),
		[waterNormals]
	);
	useEffect(() => {
		ref.current.material.uniforms.size.value = 1.0;
	});
	useFrame(
		(state, delta) => (ref.current.material.uniforms.time.value += delta * 0.1)
	);
	return (
		<water
			ref={ref}
			args={[geom, config]}
			position={[0, -4, -10]}
			rotation-x={-Math.PI / 2}
		/>
	);
}

function Sun() {
	return (
		<mesh position={[15, 8, -100]}>
			<circleGeometry args={[1, 16]} />
			<meshBasicMaterial color="#fdda68" />
		</mesh>
	);
}

export default function Experience() {
	return (
		<>
			<OrbitControls makeDefault />
			<Lights />
			<Room />
			<Ocean />
			<Sky
				distance={450000}
				sunPosition={[2, 1, 8]}
				inclination={0}
				azimuth={0.25}
			/>
			<Sun />
		</>
	);
}
