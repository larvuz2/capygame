# CapyGame

A simple physics-based 3D game with a character controller using Three.js and Rapier physics engine.

![CapyGame Screenshot](screenshot.png)

## Features

- Physics-based character controller with capsule collider
- WASD movement and space to jump
- Third-person camera that follows the player
- Dynamic physics simulation using Rapier
- Simple 3D environment with obstacles
- Responsive design that works on various screen sizes

## Technologies Used

- [Three.js](https://threejs.org/) - 3D rendering engine
- [Rapier](https://rapier.rs/) - Physics engine (via @dimforge/rapier3d-compat)
- [Vite](https://vitejs.dev/) - Fast development environment and bundler

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/capygame.git
   cd capygame
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Controls

- **WASD** - Move the character
- **Space** - Jump
- **Mouse** - Look around (click on the game to enable mouse control)
- **Escape** - Release mouse control

## Project Structure

```
capygame/
├── index.html          # Main HTML file
├── style.css           # Global styles
├── src/                # Source code
│   ├── main.js         # Entry point
│   ├── components/     # Game components
│   │   ├── CharacterController.js  # Physics-based character
│   │   ├── Scene.js                # Scene setup and environment
│   │   └── ThirdPersonCamera.js    # Camera controller
│   └── utils/          # Utilities
│       └── InputManager.js         # Handles user input
├── package.json        # Project dependencies and scripts
└── README.md           # This file
```

## Building for Production

To build the project for production:

```bash
npm run build
```

This will generate optimized files in the `dist` directory that can be deployed to a static hosting service.

## Deployment

### Deploying to Netlify

The game is configured to be easily deployed to Netlify:

1. Push your repository to GitHub
2. Connect your repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

Netlify will automatically deploy your site and update it when you push changes to your repository.

## Development Notes

- The physics engine (Rapier) is initialized asynchronously at startup
- The character controller uses a capsule collider for smooth movement
- The third-person camera system includes collision avoidance
- Ground detection is performed using raycasting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Three.js Documentation](https://threejs.org/docs/)
- [Rapier Physics Engine](https://rapier.rs/)
- [Vite Documentation](https://vitejs.dev/guide/) 