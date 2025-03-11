import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { CharacterController } from './components/CharacterController.js';
import { createScene } from './components/Scene.js';
import { ThirdPersonCamera } from './components/ThirdPersonCamera.js';
import { InputManager } from './utils/InputManager.js';

// Global variables
let world, scene, renderer, camera, character, thirdPersonCamera, inputManager;
let lastTime = 0;
const physicsClock = new THREE.Clock();

// Initialize the game
async function init() {
  // Show loading screen until everything is ready
  const loadingScreen = document.getElementById('loading-screen');
  
  // Wait for RAPIER to initialize
  await RAPIER.init();
  
  // Create the renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game'),
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Create physics world
  world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
  
  // Create scene and camera
  const { sceneObj, ground } = createScene(world);
  scene = sceneObj;
  
  // Create perspective camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // Create character controller
  character = new CharacterController(world, scene, {
    position: new THREE.Vector3(0, 3, 0),
    radius: 0.5,
    height: 1.75,
    jumpForce: 10
  });
  
  // Create third-person camera
  thirdPersonCamera = new ThirdPersonCamera(camera, character.mesh, {
    distance: 5,
    height: 2
  });
  
  // Setup input manager
  inputManager = new InputManager();
  inputManager.initialize();
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Hide loading screen
  loadingScreen.classList.add('hidden');
  
  // Start the game loop
  requestAnimationFrame(gameLoop);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main game loop
function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = physicsClock.getDelta();
  
  // Step the physics world
  world.step();
  
  // Update character controller based on inputs
  character.update({
    forward: inputManager.keys.forward,
    backward: inputManager.keys.backward,
    left: inputManager.keys.left,
    right: inputManager.keys.right,
    jump: inputManager.keys.jump
  }, deltaTime);
  
  // Update camera position
  thirdPersonCamera.update(deltaTime, inputManager.mouseDelta);
  inputManager.resetMouseDelta();
  
  // Render the scene
  renderer.render(scene, camera);
}

// Initialize the game when the page loads
window.addEventListener('load', init); 