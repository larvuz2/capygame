import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CharacterController } from './components/CharacterController';

// Initialize Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
camera.position.set(0, 5, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.5;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  roughness: 0.8,
  metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Initialize RAPIER physics
let world;
let character;
let lastTime = 0;
const inputs = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false
};

async function initPhysics() {
  await RAPIER.init();
  
  world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
  
  // Ground collider
  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0)
    .setTranslation(0.0, -0.1, 0.0)
    .setFriction(0.7)
    .setRestitution(0.3);
  world.createCollider(groundColliderDesc);
  
  // Create character
  character = new CharacterController(world, scene, {
    position: new THREE.Vector3(0, 1.0, 0),
    radius: 0.5,
    height: 2.0,
    maxSpeed: 5.0,
    jumpForce: 7.0
  });
  
  // Start animation loop
  animate();
}

// Input handling
function handleKeyDown(event) {
  switch (event.code) {
    case 'KeyW':
      inputs.forward = true;
      break;
    case 'KeyS':
      inputs.backward = true;
      break;
    case 'KeyA':
      inputs.left = true;
      break;
    case 'KeyD':
      inputs.right = true;
      break;
    case 'Space':
      inputs.jump = true;
      break;
  }
}

function handleKeyUp(event) {
  switch (event.code) {
    case 'KeyW':
      inputs.forward = false;
      break;
    case 'KeyS':
      inputs.backward = false;
      break;
    case 'KeyA':
      inputs.left = false;
      break;
    case 'KeyD':
      inputs.right = false;
      break;
    case 'Space':
      inputs.jump = false;
      break;
  }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// Animation loop
function animate(currentTime = 0) {
  requestAnimationFrame(animate);
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  if (world && character) {
    world.step();
    character.update(inputs, deltaTime, camera);
    
    // Update camera to follow character
    const characterPosition = character.mesh.position;
    const cameraOffset = new THREE.Vector3(0, 3, 7);
    camera.position.copy(characterPosition).add(cameraOffset);
    controls.target.copy(characterPosition);
    controls.update();
  }
  
  renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// Initialize the game
initPhysics();