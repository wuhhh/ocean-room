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

const useGlobalStore = create(set => ({
  mix: 10,
  mixProxy: 10,
  setMix: mix => set(() => ({ mix: mix })),
  setMixProxy: mix => set(() => ({ mixProxy: mix })),
}));

function UI() {
  // console.log('Render UI');

  // Mix...
  const setMix = useGlobalStore(state => state.setMix);
  const setMixProxy = useGlobalStore(state => state.setMixProxy);
  const mixControl = document.querySelector(".mix--range");

  const mix = useRef(useGlobalStore.getState().mix);
  const mixProxy = useRef(useGlobalStore.getState().mixProxy);

  useEffect(() => {
    useGlobalStore.subscribe(state => (mix.current = state.mix));
    useGlobalStore.subscribe(state => (mixProxy.current = state.mixProxy));
  }, []);

  useFrame(({ clock }, delta) => {
    // Ease mix
    let diff = mixProxy.current - mix.current;
    // Clamp delta
    delta = delta > 0.5 ? 0.5 : delta;
    setMix(mix.current + delta * diff);

    mixControl.addEventListener("input", event => {
      setMixProxy(event.target.value);
    });
  });
}

/**
 * Lights
 */

function Lights() {
  // console.log('Render Lights');

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

  useEffect(() => useGlobalStore.subscribe(state => (mix.current = state.mix)), []);

  useFrame(() => {
    ref.current.position.x = THREE.MathUtils.mapLinear(mix.current, 0, 100, 3.9, -3.9);

    let lerpedColor = new THREE.Color(props.lightColor).lerp(new THREE.Color(targetLightColor), mix.current / 100);

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
        position={[props.lightPosition.x, props.lightPosition.y, props.lightPosition.z]}
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
  // console.log('Render Room');

  const { width, height } = useThree(state => state.viewport);
  const roomSize = [1, 1, 0.57];
  const scaleMax = Math.max(width, height);
  const scaleMin = Math.min(width, height);
  const thickness = 0.15;
  const room = useRef();

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
  useEffect(() => useGlobalStore.subscribe(state => (mix.current = state.mix)), []);

  useFrame(() => {
    let lerpedColor = new THREE.Color(roomMaterialProps.color).lerp(new THREE.Color(targetRoomColor), mix.current / 100);
    room.current.material.color = lerpedColor;
  });

  return (
    /* <>
      <mesh scale={[scaleMax, scaleMax, scaleMax]}>
        <boxGeometry args={[...roomSize]} />
        <meshPhysicalMaterial wireframe={true} {...roomMaterialProps} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[scaleMax, scaleMax, scaleMax]} position={[0, 0, thickness * 0.5 * scaleMax]}>
        <boxGeometry args={[roomSize[0] - thickness, roomSize[1] - thickness, roomSize[2]]} />
        <meshPhysicalMaterial wireframe={true} />
      </mesh>
      <mesh scale={[scaleMax, scaleMax, scaleMax]} position={[0, 0, -(roomSize[2] * scaleMax * 0.5)]}>
        <boxGeometry args={[0.4, 0.4, thickness]} />
        <meshPhysicalMaterial wireframe={true} />
      </mesh>
    </> */
    <mesh ref={room} position={[0, 0, -0.5]} castShadow receiveShadow>
      <Subtraction>
        <Subtraction a>
          <Brush a scale={[width, height, scaleMax]}>
            <boxGeometry args={[...roomSize]} />
          </Brush>
          <Brush b scale={[width, height, scaleMax]} position={[0, 0, thickness * 0.5 * scaleMax]}>
            <boxGeometry args={[roomSize[0] - thickness, roomSize[1] - thickness * 0.5, roomSize[2]]} />
          </Brush>
        </Subtraction>
        <Brush b scale={[scaleMin, scaleMin, scaleMin]} position={[0, 0, -(roomSize[2] * scaleMax * 0.5)]}>
          <boxGeometry args={[0.8, 0.8, thickness * 4]} />
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
  // console.log('Render Ocean');

  extend({ Water });

  const ref = useRef();
  const gl = useThree(state => state.gl);
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

  useEffect(() => useGlobalStore.subscribe(state => (mix.current = state.mix)), []);

  useEffect(() => {
    ref.current.material.uniforms.size.value = 0.75;
  });

  useFrame((state, delta) => {
    ref.current.material.uniforms.time.value += delta * 0.1;

    let lerpedWaterColor = new THREE.Color(props.waterColor).lerp(new THREE.Color(targetWaterColor), mix.current / 100);
    ref.current.material.uniforms.waterColor.value = lerpedWaterColor;

    let lerpedSunColor = new THREE.Color(props.sunColor).lerp(new THREE.Color(targetSunColor), mix.current / 100);
    ref.current.material.uniforms.sunColor.value = lerpedSunColor;
  });

  return <water ref={ref} args={[geom, { ...config, ...props }]} position={[0, -4, -25]} rotation-x={-Math.PI / 2} />;
}

/**
 * Sun
 */

function Sun() {
  // console.log('Render Sun');

  const ref = useRef();
  const sunColor = "#fdda68";
  const targetSunColor = "#f3fffd";
  const mix = useRef(useGlobalStore.getState().mix);

  const HalfLightMaterial = shaderMaterial(
    {
      color: new THREE.Color(sunColor),
    },
    // vertex shader
    /*glsl*/ `
		uniform vec3 color;
		varying vec2 vUv;
		varying vec3 vColor;

		void main() {
			vUv = uv;
			vColor = color;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
    // fragment shader
    /*glsl*/ `
		varying vec2 vUv;
		varying vec3 vColor;

		void main() {
			float cHalf = step(vUv.x, 0.5);
			gl_FragColor.rgba = vec4(vColor, cHalf);
		}
	`
  );

  extend({ HalfLightMaterial });

  useEffect(() => useGlobalStore.subscribe(state => (mix.current = state.mix)), []);

  useFrame(() => {
    ref.current.position.x = THREE.MathUtils.mapLinear(mix.current, 0, 100, 15, -15);

    ref.current.rotation.y = THREE.MathUtils.mapLinear(mix.current, 0, 100, 0, -Math.PI * 0.55);

    let lerpedSunColor = new THREE.Color(sunColor).lerp(new THREE.Color(targetSunColor), mix.current / 100);
    ref.current.material.uniforms.color.value = lerpedSunColor;
  });

  return (
    <mesh ref={ref} position={[15, 4, -100]}>
      <sphereGeometry args={[0.75, 32, 32]} />
      <halfLightMaterial transparent={true} />
    </mesh>
  );
}

/**
 * Sky
 */

function Sky() {
  // console.log('Render Sky');

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

  useEffect(() => useGlobalStore.subscribe(state => (mix.current = state.mix)), []);

  useFrame((state, delta) => {
    let lerpedColor1 = new THREE.Color(props.color1).lerp(new THREE.Color(targetColor1), mix.current / 100);

    let lerpedColor2 = new THREE.Color(props.color2).lerp(new THREE.Color(targetColor2), mix.current / 100);

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
  // console.log('Render Experience');

  return (
    <>
      <Leva hidden />
      <UI />
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.1}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 16}
        maxAzimuthAngle={Math.PI / 16}
        rotateSpeed='0.075'
        dampingFactor='0.025'
      />
      <Lights />
      <Room />
      <Ocean />
      <Sky />
      <Sun />
    </>
  );
}
