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
    this.rotationSpeed = options.rotationSpeed || 5.0;
    this.jumpForce = options.jumpForce || 15.0;
    
    // Physics parameters
    this.moveDirection = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.isGrounded = false;
    this.airControl = 0.5;
    this.wasJumpPressed = false;
    
    // Movement enhancement parameters
    this.acceleration = options.acceleration || 20.0;
    this.deceleration = options.deceleration || 10.0;
    this.currentSpeed = 0;
    
    // Create character visual representation
    this.createMesh();
    
    // Create character physics body
    this.createPhysicsBody();
    
    // Movement temporary vectors
    this._tmpVec3 = new THREE.Vector3();
    this._tmpQuat = new THREE.Quaternion();
    this._targetRotation = new THREE.Quaternion();
  }
  
  createMesh() {
    const capsuleHeight = this.height - this.radius * 2;
    const geometry = new THREE.CapsuleGeometry(this.radius, capsuleHeight, 8, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4CAF50,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.scene.add(this.mesh);
    
    const indicatorGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.4);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.directionIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.directionIndicator.position.set(0, 0, this.radius + 0.1);
    this.mesh.add(this.directionIndicator);
  }
  
  createPhysicsBody() {
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(this.position.x, this.position.y, this.position.z)
      .setLinearDamping(0.5)
      .setAngularDamping(1.0)
      .lockRotations();
    
    this.rigidBody = this.world.createRigidBody(rigidBodyDesc);
    
    const capsuleHeight = this.height - this.radius * 2;
    const colliderDesc = RAPIER.ColliderDesc.capsule(capsuleHeight / 2, this.radius)
      .setFriction(0.7)
      .setRestitution(0.2);
    
    this.collider = this.world.createCollider(colliderDesc, this.rigidBody);
  }

  checkGrounded() {
    const translation = this.rigidBody.translation();
    const rayOrigin = new RAPIER.Vector3(
      translation.x,
      translation.y - (this.height / 2) + this.radius + 0.01,
      translation.z
    );
    const rayDir = new RAPIER.Vector3(0, -1, 0);
    const ray = new RAPIER.Ray(rayOrigin, rayDir);
    const maxToi = 0.2;
    
    const hit = this.world.castRay(ray, maxToi, true, null, null, this.collider);
    this.isGrounded = !!hit;
    return this.isGrounded;
  }
  
  update(inputs, deltaTime, camera) {
    this.checkGrounded();
    
    this.moveDirection.set(0, 0, 0);
    
    const cameraQuaternion = camera ? camera.quaternion : new THREE.Quaternion();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuaternion);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion);
    right.y = 0;
    right.normalize();
    
    if (inputs.forward) this.moveDirection.add(forward);
    if (inputs.backward) this.moveDirection.sub(forward);
    if (inputs.left) this.moveDirection.sub(right);
    if (inputs.right) this.moveDirection.add(right);
    
    const isMoving = this.moveDirection.lengthSq() > 0;
    if (isMoving) {
      this.moveDirection.normalize();
      this._targetRotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.moveDirection);
      this.mesh.quaternion.slerp(this._targetRotation, deltaTime * this.rotationSpeed);
    }
    
    const linvel = this.rigidBody.linvel();
    this.velocity.set(linvel.x, linvel.y, linvel.z);
    
    if (inputs.jump && !this.wasJumpPressed && this.isGrounded) {
      const jumpImpulse = new RAPIER.Vector3(0, this.jumpForce, 0);
      this.rigidBody.applyImpulse(jumpImpulse, true);
    }
    
    let targetSpeed = 0;
    if (isMoving) {
      targetSpeed = this.maxSpeed;
      if (!this.isGrounded) {
        targetSpeed *= this.airControl;
      }
      this.currentSpeed = Math.min(
        this.currentSpeed + this.acceleration * deltaTime,
        targetSpeed
      );
    } else {
      this.currentSpeed = Math.max(
        this.currentSpeed - this.deceleration * deltaTime,
        0
      );
    }
    
    this._tmpVec3.copy(this.moveDirection).multiplyScalar(this.currentSpeed);
    this.rigidBody.setLinvel(
      new RAPIER.Vector3(this._tmpVec3.x, this.velocity.y, this._tmpVec3.z),
      true
    );
    
    const position = this.rigidBody.translation();
    this.mesh.position.set(position.x, position.y, position.z);
    
    this.wasJumpPressed = inputs.jump;
  }
}