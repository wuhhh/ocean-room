import { extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial, OrbitControls } from "@react-three/drei";
import { Brush, Subtraction } from "@react-three/csg";
import { useControls } from "leva";
import { useMemo, useRef } from "react";
import { Water } from "three-stdlib";
import { useEffect } from "react";

extend({ Water });

/**
 * Lights
 */

function Lights() {
	const { lightPosition, lightColor, lightIntensity, ambient } = useControls(
		"Lights",
		{
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
		},
		{ collapsed: true }
	);

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

	const { roomSize, wallThickness, windowSize } = useControls(
		"Room",
		{
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
		},
		{ collapsed: true }
	);

	const roomMaterialProps = useControls(
		"Room Material",
		{
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
		},
		{ collapsed: true }
	);

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
	const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpeg");
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

	const geom = useMemo(() => new THREE.PlaneGeometry(50, 50), []);
	const props = useControls(
		"Ocean",
		{
			sunDirection: new THREE.Vector3(5, 12, -100),
			sunColor: "#f8c08a",
			waterColor: "#93b8c7",
			distortionScale: 4,
		},
		{ collapsed: true }
	);

	const config = useMemo(
		() => ({
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: waterNormals,
			fog: false,
			size: 999999.0,
			format: gl.encoding,
		}),
		[waterNormals]
	);
	useEffect(() => {
		ref.current.material.uniforms.size.value = 0.75;
	});
	useFrame((state, delta) => {
		// if(lerpAmt < 1) { lerpAmt += delta * 0.1; }
		ref.current.material.uniforms.time.value += delta * 0.1;
		// ref.current.material.uniforms.waterColor.value = new THREE.Color(props.waterColor).lerp(new THREE.Color(0xff0000), lerpAmt);
	});

	return (
		<water
			ref={ref}
			args={[geom, { ...config, ...props }]}
			position={[0, -4, -25]}
			rotation-x={-Math.PI / 2}
		/>
	);
}

/**
 * Sun
 */

function Sun() {
	return (
		<mesh position={[15, 4, -100]}>
			<circleGeometry args={[0.75, 32]} />
			<meshBasicMaterial color="#fdda68" />
		</mesh>
	);
}

/**
 * Sky
 */

function Sky() {
	const mesh = useRef();
	const props = useControls('Sky', {
		color1: '#e2dac3',
		color2: '#6ed5e2',
	}, { collapsed: true });

	useFrame(() => {
		mesh.current.material.uniforms.color1.value = new THREE.Color(props.color1);
		mesh.current.material.uniforms.color2.value = new THREE.Color(props.color2);
	})

	const GradientMaterial = shaderMaterial(
		{
			color1: new THREE.Color(props.color1),
			color2: new THREE.Color(props.color2)
		},
		// vertex shader
		/*glsl*/`
			uniform vec3 color1;
			uniform vec3 color2;

			varying vec2 vUv;
			varying vec3 vColor1;
			varying vec3 vColor2;

			void main() {
					vUv = uv;
					vColor1 = color1;
					vColor2 = color2;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		// fragment shader
		/*glsl*/`
			varying vec2 vUv;
			varying vec3 vColor1;
			varying vec3 vColor2;

			vec3 getGradient(vec4 c1, vec4 c2, float value_) {
				float blend1 = smoothstep(c1.w, c2.w, value_);
				vec3 col = mix(c1.rgb, c2.rgb, blend1);
				return col;
			}

			void main() {
				vec3 gradient = getGradient(
					vec4(vec3(vColor1), 0.0), 
					vec4(vec3(vColor2), 0.33), 
					vUv.y
				);
				gl_FragColor = vec4(gradient,1.0);
			}
		`
	)
	
	extend({ GradientMaterial })

	return (
		<mesh ref={mesh} position={[0, 16, -101]}>
			<planeGeometry args={[100, 50]} />
			<gradientMaterial />
		</mesh>
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
			<Sky />
			<Sun />
		</>
	);
}
