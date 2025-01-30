# WebGL2 Graphics Engine

A simple graphics engine built from scratch using WebGL2 and JavaScript. 

## Features

### Core Rendering
- **Advanced Shading System**
  - Lambert-Phong illumination model
  - Normal mapping support
  - Custom lightning shader implementation

<img src="res/lights.gif" width="800"/>

- **Lighting System**
  - Directional lights
  - Point lights
  - Spot lights
  - Dynamic lighting with lit/unlit states

<img src="res/sniper.gif" width="600"/>

- **Scene Management**
  - Optimized bounding volume hierarchy (BVH)
  - Multiple bounding volume types (AABB, OBB, Sphere)
  - Dynamic renderer with state management

### Asset Pipeline
- **GLTF Support**
  - Full scene loading
  - Animation system integration
  - Material and lighting import
  - BVH structure loading - defined in blender
  - Custom asset processing pipeline

- **Asset Management**
  - Centralized model loading
  - Image resource handling
  - Audio asset management
  - Resource optimization and caching

### Gameplay Features
<img src="res/rifle.gif" width="600"/>

- **Interactive Systems**
  - Gun mechanics with raycasting
  - Projectile physics simulation
  - Collision detection using BVH

- **Visual Effects**
  - Laser effects
  - Explosion systems
  - Fire particle effects
  - Custom VFX pipeline

### Technical Features
- **Animation System**
  - Keyframe animation support
  - Skeletal animation
  - Animation blending

- **User Interface**
  - Custom HUD system
  - Flexible UI renderer
  - Performance-optimized overlay system

Full video: https://www.youtube.com/watch?v=wL8NBstLgPM