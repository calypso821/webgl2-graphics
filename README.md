# WebGL2 Graphics Framework

A simple graphics framework built from scratch using WebGL2 and JavaScript. 

<img src="res/lights.gif" width="850"/>

## Features

### Core Rendering
- **Advanced Shading System**
  - Lambert-Phong illumination model
  - Normal mapping support
  - Custom lightning shader implementation

- **Lighting System**
  - Directional lights
  - Point lights
  - Spot lights
  - Dynamic lighting with lit/unlit states

- **Scene Management**
  - Optimized bounding volume hierarchy (BVH)
  - Multiple bounding volume types (AABB, OBB, Sphere)
  - Dynamic renderer with state management
 
<img src="res/rifle.gif" width="650"/>

### Gameplay Features

- **Interactive Systems**
  - Gun mechanics with raycasting
  - Projectile physics simulation
  - Collision detection using BVH

- **Visual Effects**
  - Laser effects
  - Explosion systems
  - Fire particle effects
  - Custom VFX pipeline
  
 <img src="res/sniper.gif" width="650"/>

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
