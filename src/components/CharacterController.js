import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

export class CharacterController {
  constructor(world, scene, options = {}) {
    this.world = world;
    this.scene = scene;
    
    // Character parameters
    this.radius = options.radius || 0.5;
    this.height = options.height || 2.0;
    this.position = options.position || new THREE.Vector3(0, 3, 0);
    this.maxSpeed = options.maxSpeed || 5.0;
    this.jumpForce = options.jumpForce || 10.0;
    this.rotationSpeed = options.rotationSpeed || 5.0;
    
    // Physics parameters
    this.moveDirection = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.isGrounded = false;
    this.isJumping = false;
    this.airControl = 0.3; // Reduced control in the air
    
    // Create character visual representation
    this.createMesh();
    
    // Create character physics body
    this.createPhysicsBody();
    
    // Movement temporary vectors (reused to avoid garbage collection)
    this._tmpVec3 = new THREE.Vector3();
    this._tmpQuat = new THREE.Quaternion();
    this._targetRotation = new THREE.Quaternion();
  }
  
  createMesh() {
    // Create capsule geometry with specified radius and height
    const capsuleHeight = this.height - this.radius * 2;
    const geometry = new THREE.CapsuleGeometry(this.radius, capsuleHeight, 8, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFF7043,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Create mesh and add to scene
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.scene.add(this.mesh);
    
    // Add a direction indicator to see where the character is facing
    const indicatorGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.4);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.directionIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.directionIndicator.position.set(0, 0, this.radius + 0.1);
    this.mesh.add(this.directionIndicator);
  }
  
  createPhysicsBody() {
    // Create rigid body description for capsule
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(this.position.x, this.position.y, this.position.z)
      .setLinearDamping(0.5)
      .setAngularDamping(1.0)
      .lockRotations(); // Lock rotations so the capsule doesn't tip over
    
    this.rigidBody = this.world.createRigidBody(rigidBodyDesc);
    
    // Create capsule collider
    const capsuleHeight = this.height - this.radius * 2;
    const colliderDesc = RAPIER.ColliderDesc.capsule(capsuleHeight / 2, this.radius)
      .setFriction(0.7)
      .setRestitution(0.2);
    
    // Create collider and attach it to the rigid body
    this.collider = this.world.createCollider(colliderDesc, this.rigidBody);
  }
  
  update(inputs, deltaTime) {
    // Check if character is on the ground
    this.checkGrounded();
    
    // Movement direction based on inputs
    this.moveDirection.set(0, 0, 0);
    
    // Get camera forward and right directions for movement relative to camera
    const cameraDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion);
    
    // Apply input to movement direction
    if (inputs.forward) this.moveDirection.sub(cameraDirection);
    if (inputs.backward) this.moveDirection.add(cameraDirection);
    if (inputs.left) this.moveDirection.sub(cameraRight);
    if (inputs.right) this.moveDirection.add(cameraRight);
    
    // Normalize direction vector if we're moving
    if (this.moveDirection.lengthSq() > 0) {
      this.moveDirection.normalize();
      
      // Compute target rotation based on movement direction
      this._targetRotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.moveDirection);
      
      // Smoothly rotate towards movement direction
      this.mesh.quaternion.slerp(this._targetRotation, deltaTime * this.rotationSpeed);
    }
    
    // Get current velocity
    const linvel = this.rigidBody.linvel();
    this.velocity.set(linvel.x, linvel.y, linvel.z);
    
    // Apply movement force
    let speed = this.maxSpeed;
    if (!this.isGrounded) {
      // Reduce control in the air
      speed *= this.airControl;
    }
    
    // Apply horizontal movement
    this._tmpVec3.copy(this.moveDirection).multiplyScalar(speed);
    
    // Only update X and Z velocity, preserve Y velocity (for jumps/gravity)
    this.rigidBody.setLinvel(
      new RAPIER.Vector3(this._tmpVec3.x, this.velocity.y, this._tmpVec3.z),
      true
    );
    
    // Jump logic
    if (inputs.jump && this.isGrounded && !this.isJumping) {
      this.jump();
    }
    
    // Update mesh position based on physics body
    const position = this.rigidBody.translation();
    this.mesh.position.set(position.x, position.y, position.z);
  }
  
  jump() {
    this.isJumping = true;
    this.isGrounded = false;
    
    // Apply upward force for jumping
    this.rigidBody.applyImpulse(new RAPIER.Vector3(0, this.jumpForce, 0), true);
    
    // Reset jump state after a short delay
    setTimeout(() => {
      this.isJumping = false;
    }, 300);
  }
  
  checkGrounded() {
    // Get character position
    const position = this.rigidBody.translation();
    
    // Create a ray starting a bit inside the character and pointing down
    const origin = new RAPIER.Vector3(position.x, position.y, position.z);
    const direction = new RAPIER.Vector3(0, -1, 0);
    
    // Ray length is slightly more than the distance from center to bottom of capsule
    const rayLength = this.height / 2 + 0.1;
    
    // Cast ray and check for intersection
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRay(ray, rayLength, true);
    
    // If we hit something and it's close enough, we're grounded
    this.isGrounded = hit !== null && hit.toi <= rayLength;
    
    return this.isGrounded;
  }
} 