import "./style.css";
import * as THREE from "three";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import Experience from "./Experience.jsx";
// import { Perf } from "r3f-perf";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
	<Canvas
		shadows={{
			enabled: true,
			// type: THREE.BasicShadowMap,
			// type: THREE.PCFShadowMap,
			type: THREE.PCFSoftShadowMap,
			// type: THREE.VSMShadowMap,
		}}
		camera={{
			fov: 45,
			near: 0.1,
			far: 200,
			position: [0, 0, 9],
		}}
		gl={{
			toneMapping: THREE.ACESFilmicToneMapping,
			toneMappingExposure: 0.8,
			physicallyCorrectLights: false,
		}}
	>
		{/* <Perf position="top-left" minimal /> */}
		<Experience />
	</Canvas>
);
