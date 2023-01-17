import { extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { Brush, Subtraction } from "@react-three/csg";
import { Leva, useControls } from "leva";
import { useEffect, useMemo, useRef } from "react";
import { Water } from "three-stdlib";
import create from "zustand";

/**
 * UI / Window / Global
 */

const useGlobalStore = create((set) => ({
	mix: 0,
	mixProxy: 0,
	setMix: (mix) => set(() => ({ mix: mix })),
	setMixProxy: (mix) => set(() => ({ mixProxy: mix })),
	mouse: [0, 0],
	setMouse: (mouse) => set(() => ({ mouse: mouse })),
}));

function UI() {
	// Mix...
	const setMix = useGlobalStore((state) => state.setMix);
	const setMixProxy = useGlobalStore((state) => state.setMixProxy);
	const setMouse = useGlobalStore((state) => state.setMouse);
	const mixControl = document.querySelector("#mix");

	const mix = useRef(useGlobalStore.getState().mix);
	const mixProxy = useRef(useGlobalStore.getState().mixProxy);
	const mouse = useRef(useGlobalStore.getState().mouse);

	useEffect(() => {
		// Mouse...
		window.addEventListener("mousemove", (event) => {
			setMouse([event.pageX, event.pageY]);
		});

		mixControl.addEventListener("input", (event) => {
			setMixProxy(event.target.value);
		});

		useGlobalStore.subscribe((state) => (mix.current = state.mix));
		useGlobalStore.subscribe((state) => (mixProxy.current = state.mixProxy));
		useGlobalStore.subscribe((state) => (mouse.current = state.mouse));
	}, []);

	useFrame((state) => {
		// Ease mix
		let diff = mixProxy.current - mix.current;
		setMix(mix.current + 0.01 * diff);
	});
}

/**
 * Lights
 */

function Lights() {
	const ref = useRef();
	const props = useControls(
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

	const targetLightColor = "#8bcff7";
	const mix = useRef(useGlobalStore.getState().mix);

	useEffect(
		() => useGlobalStore.subscribe((state) => (mix.current = state.mix)),
		[]
	);

	useFrame(() => {
		ref.current.position.x = THREE.MathUtils.mapLinear(
			mix.current,
			0,
			100,
			3.9,
			-3.9
		);

		let lerpedColor = new THREE.Color(props.lightColor).lerp(
			new THREE.Color(targetLightColor),
			mix.current / 100
		);

		ref.current.color = lerpedColor;
	});

	return (
		<>
			<directionalLight
				ref={ref}
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
				color={props.lightColor}
				position={[
					props.lightPosition.x,
					props.lightPosition.y,
					props.lightPosition.z,
				]}
				intensity={props.lightIntensity}
			/>
			<ambientLight intensity={props.ambient} />
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
				value: 1.0,
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
				value: 1.0,
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

	const targetRoomColor = "#616d83";
	const mix = useRef(useGlobalStore.getState().mix);
	useEffect(
		() => useGlobalStore.subscribe((state) => (mix.current = state.mix)),
		[]
	);

	useFrame(() => {
		let lerpedColor = new THREE.Color(roomMaterialProps.color).lerp(
			new THREE.Color(targetRoomColor),
			mix.current / 100
		);
		room.current.material.color = lerpedColor;
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
			<meshPhysicalMaterial {...roomMaterialProps} side={THREE.DoubleSide} />
		</mesh>
	);
}

/**
 * Ocean
 */

function Ocean() {
	extend({ Water });

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

	const targetSunColor = "#8ea6ad";
	const targetWaterColor = "#547583";

	const mix = useRef(useGlobalStore.getState().mix);

	useEffect(
		() => useGlobalStore.subscribe((state) => (mix.current = state.mix)),
		[]
	);

	useEffect(() => {
		ref.current.material.uniforms.size.value = 0.75;
	});

	useFrame((state, delta) => {
		ref.current.material.uniforms.time.value += delta * 0.1;

		let lerpedWaterColor = new THREE.Color(props.waterColor).lerp(
			new THREE.Color(targetWaterColor),
			mix.current / 100
		);
		ref.current.material.uniforms.waterColor.value = lerpedWaterColor;

		let lerpedSunColor = new THREE.Color(props.sunColor).lerp(
			new THREE.Color(targetSunColor),
			mix.current / 100
		);
		ref.current.material.uniforms.sunColor.value = lerpedSunColor;
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
	const ref = useRef();

	const props = useControls(
		"Sun",
		{
			position: [15, 4, -100],
			color: "#fdda68",
		},
		{ collapsed: true }
	);

	const targetSunColor = "#fc9f68";
	const mix = useRef(useGlobalStore.getState().mix);

	useEffect(
		() => useGlobalStore.subscribe((state) => (mix.current = state.mix)),
		[]
	);

	useFrame(() => {
		ref.current.position.x = THREE.MathUtils.mapLinear(
			mix.current,
			0,
			100,
			15,
			-15
		);

		let lerpedSunColor = new THREE.Color(props.color).lerp(
			new THREE.Color(targetSunColor),
			mix.current / 100
		);
		ref.current.material.color = lerpedSunColor;
	});

	return (
		<mesh ref={ref} position={props.position}>
			<circleGeometry args={[0.75, 32]} />
			<meshBasicMaterial color={props.color} />
		</mesh>
	);
}

/**
 * Sky
 */

function Sky() {
	const mesh = useRef();
	const props = useControls(
		"Sky",
		{
			color1: "#e2dac3",
			color2: "#6ed5e2",
		},
		{ collapsed: true }
	);

	const targetColor1 = "#4f7fbe";
	const targetColor2 = "#536989";

	const mix = useRef(useGlobalStore.getState().mix);

	useEffect(
		() => useGlobalStore.subscribe((state) => (mix.current = state.mix)),
		[]
	);

	useFrame((state, delta) => {
		let lerpedColor1 = new THREE.Color(props.color1).lerp(
			new THREE.Color(targetColor1),
			mix.current / 100
		);

		let lerpedColor2 = new THREE.Color(props.color2).lerp(
			new THREE.Color(targetColor2),
			mix.current / 100
		);

		mesh.current.material.uniforms.color1.value = lerpedColor1;
		mesh.current.material.uniforms.color2.value = lerpedColor2;
	});

	const GradientMaterial = shaderMaterial(
		{
			color1: new THREE.Color(props.color1),
			color2: new THREE.Color(props.color2),
		},
		// vertex shader
		/*glsl*/ `
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
		/*glsl*/ `
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
	);

	extend({ GradientMaterial });

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
			<Leva hidden />
			<UI />
			<OrbitControls 
				makeDefault
				enableZoom="false" 
				enablePan="false" 
				minPolarAngle={Math.PI / 2.1} 
				maxPolarAngle={Math.PI / 1.9} 
				minAzimuthAngle={- Math.PI / 16}
				maxAzimuthAngle={Math.PI / 16}
				rotateSpeed="0.075"
				dampingFactor="0.025"
			/>
			<Lights />
			<Room />
			<Ocean />
			<Sky />
			<Sun />
		</>
	);
}
