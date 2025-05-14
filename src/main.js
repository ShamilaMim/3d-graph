
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// 🎯 Scene, Camera & Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const fixedWidth = 800, fixedHeight = 600;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(fixedWidth, fixedHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(50, fixedWidth / fixedHeight, 0.1, 1000);
camera.position.set(20, 15, 20);

// 📌 Grid Helper
let zoomScale = 5, gridSize = 15;
let gridHelper = new THREE.GridHelper(gridSize, gridSize);
scene.add(gridHelper);

// 🖱️ OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;

// ✏️ Load Font for Axis Labels
const fontLoader = new FontLoader();
let axisLabels = [];

fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
    addAxisLabels(font);
});

// ✍️ Add Axis Labels
// function addAxisLabels(font) {
//     const labelData = [
//         { text: "X", color: 0xff0000 },
//         { text: "Z", color: 0x00ff00 },
//         { text: "Y", color: 0x0000ff },
//     ];

//     labelData.forEach(({ text, color }) => {
//         const textMesh = new THREE.Mesh(
//             new TextGeometry(text, { font, size: 1, height: 0.1 }),
//             new THREE.MeshBasicMaterial({ color })
//         );
//         scene.add(textMesh);
//         axisLabels.push(textMesh);
//     });

//     // updateLabelPositions();
// }
window.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomScale *= event.deltaY > 0 ? 1.1 : 0.9;
    zoomScale = Math.max(2, Math.min(40, zoomScale));

    // 🔄 Update Grid (Keep size fixed, change divisions)
    scene.remove(gridHelper);
    gridHelper = new THREE.GridHelper(15, Math.round(15 / zoomScale) * 10);
    scene.add(gridHelper);

    // 🔄 Scale Surface Mesh (Only when zoomScale is within range)
    if (zoomScale > 2 && zoomScale < 40 && surfaceMesh) {
        // surfaceMesh.scale.set(zoomScale / 5, zoomScale / 5, zoomScale / 5);
        updateGraph();
    }

    // 🔄 Update Graph & Labels
    updateGraph();
}, { passive: false });





// window.addEventListener("wheel", (event) => {
//     event.preventDefault();
//     zoomScale *= event.deltaY > 0 ? 1.1 : 0.9;
//     zoomScale = Math.max(2, Math.min(50, zoomScale));

//     // 🔄 Update Grid
//     scene.remove(gridHelper);
//     gridHelper = new THREE.GridHelper(15, Math.round(15 / zoomScale) * 10); // 15 ফিক্সড, কিন্তু divisions বদলাবে
//     scene.add(gridHelper);

//     // 🔄 Update Graph & Labels
//     updateGraph();
//     updateLabelPositions();
// }, { passive: false });


// 🏷️ Update Label Positions
function updateLabelPositions() {
    if (axisLabels.length === 3) {
        const labelOffset = gridSize * 0.55;
        axisLabels[0].position.set(labelOffset, 0, 0); // X-axis
        axisLabels[1].position.set(0, 7, 0); // Y-axis
        axisLabels[2].position.set(0, 0, labelOffset); // Z-axis
    }
}

// 🟢 Mesh Variables
let surfaceMesh = null;

// ✅ Convert math symbols (e.g., x^2 → Math.pow(x,2), root(x) → Math.sqrt(x))
function parseEquation(equation) {
    return equation
    .replace(/\^(\d+)/g, "Math.pow($1)")
    .replace(/root\((.*?)\)/g, "Math.sqrt($1)")
    .replace(/\b(sin|cos|tan|exp|log|sqrt|abs|round|floor|ceil)\b/g, "Math.$1");
}

// ✅ Safe Function Evaluation
function safeEvalEquation(equation, x, y) {
    try {
        return new Function("x", "y", `return ${equation}`)(x, y);
    } catch (error) {
        console.error("Invalid Equation:", error);
        return 0;
    }
}

// 🎨 Create a 3D Surface Mesh from an Equation
function createSurface(equation, size = zoomScale, resolution = 50) {
    if (surfaceMesh) scene.remove(surfaceMesh);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    const step = size / resolution;

    // 🟢 Generate Grid Vertices
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            let x = -size / 2 + i * step;
            let y = -size / 2 + j * step;
            let z = safeEvalEquation(equation, x, y);
            vertices.push(x, z, y);
        }
    }

    // 🔺 Create Triangles (Faces)
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            let a = i * (resolution + 1) + j;
            let b = a + 1;
            let c = (i + 1) * (resolution + 1) + j;
            let d = c + 1;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    // 🔹 Assign vertices & indices
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // 🎨 Material & Mesh (With Bright Effect)
    const material = new THREE.MeshStandardMaterial({
        color: "purple",
        emissive: "purple",
        roughness: 0.2,
        metalness: 0.3,
        side: THREE.DoubleSide
    });

    surfaceMesh = new THREE.Mesh(geometry, material);
    scene.add(surfaceMesh);
}

// ✅ Update Graph on Button Click
window.updateGraph = function () {
    const rawEquation = document.getElementById("equation")?.value || "Math.sin(x*y) * 2";
    const parsedEquation = parseEquation(rawEquation);
    createSurface(parsedEquation);
};

// 💡 Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// 🔄 Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
