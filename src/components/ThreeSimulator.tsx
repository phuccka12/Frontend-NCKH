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

    // 1. Create Scene & Colors (Light blue aviation theme sky background)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#93c5fd'); // Soft sky blue matching light theme

    // Fog for atmospheric perspective
    scene.fog = new THREE.FogExp2('#93c5fd', 0.015);

    // 2. Camera Setup (Tower Perspective)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Position camera slightly behind and above the runway looking forward
    camera.position.set(0, 7, 24);
    camera.lookAt(0, 1.5, 0);

    // 3. WebGL Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 0.9);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Soft runway landing blue lights
    const blueLightLeft = new THREE.PointLight('#3b82f6', 1, 15);
    blueLightLeft.position.set(-6, 0.5, 5);
    scene.add(blueLightLeft);

    const blueLightRight = new THREE.PointLight('#3b82f6', 1, 15);
    blueLightRight.position.set(6, 0.5, 5);
    scene.add(blueLightRight);

    // 5. Build Environment & Runway
    // Runway floor
    const runwayGeo = new THREE.PlaneGeometry(12, 100);
    const runwayMat = new THREE.MeshStandardMaterial({ 
      color: '#475569', // Dark slate gray runway
      roughness: 0.8,
      metalness: 0.1
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.receiveShadow = true;
    scene.add(runway);

    // Grass fields left and right
    const grassGeo = new THREE.PlaneGeometry(100, 100);
    const grassMat = new THREE.MeshStandardMaterial({ 
      color: '#86efac', // Soft green grass fields
      roughness: 0.9 
    });
    
    const leftGrass = new THREE.Mesh(grassGeo, grassMat);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-56, -0.05, 0);
    leftGrass.receiveShadow = true;
    scene.add(leftGrass);

    const rightGrass = new THREE.Mesh(grassGeo, grassMat);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(56, -0.05, 0);
    rightGrass.receiveShadow = true;
    scene.add(rightGrass);

    // Runway stripes (dashed center lane)
    const stripesGroup = new THREE.Group();
    for (let i = -50; i <= 50; i += 10) {
      const stripeGeo = new THREE.PlaneGeometry(0.4, 4);
      const stripeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.01, i);
      stripesGroup.add(stripe);
    }
    scene.add(stripesGroup);

    // Runway lateral edge lights (small globes)
    const lightsGroup = new THREE.Group();
    const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const redLightMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const greenLightMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
    const whiteLightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

    for (let z = -45; z <= 45; z += 5) {
      // Left side lights
      const leftLight = new THREE.Mesh(lightGeo, z < 0 ? redLightMat : whiteLightMat);
      leftLight.position.set(-6, 0.1, z);
      lightsGroup.add(leftLight);

      // Right side lights
      const rightLight = new THREE.Mesh(lightGeo, z < 0 ? redLightMat : whiteLightMat);
      rightLight.position.set(6, 0.1, z);
      lightsGroup.add(rightLight);
    }
    scene.add(lightsGroup);

    // 6. Parking Gate (Yellow boxes and stripes)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0.02, -15); // Place Gate 12 at Z = -15 (near the landing boundary)
    
    // Main boundary bar
    const gateBarGeo = new THREE.BoxGeometry(7, 0.15, 0.4);
    const gateBarMat = new THREE.MeshStandardMaterial({ color: '#eab308' }); // Yellow Gate bar
    const gateBar = new THREE.Mesh(gateBarGeo, gateBarMat);
    gateBar.castShadow = true;
    gateBar.receiveShadow = true;
    gateGroup.add(gateBar);

    // Stripe blocks inside
    for (let x = -3; x <= 3; x += 1.2) {
      const stripeBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.05, 1.2),
        new THREE.MeshBasicMaterial({ color: '#1e293b' })
      );
      stripeBox.position.set(x, 0.01, -0.6);
      gateGroup.add(stripeBox);
    }
    scene.add(gateGroup);

    // 7. BUILD A HIGHLY DETAILED 3D AIRPLANE MODEL PROGRAMMATICALLY
    const airplaneGroup = new THREE.Group();
    scene.add(airplaneGroup);

    // Fuselage (Body of airliner)
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.35, 5.5, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: '#ffffff', // Clean white fuselage
      roughness: 0.4,
      metalness: 0.2
    });
    const fuselage = new THREE.Mesh(bodyGeo, bodyMat);
    fuselage.rotation.x = Math.PI / 2; // Lie along Z-axis
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    airplaneGroup.add(fuselage);

    // Red nose tip cone
    const noseGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const noseMat = new THREE.MeshStandardMaterial({ color: '#ef4444' }); // Red nose
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0, -2.75);
    airplaneGroup.add(nose);

    // Jet cockpit glass windows (cyan metallic)
    const cockpitGeo = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.5);
    const cockpitMat = new THREE.MeshStandardMaterial({ 
      color: '#06b6d4', 
      roughness: 0.1, 
      metalness: 0.9 
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.25, -2.1);
    cockpit.scale.set(1, 0.7, 1.3);
    airplaneGroup.add(cockpit);

    // Main Wings (Left and Right Swept Wings)
    const wingLeftGeo = new THREE.BoxGeometry(3.6, 0.08, 1);
    const wingMat = new THREE.MeshStandardMaterial({ 
      color: '#e2e8f0', // Silver-grey wings
      roughness: 0.4,
      metalness: 0.2
    });

    const wingLeft = new THREE.Mesh(wingLeftGeo, wingMat);
    wingLeft.position.set(-2, -0.15, -0.3);
    wingLeft.rotation.y = -0.2; // swept wings slant backward
    wingLeft.rotation.z = 0.05; // slight dihedral upward angle
    wingLeft.castShadow = true;
    airplaneGroup.add(wingLeft);

    const wingRight = new THREE.Mesh(wingLeftGeo, wingMat);
    wingRight.position.set(2, -0.15, -0.3);
    wingRight.rotation.y = 0.2;
    wingRight.rotation.z = -0.05;
    wingRight.castShadow = true;
    airplaneGroup.add(wingRight);

    // Winglets (Vertical tips of wings in red)
    const wingletGeo = new THREE.BoxGeometry(0.08, 0.5, 0.4);
    const wingletMat = new THREE.MeshStandardMaterial({ color: '#ef4444' }); // Red winglets

    const wingletLeft = new THREE.Mesh(wingletGeo, wingletMat);
    wingletLeft.position.set(-3.8, 0.1, -0.5);
    wingletLeft.rotation.y = -0.2;
    wingletLeft.rotation.x = 0.1;
    airplaneGroup.add(wingletLeft);

    const wingletRight = new THREE.Mesh(wingletGeo, wingletMat);
    wingletRight.position.set(3.8, 0.1, -0.5);
    wingletRight.rotation.y = 0.2;
    wingletRight.rotation.x = 0.1;
    airplaneGroup.add(wingletRight);

    // Tail Wings (Horizontal stabilizers)
    const tailHGeo = new THREE.BoxGeometry(1.2, 0.06, 0.5);
    const tailHLeft = new THREE.Mesh(tailHGeo, wingMat);
    tailHLeft.position.set(-0.9, 0.1, 2.3);
    tailHLeft.rotation.y = -0.3;
    airplaneGroup.add(tailHLeft);

    const tailHRight = new THREE.Mesh(tailHGeo, wingMat);
    tailHRight.position.set(0.9, 0.1, 2.3);
    tailHRight.rotation.y = 0.3;
    airplaneGroup.add(tailHRight);

    // Vertical tail fin stabilizer (Swept up in red with logo stripe)
    const finGeo = new THREE.BoxGeometry(0.08, 1.2, 0.7);
    const fin = new THREE.Mesh(finGeo, noseMat);
    fin.position.set(0, 0.8, 2.2);
    fin.rotation.x = 0.4; // swept back vertical fin
    fin.castShadow = true;
    airplaneGroup.add(fin);

    // Jet Engine Turbines under wings
    const engineGeo = new THREE.CylinderGeometry(0.3, 0.22, 1, 12);
    const engineMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.3, metalness: 0.6 });
    const exhaustMat = new THREE.MeshBasicMaterial({ color: '#fdba74' }); // Glowing orange exhaust

    // Left Engine
    const engineLeft = new THREE.Mesh(engineGeo, engineMat);
    engineLeft.rotation.x = Math.PI / 2;
    engineLeft.position.set(-1.2, -0.4, -0.6);
    engineLeft.castShadow = true;
    airplaneGroup.add(engineLeft);

    const exhaustLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), exhaustMat);
    exhaustLeft.rotation.x = Math.PI / 2;
    exhaustLeft.position.set(-1.2, -0.4, -0.1);
    airplaneGroup.add(exhaustLeft);

    // Right Engine
    const engineRight = new THREE.Mesh(engineGeo, engineMat);
    engineRight.rotation.x = Math.PI / 2;
    engineRight.position.set(1.2, -0.4, -0.6);
    engineRight.castShadow = true;
    airplaneGroup.add(engineRight);

    const exhaustRight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), exhaustMat);
    exhaustRight.rotation.x = Math.PI / 2;
    exhaustRight.position.set(1.2, -0.4, -0.1);
    airplaneGroup.add(exhaustRight);

    // Landing Gear (Tires & Struts)
    const gearGroup = new THREE.Group();
    
    // Front gear nose tire
    const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
    const tireGeo = new THREE.TorusGeometry(0.12, 0.06, 6, 12);
    const tireMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 }); // Rubber tires

    const frontStrut = new THREE.Mesh(strutGeo, engineMat);
    frontStrut.position.set(0, -0.7, -2);
    gearGroup.add(frontStrut);

    const frontTire = new THREE.Mesh(tireGeo, tireMat);
    frontTire.rotation.y = Math.PI / 2;
    frontTire.position.set(0, -1.05, -2);
    gearGroup.add(frontTire);

    // Left main gear
    const leftStrut = new THREE.Mesh(strutGeo, engineMat);
    leftStrut.position.set(-1.2, -0.7, 0);
    gearGroup.add(leftStrut);

    const leftTire = new THREE.Mesh(tireGeo, tireMat);
    leftTire.rotation.y = Math.PI / 2;
    leftTire.position.set(-1.2, -1.05, 0);
    gearGroup.add(leftTire);

    // Right main gear
    const rightStrut = new THREE.Mesh(strutGeo, engineMat);
    rightStrut.position.set(1.2, -0.7, 0);
    gearGroup.add(rightStrut);

    const rightTire = new THREE.Mesh(tireGeo, tireMat);
    rightTire.rotation.y = Math.PI / 2;
    rightTire.position.set(1.2, -1.05, 0);
    gearGroup.add(rightTire);

    airplaneGroup.add(gearGroup);

    // Lift airplane up off the ground slightly
    airplaneGroup.position.set(0, 1.25, 10);

    // 8. RENDER LOOP ANIMATIONS
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Dynamic translations from X/Y coordinates
      // X maps from (0 to 100) -> 3D (-8 to +8)
      const targetX = ((airplane.x - 50) / 50) * 8.5;
      // Y maps from (0 to 100) -> 3D Z-axis (+12 down to -14.5)
      const targetZ = 12 - (airplane.y / 100) * 26.5;

      // Lerp for ultra-smooth physical motion
      airplaneGroup.position.x = THREE.MathUtils.lerp(airplaneGroup.position.x, targetX, 0.08);
      airplaneGroup.position.z = THREE.MathUtils.lerp(airplaneGroup.position.z, targetZ, 0.08);

      // Pitch (nose up/down), Roll (banking wings), Yaw (rotating nose) based on gestures
      let targetRoll = 0;
      let targetPitch = 0;
      let targetYaw = 0;

      if (isRunning) {
        // Engine exhaust glow flicker effect
        const exhaustPulse = 0.8 + Math.sin(elapsed * 45) * 0.2;
        exhaustLeft.scale.set(exhaustPulse, 1, exhaustPulse);
        exhaustRight.scale.set(exhaustPulse, 1, exhaustPulse);

        if (detectedGesture === 'RẼ TRÁI') {
          targetRoll = 0.35; // Bank left
          targetYaw = 0.15;
        } else if (detectedGesture === 'RẼ PHẢI') {
          targetRoll = -0.35; // Bank right
          targetYaw = -0.15;
        } else if (detectedGesture === 'GIẢM TỐC ĐỘ') {
          targetPitch = -0.1; // Pitch nose slightly up to flare/brake
          // Engine glow dims slightly when braking
          exhaustLeft.scale.set(0.5, 1, 0.5);
          exhaustRight.scale.set(0.5, 1, 0.5);
        } else if (detectedGesture === 'DỪNG LẠI' || detectedGesture === 'DỪNG KHẨN CẤP') {
          // Flame goes out
          exhaustLeft.scale.set(0.001, 1, 0.001);
          exhaustRight.scale.set(0.001, 1, 0.001);
        }
      } else {
        // Idle engine glow
        exhaustLeft.scale.set(0.1, 1, 0.1);
        exhaustRight.scale.set(0.1, 1, 0.1);
      }

      // Smoothly rotate the aircraft
      airplaneGroup.rotation.z = THREE.MathUtils.lerp(airplaneGroup.rotation.z, targetRoll, 0.08);
      airplaneGroup.rotation.x = THREE.MathUtils.lerp(airplaneGroup.rotation.x, targetPitch, 0.08);
      airplaneGroup.rotation.y = THREE.MathUtils.lerp(airplaneGroup.rotation.y, targetYaw, 0.08);

      // Light hovering animation while in mid-air
      if (isRunning && detectedGesture !== 'DỪNG LẠI') {
        airplaneGroup.position.y = 1.25 + Math.sin(elapsed * 4.5) * 0.12;
      } else if (detectedGesture === 'DỪNG LẠI') {
        // Settle smoothly onto ground
        airplaneGroup.position.y = THREE.MathUtils.lerp(airplaneGroup.position.y, 1.15, 0.1);
      }

      // Runway moving ground lines texture shift to simulate flying forward!
      if (isRunning && detectedGesture !== 'DỪNG LẠI' && detectedGesture !== 'DỪNG KHẨN CẤP') {
        stripesGroup.children.forEach(stripe => {
          stripe.position.z += 10 * delta; // Shift runway marks backwards
          if (stripe.position.z > 50) {
            stripe.position.z = -50;
          }
        });

        lightsGroup.children.forEach(light => {
          light.position.z += 10 * delta; // Shift lights backwards
          if (light.position.z > 50) {
            light.position.z = -50;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. HANDLE CONTAINER RESIZING
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 10. CLEANUP ON UNMOUNT
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // dispose geometries and materials to avoid memory leaks
      runwayGeo.dispose();
      runwayMat.dispose();
      grassGeo.dispose();
      grassMat.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      noseGeo.dispose();
      noseMat.dispose();
      cockpitGeo.dispose();
      cockpitMat.dispose();
      wingLeftGeo.dispose();
      wingMat.dispose();
      wingletGeo.dispose();
      wingletMat.dispose();
      tailHGeo.dispose();
      finGeo.dispose();
      engineGeo.dispose();
      engineMat.dispose();
      exhaustMat.dispose();
      strutGeo.dispose();
      tireGeo.dispose();
      tireMat.dispose();
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
        overflow: 'hidden'
      }}
    />
  );
};
