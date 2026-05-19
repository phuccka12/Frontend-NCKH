'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSimulatorProps {
  airplane: { x: number; y: number; angle: number; vx: number; vy: number };
  detectedGesture: string;
  isRunning: boolean;
}

export const ThreeSimulator: React.FC<ThreeSimulatorProps> = ({
  airplane,
  detectedGesture,
  isRunning,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 350;

    // 1. CREATE SCENE & DUSK NIGHT BACKGROUND (Midnight Space Navy)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712'); // Deep midnight charcoal

    // Exponential fog for atmospheric depth and volumetric light scatter
    scene.fog = new THREE.FogExp2('#0b0f19', 0.02);

    // 2. CAMERA SETUP (Cinematic Tower Perspective)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 8, 25);
    camera.lookAt(0, 1.0, -2);

    // 3. RENDERER SETUP (High Fidelity with PCFSoft Shadows)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Mount to DOM
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. ATMOSPHERIC LIGHTING (Dramatic Night Glow)
    // Dark blue ambient light for airport sky ambient bounce
    const ambientLight = new THREE.AmbientLight('#1e293b', 0.8);
    scene.add(ambientLight);

    // Moon Light / Far floodlight (Casts soft shadows)
    const moonLight = new THREE.DirectionalLight('#38bdf8', 1.8); // Cyan moon hue
    moonLight.position.set(20, 40, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.bias = -0.001;
    scene.add(moonLight);

    // Neon Runway approach PointLights
    const leftRunwayGlow = new THREE.PointLight('#3b82f6', 2.0, 15);
    leftRunwayGlow.position.set(-6, 0.5, 8);
    scene.add(leftRunwayGlow);

    const rightRunwayGlow = new THREE.PointLight('#3b82f6', 2.0, 15);
    rightRunwayGlow.position.set(6, 0.5, 8);
    scene.add(rightRunwayGlow);

    // 5. PREMIUM SCENERY & HIGHLY DETAILED TERMINAL BUILDINGS
    // Detailed dark asphalt runway
    const runwayGeo = new THREE.PlaneGeometry(12, 120);
    const runwayMat = new THREE.MeshStandardMaterial({ 
      color: '#111827', // Deep pitch black asphalt
      roughness: 0.75,
      metalness: 0.15
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.receiveShadow = true;
    scene.add(runway);

    // Surrounding dark concrete tarmac fields
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: '#070a13', // Charcoal tarmac fields
      roughness: 0.9,
      metalness: 0.05
    });
    
    const tarmac = new THREE.Mesh(groundGeo, groundMat);
    tarmac.rotation.x = -Math.PI / 2;
    tarmac.position.set(0, -0.05, 0);
    tarmac.receiveShadow = true;
    scene.add(tarmac);

    // Bright neon green edge stripes for the runway boundaries
    const stripeGeo = new THREE.PlaneGeometry(0.12, 120);
    const leftBorderStripe = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: '#10b981' }));
    leftBorderStripe.rotation.x = -Math.PI / 2;
    leftBorderStripe.position.set(-6, 0.01, 0);
    scene.add(leftBorderStripe);

    const rightBorderStripe = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: '#10b981' }));
    rightBorderStripe.rotation.x = -Math.PI / 2;
    rightBorderStripe.position.set(6, 0.01, 0);
    scene.add(rightBorderStripe);

    // White dashed centerline strips
    const stripesGroup = new THREE.Group();
    for (let i = -60; i <= 60; i += 10) {
      const dashedGeo = new THREE.PlaneGeometry(0.3, 4);
      const dashedMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const stripe = new THREE.Mesh(dashedGeo, dashedMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.01, i);
      stripesGroup.add(stripe);
    }
    scene.add(stripesGroup);

    // Pulsating Runway Guidance Lights (Left and Right edges)
    const lightsGroup = new THREE.Group();
    const lightSphere = new THREE.SphereGeometry(0.1, 8, 8);
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: '#06b6d4' });
    const neonRedMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });

    for (let z = -55; z <= 55; z += 5) {
      // Alternating lights
      const isAlternating = z % 10 === 0;
      const leftLight = new THREE.Mesh(lightSphere, isAlternating ? neonCyanMat : neonRedMat);
      leftLight.position.set(-5.9, 0.08, z);
      lightsGroup.add(leftLight);

      const rightLight = new THREE.Mesh(lightSphere, isAlternating ? neonCyanMat : neonRedMat);
      rightLight.position.set(5.9, 0.08, z);
      lightsGroup.add(rightLight);
    }
    scene.add(lightsGroup);

    // 6. DETAILED AIRPORT TERMINAL & CONTROL TOWER IN THE DUSK
    // Semi-transparent glassy terminal building
    const terminalGroup = new THREE.Group();
    terminalGroup.position.set(0, 0, -32); // Placed at the very end of Gate 12

    const terminalBody = new THREE.Mesh(
      new THREE.BoxGeometry(22, 6, 4),
      new THREE.MeshStandardMaterial({ 
        color: '#0f172a',
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85
      })
    );
    terminalBody.position.set(0, 3, 0);
    terminalBody.castShadow = true;
    terminalGroup.add(terminalBody);

    // Glowing interior lights / windows for Terminal
    for (let x = -9; x <= 9; x += 3.0) {
      for (let y = 1.2; y <= 4.5; y += 1.8) {
        const windowPane = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.0, 0.1),
          new THREE.MeshBasicMaterial({ color: '#fef08a' }) // Cozy warm yellow interior glow
        );
        windowPane.position.set(x, y, 2.05);
        terminalGroup.add(windowPane);
      }
    }
    scene.add(terminalGroup);

    // Modern Airport Control Tower (Left Side)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-18, 0, -25);

    const baseGeo = new THREE.CylinderGeometry(0.8, 1.4, 10, 8);
    const towerBase = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 }));
    towerBase.position.set(0, 5, 0);
    towerBase.castShadow = true;
    towerGroup.add(towerBase);

    const cabinGeo = new THREE.CylinderGeometry(1.8, 1.3, 2, 8);
    const towerCabin = new THREE.Mesh(cabinGeo, new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.8 }));
    towerCabin.position.set(0, 11, 0);
    towerCabin.castShadow = true;
    towerGroup.add(towerCabin);

    // Glowing Control Cabin Windows
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const winGeo = new THREE.BoxGeometry(0.4, 1.0, 0.1);
      const win = new THREE.Mesh(winGeo, new THREE.MeshBasicMaterial({ color: '#fdba74' }));
      win.position.set(Math.sin(angle) * 1.5, 11, Math.cos(angle) * 1.5);
      win.rotation.y = angle;
      towerGroup.add(win);
    }

    // Rotating Radar Dish on top of Tower
    const radarGroup = new THREE.Group();
    radarGroup.position.set(0, 12.3, 0);
    
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    radarMast.position.set(0, 0.3, 0);
    radarGroup.add(radarMast);

    const radarDish = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.2), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    radarDish.position.set(0, 0.6, 0);
    radarGroup.add(radarDish);
    towerGroup.add(radarGroup);

    scene.add(towerGroup);

    // Yellow Parking Gate Guidance Box
    const gateBoxGroup = new THREE.Group();
    gateBoxGroup.position.set(0, 0.02, -18);
    
    const gateBorder = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.05, 1.6),
      new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.6 }) // Vivid airport yellow
    );
    gateBoxGroup.add(gateBorder);

    const centerStopBar = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.1, 0.3),
      new THREE.MeshBasicMaterial({ color: '#ef4444' }) // Red STOP Line
    );
    centerStopBar.position.set(0, 0.03, 0);
    gateBoxGroup.add(centerStopBar);
    scene.add(gateBoxGroup);

    // 7. BUILD AIRBUS A350/BOEING 787 PREMIUM DESIGN PROGRAMMATICALLY
    const airplaneGroup = new THREE.Group();
    scene.add(airplaneGroup);

    // Fuselage (Body of airliner)
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.35, 6.0, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: '#ffffff', // Crisp white Boeing livery
      roughness: 0.3,
      metalness: 0.3
    });
    const fuselage = new THREE.Mesh(bodyGeo, bodyMat);
    fuselage.rotation.x = Math.PI / 2; // Lies along Z-axis
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    airplaneGroup.add(fuselage);

    // Airline Decorative Stripe (Premium Gold/Blue Ribbon along fuselage)
    const stripeLeftGeo = new THREE.BoxGeometry(0.02, 0.15, 4.5);
    const stripeBlueMat = new THREE.MeshBasicMaterial({ color: '#1e3a8a' }); // Deep Royal Blue stripe
    const stripeGoldMat = new THREE.MeshBasicMaterial({ color: '#d97706' }); // Gold stripe

    const ribbonBlueLeft = new THREE.Mesh(stripeLeftGeo, stripeBlueMat);
    ribbonBlueLeft.position.set(-0.54, 0.05, -0.4);
    airplaneGroup.add(ribbonBlueLeft);

    const ribbonGoldLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 4.2), stripeGoldMat);
    ribbonGoldLeft.position.set(-0.54, -0.08, -0.4);
    airplaneGroup.add(ribbonGoldLeft);

    const ribbonBlueRight = new THREE.Mesh(stripeLeftGeo, stripeBlueMat);
    ribbonBlueRight.position.set(0.54, 0.05, -0.4);
    airplaneGroup.add(ribbonBlueRight);

    const ribbonGoldRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 4.2), stripeGoldMat);
    ribbonGoldRight.position.set(0.54, -0.08, -0.4);
    airplaneGroup.add(ribbonGoldRight);

    // Glowing Cabin Windows along both sides of the airliner!
    const windowsGroup = new THREE.Group();
    const windowBlockGeo = new THREE.BoxGeometry(0.03, 0.1, 0.1);
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: '#fef08a' }); // Warm glowing cabin interior lights

    for (let z = -1.8; z <= 1.8; z += 0.3) {
      if (Math.abs(z) < 0.2) continue; // Skip wing joints area for realism
      
      // Left side cabin windows
      const winL = new THREE.Mesh(windowBlockGeo, windowGlowMat);
      winL.position.set(-0.54, 0.16, z);
      windowsGroup.add(winL);

      // Right side cabin windows
      const winR = new THREE.Mesh(windowBlockGeo, windowGlowMat);
      winR.position.set(0.54, 0.16, z);
      windowsGroup.add(winR);
    }
    airplaneGroup.add(windowsGroup);

    // Deep cyan glass cockpit window
    const cockpitGeo = new THREE.SphereGeometry(0.48, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.6);
    const cockpitMat = new THREE.MeshStandardMaterial({ 
      color: '#0891b2', // Glossy dark cyan
      roughness: 0.05, 
      metalness: 0.95
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.28, -2.4);
    cockpit.scale.set(1, 0.7, 1.45);
    airplaneGroup.add(cockpit);

    // Swept-back aerodynamic wings
    const wingLeftGeo = new THREE.BoxGeometry(4.2, 0.08, 1.1);
    const wingMat = new THREE.MeshStandardMaterial({ 
      color: '#e2e8f0', // Clean airplane silver-grey
      roughness: 0.35,
      metalness: 0.25
    });

    const wingLeft = new THREE.Mesh(wingLeftGeo, wingMat);
    wingLeft.position.set(-2.3, -0.15, -0.2);
    wingLeft.rotation.y = -0.25; // Swept back wings
    wingLeft.rotation.z = 0.06; // Dihedral upward wing angle
    wingLeft.castShadow = true;
    airplaneGroup.add(wingLeft);

    const wingRight = new THREE.Mesh(wingLeftGeo, wingMat);
    wingRight.position.set(2.3, -0.15, -0.2);
    wingRight.rotation.y = 0.25;
    wingRight.rotation.z = -0.06;
    wingRight.castShadow = true;
    airplaneGroup.add(wingRight);

    // Blinking Aerodynamic Navigation / Beacon Lights (High-Fidelity)
    const navLightSphere = new THREE.SphereGeometry(0.08, 8, 8);
    
    // Left wingtip: RED Blinking Navigation Light (Port Side)
    const navLightRed = new THREE.Mesh(navLightSphere, new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    navLightRed.position.set(-4.4, 0.1, -0.7);
    airplaneGroup.add(navLightRed);
    
    const navRedGlow = new THREE.PointLight('#ef4444', 2.0, 3);
    navRedGlow.position.set(-4.4, 0.1, -0.7);
    airplaneGroup.add(navRedGlow);

    // Right wingtip: GREEN Blinking Navigation Light (Starboard Side)
    const navLightGreen = new THREE.Mesh(navLightSphere, new THREE.MeshBasicMaterial({ color: '#22c55e' }));
    navLightGreen.position.set(4.4, 0.1, -0.7);
    airplaneGroup.add(navLightGreen);

    const navGreenGlow = new THREE.PointLight('#22c55e', 2.0, 3);
    navGreenGlow.position.set(4.4, 0.1, -0.7);
    airplaneGroup.add(navGreenGlow);

    // Tail: Flashing WHITE Beacon Strobe Light
    const beaconLight = new THREE.Mesh(navLightSphere, new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    beaconLight.position.set(0, 2.1, 2.7);
    airplaneGroup.add(beaconLight);

    const beaconGlow = new THREE.PointLight('#ffffff', 3.0, 5);
    beaconGlow.position.set(0, 2.1, 2.7);
    airplaneGroup.add(beaconGlow);

    // Horizontal stabilizer wings (Tail)
    const tailHGeo = new THREE.BoxGeometry(1.4, 0.05, 0.6);
    const tailHLeft = new THREE.Mesh(tailHGeo, wingMat);
    tailHLeft.position.set(-1.0, 0.1, 2.5);
    tailHLeft.rotation.y = -0.35;
    airplaneGroup.add(tailHLeft);

    const tailHRight = new THREE.Mesh(tailHGeo, wingMat);
    tailHRight.position.set(1.0, 0.1, 2.5);
    tailHRight.rotation.y = 0.35;
    airplaneGroup.add(tailHRight);

    // Elegant swept-back vertical tail fin (Livery Red)
    const finGeo = new THREE.BoxGeometry(0.08, 1.4, 0.85);
    const finMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.3 }); // Navy blue tail fin
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(0, 0.9, 2.4);
    fin.rotation.x = 0.45; // Swept back
    fin.castShadow = true;
    airplaneGroup.add(fin);

    // Decorative Gold logo stripe on vertical tail fin
    const tailLogo = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.2, 0.7),
      new THREE.MeshBasicMaterial({ color: '#d97706' })
    );
    tailLogo.position.set(0, 1.2, 2.1);
    tailLogo.rotation.x = 0.45;
    airplaneGroup.add(tailLogo);

    // Chrome jet turbine engines under wings
    const engineGeo = new THREE.CylinderGeometry(0.32, 0.24, 1.2, 12);
    const engineMat = new THREE.MeshStandardMaterial({ 
      color: '#64748b', 
      roughness: 0.15, 
      metalness: 0.85 // Shiny high-specular metal look
    });
    
    // Glowing turbine exhausts (sine-wave animated neon-cyan engine flame!)
    const exhaustMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' }); // Bright cyan glow

    // Left Engine
    const engineLeft = new THREE.Mesh(engineGeo, engineMat);
    engineLeft.rotation.x = Math.PI / 2;
    engineLeft.position.set(-1.4, -0.45, -0.5);
    engineLeft.castShadow = true;
    airplaneGroup.add(engineLeft);

    const exhaustLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.05, 12), exhaustMat);
    exhaustLeft.rotation.x = Math.PI / 2;
    exhaustLeft.position.set(-1.4, -0.45, 0.1);
    airplaneGroup.add(exhaustLeft);

    const engineLeftLight = new THREE.PointLight('#38bdf8', 1.5, 4);
    engineLeftLight.position.set(-1.4, -0.45, 0.2);
    airplaneGroup.add(engineLeftLight);

    // Right Engine
    const engineRight = new THREE.Mesh(engineGeo, engineMat);
    engineRight.rotation.x = Math.PI / 2;
    engineRight.position.set(1.4, -0.45, -0.5);
    engineRight.castShadow = true;
    airplaneGroup.add(engineRight);

    const exhaustRight = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.05, 12), exhaustMat);
    exhaustRight.rotation.x = Math.PI / 2;
    exhaustRight.position.set(1.4, -0.45, 0.1);
    airplaneGroup.add(exhaustRight);

    const engineRightLight = new THREE.PointLight('#38bdf8', 1.5, 4);
    engineRightLight.position.set(1.4, -0.45, 0.2);
    airplaneGroup.add(engineRightLight);

    // Landing Gears (Sleek struts and rubber tires)
    const gearGroup = new THREE.Group();
    const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    const tireGeo = new THREE.TorusGeometry(0.14, 0.06, 6, 12);
    const tireMat = new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.95 }); // Matte rubber

    // Front nose gear
    const frontStrut = new THREE.Mesh(strutGeo, engineMat);
    frontStrut.position.set(0, -0.7, -2.1);
    gearGroup.add(frontStrut);

    const frontTire = new THREE.Mesh(tireGeo, tireMat);
    frontTire.rotation.y = Math.PI / 2;
    frontTire.position.set(0, -1.1, -2.1);
    gearGroup.add(frontTire);

    // Left main landing gear
    const leftStrut = new THREE.Mesh(strutGeo, engineMat);
    leftStrut.position.set(-1.3, -0.7, 0);
    gearGroup.add(leftStrut);

    const leftTire = new THREE.Mesh(tireGeo, tireMat);
    leftTire.rotation.y = Math.PI / 2;
    leftTire.position.set(-1.3, -1.1, 0);
    gearGroup.add(leftTire);

    // Right main landing gear
    const rightStrut = new THREE.Mesh(strutGeo, engineMat);
    rightStrut.position.set(1.3, -0.7, 0);
    gearGroup.add(rightStrut);

    const rightTire = new THREE.Mesh(tireGeo, tireMat);
    rightTire.rotation.y = Math.PI / 2;
    rightTire.position.set(1.3, -1.1, 0);
    gearGroup.add(rightTire);

    airplaneGroup.add(gearGroup);

    // Position airplane initially hovering over tarmac
    airplaneGroup.position.set(0, 1.3, 10);

    // 8. HIGH QUALITY ANIMATION RENDER LOOP
    let animationFrameId: number;
    
    // Using a custom timer object to bypass Three.js Clock deprecation
    let startTime = Date.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Delta and Elapsed calculations
      const now = Date.now();
      const elapsed = (now - startTime) / 1000.0;
      const delta = 0.016; // Stable target 60FPS delta

      // 1. ROTATE AIRPORT CONTROL TOWER RADAR
      radarGroup.rotation.y += 1.8 * delta;

      // 2. BLINKING AVIATION LIGHTS SYSTEM (Realistic timing loops)
      // Nav lights: 1 Hz blinking
      const isNavLightOn = Math.floor(elapsed * 2.0) % 2 === 0;
      navLightRed.material.opacity = isNavLightOn ? 1.0 : 0.15;
      navRedGlow.intensity = isNavLightOn ? 2.5 : 0.0;

      navLightGreen.material.opacity = isNavLightOn ? 1.0 : 0.15;
      navGreenGlow.intensity = isNavLightOn ? 2.5 : 0.0;

      // Beacon strobe: Fast double-flash every 1.5s
      const cycleTime = elapsed % 1.5;
      const isStrobeOn = (cycleTime > 0.0 && cycleTime < 0.1) || (cycleTime > 0.2 && cycleTime < 0.3);
      beaconLight.material.opacity = isStrobeOn ? 1.0 : 0.1;
      beaconGlow.intensity = isStrobeOn ? 4.0 : 0.0;

      // 3. PHYSICAL TRANSLATIONS FROM CONTROLLER COORDINATES
      // Convert 2D dashboard X (0-100) -> 3D X space (-8.5 to +8.5)
      const target3DX = ((airplane.x - 50) / 50) * 8.5;
      // Convert 2D dashboard Y (0-100) -> 3D Z space (+12 down to -17.5 Gate)
      const target3DZ = 12 - (airplane.y / 100) * 29.5;

      // Extremely smooth physics interpolation (Lerp)
      airplaneGroup.position.x = THREE.MathUtils.lerp(airplaneGroup.position.x, target3DX, 0.07);
      airplaneGroup.position.z = THREE.MathUtils.lerp(airplaneGroup.position.z, target3DZ, 0.07);

      // 4. FLIGHT ATTRIBUTES: ROLL, PITCH, YAW DYNAMICS BASED ON GESTURE
      let targetRoll = 0;
      let targetPitch = 0;
      let targetYaw = 0;

      if (isRunning) {
        // High frequency turbine exhaust flicker
        const flamePulse = 0.8 + Math.sin(elapsed * 55.0) * 0.2;
        exhaustLeft.scale.set(flamePulse, 1.0, flamePulse);
        exhaustRight.scale.set(flamePulse, 1.0, flamePulse);
        engineLeftLight.intensity = 1.5 * flamePulse;
        engineRightLight.intensity = 1.5 * flamePulse;

        // Dynamic aeronautical maneuvers
        if (detectedGesture === 'RẼ TRÁI') {
          targetRoll = 0.38; // Left wing bank angle
          targetYaw = 0.16;  // Nose yaw turning angle
        } else if (detectedGesture === 'RẼ PHẢI') {
          targetRoll = -0.38; // Right wing bank angle
          targetYaw = -0.16;  // Nose yaw turning angle
        } else if (detectedGesture === 'GIẢM TỐC ĐỘ' || detectedGesture === 'DI CHUYỂN THẲNG') {
          // Subtle nose-up angle when adjusting throttle
          targetPitch = -0.05;
        } else if (detectedGesture === 'DỪNG LẠI' || detectedGesture === 'DỪNG KHẨN CẤP') {
          // Dim jet flame down
          exhaustLeft.scale.set(0.001, 1.0, 0.001);
          exhaustRight.scale.set(0.001, 1.0, 0.001);
          engineLeftLight.intensity = 0.0;
          engineRightLight.intensity = 0.0;
        }
      } else {
        // Idle/Cold engines
        exhaustLeft.scale.set(0.05, 1.0, 0.05);
        exhaustRight.scale.set(0.05, 1.0, 0.05);
        engineLeftLight.intensity = 0.1;
        engineRightLight.intensity = 0.1;
      }

      // Smooth rotations
      airplaneGroup.rotation.z = THREE.MathUtils.lerp(airplaneGroup.rotation.z, targetRoll, 0.07);
      airplaneGroup.rotation.x = THREE.MathUtils.lerp(airplaneGroup.rotation.x, targetPitch, 0.07);
      airplaneGroup.rotation.y = THREE.MathUtils.lerp(airplaneGroup.rotation.y, targetYaw, 0.07);

      // Gentle mid-air hovering offset
      if (isRunning && detectedGesture !== 'DỪNG LẠI') {
        airplaneGroup.position.y = 1.30 + Math.sin(elapsed * 4.0) * 0.1;
      } else if (detectedGesture === 'DỪNG LẠI') {
        // Soft touchdown physically landing tires onto runway
        airplaneGroup.position.y = THREE.MathUtils.lerp(airplaneGroup.position.y, 1.16, 0.08);
      }

      // 5. VOLUMETRIC SCROLLING ROAD ENVIRONMENT LINES (Creates the sensation of forward speed!)
      if (isRunning && detectedGesture !== 'DỪNG LẠI' && detectedGesture !== 'DỪNG KHẨN CẤP') {
        const speedFactor = 15.0;
        
        stripesGroup.children.forEach(stripe => {
          stripe.position.z += speedFactor * delta;
          if (stripe.position.z > 60) {
            stripe.position.z = -60;
          }
        });

        lightsGroup.children.forEach(light => {
          light.position.z += speedFactor * delta;
          if (light.position.z > 60) {
            light.position.z = -60;
          }
        });
      }

      // 6. CINEMATIC CHASE CAMERA + BREATHING NOISE (Looks extremely premium)
      // Camera smoothly pans behind the plane's current coordinate
      const desiredCameraX = airplaneGroup.position.x * 0.6;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredCameraX, 0.04);
      
      // Handheld camera operator breathing sway effect (slow, immersive trigonometric waves)
      const swayY = Math.sin(elapsed * 0.8) * 0.06;
      const swayX = Math.cos(elapsed * 0.5) * 0.06;
      camera.position.y = 8 + swayY;
      camera.position.x += swayX;
      
      // Track target slightly in front of airliner nose
      camera.lookAt(airplaneGroup.position.x, 1.0, airplaneGroup.position.z - 4);

      renderer.render(scene, camera);
    };

    animate();

    // 9. AUTOMATIC RESIZING
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 10. ROBUST MEMORY DISPOSALS ON UNMOUNT
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Geometries
      runwayGeo.dispose();
      groundGeo.dispose();
      stripeGeo.dispose();
      lightSphere.dispose();
      bodyGeo.dispose();
      stripeLeftGeo.dispose();
      windowBlockGeo.dispose();
      cockpitGeo.dispose();
      wingLeftGeo.dispose();
      navLightSphere.dispose();
      tailHGeo.dispose();
      finGeo.dispose();
      engineGeo.dispose();
      strutGeo.dispose();
      tireGeo.dispose();
      
      // Materials
      runwayMat.dispose();
      groundMat.dispose();
      bodyMat.dispose();
      stripeBlueMat.dispose();
      stripeGoldMat.dispose();
      windowGlowMat.dispose();
      cockpitMat.dispose();
      wingMat.dispose();
      neonCyanMat.dispose();
      neonRedMat.dispose();
      exhaustMat.dispose();
      tireMat.dispose();
      finMat.dispose();

      renderer.dispose();
    };
  }, [airplane.x, airplane.y, isRunning, detectedGesture]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.6)'
      }}
    />
  );
};
