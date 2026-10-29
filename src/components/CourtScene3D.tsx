"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CourtMessage } from "@/app/api/court/route";

interface CourtScene3DProps {
  currentMessage: CourtMessage | null;
  cameraPreset: "overview" | "judge" | "defense" | "prosecutor" | "jury";
  onSelectCharacter?: (role: string) => void;
  replayToken?: number;
}

export default function CourtScene3D({
  currentMessage,
  cameraPreset,
  replayToken = 0,
  onSelectCharacter,
}: CourtScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const charactersRef = useRef<{
    judge?: THREE.Group;
    defense?: THREE.Group;
    prosecutor?: THREE.Group;
    jurors?: THREE.Group[];
  }>({});
  const speechBubbleWorldPos = useRef<{
    judge: THREE.Vector3;
    defense: THREE.Vector3;
    prosecutor: THREE.Vector3;
    jurors: THREE.Vector3;
  }>({
    judge: new THREE.Vector3(0, 3.8, -0.6),
    defense: new THREE.Vector3(-4.8, 3.2, 1.8),
    prosecutor: new THREE.Vector3(4.8, 3.2, 1.8),
    jurors: new THREE.Vector3(-5.2, 3.6, -3.2),
  });

  // Track target camera position for smooth interpolation
  const targetCamPos = useRef(new THREE.Vector3(0, 4.5, 9.8));
  const targetCamLook = useRef(new THREE.Vector3(0, 1.8, 0));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf6f3ed);
    scene.fog = new THREE.FogExp2(0xf6f3ed, 0.022);

    // 2. Camera setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 4.8, 10.5);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    const motionScale = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.15 : 1;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't go below floor
    controls.minDistance = 2.5;
    controls.maxDistance = 18;
    controls.target.set(0, 1.8, 0);
    controlsRef.current = controls;

    // 5. Lighting (Soft studio lighting matching reference image)
    const ambientLight = new THREE.AmbientLight(0xfff8ed, 1.1);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8c8b0, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.6);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdde8ff, 0.85);
    fillLight.position.set(-8, 6, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.5);
    rimLight.position.set(0, 8, -8);
    scene.add(rimLight);

    // 6. Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xede8df,
      roughness: 0.35,
      metalness: 0.05,
    });

    const woodDarkMat = new THREE.MeshStandardMaterial({
      color: 0x9b6b43, // Rich warm courtroom oak
      roughness: 0.45,
      metalness: 0.08,
    });

    const woodLightMat = new THREE.MeshStandardMaterial({
      color: 0xd9a873, // Honey wood trim
      roughness: 0.4,
      metalness: 0.05,
    });

    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      roughness: 0.7,
    });

    // 7. Courtroom Floor
    const floorGeo = new THREE.PlaneGeometry(35, 35);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Soft Courtroom Backwall
    const wallGeo = new THREE.CylinderGeometry(18, 18, 12, 32, 1, true, -Math.PI / 2, Math.PI);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf3efe7,
      side: THREE.BackSide,
      roughness: 0.9,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 6, -1);
    scene.add(backWall);

    // 8. Judicial Bench (Curved, elevated ornate desk in center)
    const judgeDeskGroup = new THREE.Group();
    judgeDeskGroup.position.set(0, 0, -0.6);

    // Curved front panel
    const curvedFrontGeo = new THREE.CylinderGeometry(2.6, 2.7, 1.8, 32, 1, false, 0, Math.PI);
    const curvedFront = new THREE.Mesh(curvedFrontGeo, woodDarkMat);
    curvedFront.position.set(0, 0.9, 0);
    curvedFront.rotation.y = Math.PI / 2;
    curvedFront.castShadow = true;
    curvedFront.receiveShadow = true;
    judgeDeskGroup.add(curvedFront);

    // Bench top ledge
    const deskTopGeo = new THREE.CylinderGeometry(2.75, 2.75, 0.14, 32, 1, false, 0, Math.PI);
    const deskTop = new THREE.Mesh(deskTopGeo, woodLightMat);
    deskTop.position.set(0, 1.84, 0);
    deskTop.rotation.y = Math.PI / 2;
    deskTop.castShadow = true;
    judgeDeskGroup.add(deskTop);

    // Decorative molding panels on judge bench
    for (let i = -2; i <= 2; i++) {
      const angle = (i * Math.PI) / 6.5;
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 1.1, 0.06),
        woodLightMat
      );
      panel.position.set(
        Math.sin(angle) * 2.64,
        0.9,
        Math.cos(angle) * 2.64
      );
      panel.rotation.y = angle;
      judgeDeskGroup.add(panel);
    }

    // High-backed leather judge chair
    const judgeChair = new THREE.Group();
    judgeChair.position.set(0, 0, -1.3);
    const chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 2.1, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.5 })
    );
    chairBack.position.set(0, 1.9, 0);
    chairBack.castShadow = true;
    judgeChair.add(chairBack);

    const chairSeat = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x2e1d15, roughness: 0.5 })
    );
    chairSeat.position.set(0, 0.9, 0.4);
    chairSeat.castShadow = true;
    judgeChair.add(chairSeat);
    judgeDeskGroup.add(judgeChair);

    // Gavel block
    const gavelBlock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.08, 16),
      woodDarkMat
    );
    gavelBlock.position.set(0.6, 1.95, 0.5);
    judgeDeskGroup.add(gavelBlock);

    const gavelGroup = new THREE.Group();
    gavelGroup.position.set(0.6, 2.05, 0.5);
    gavelGroup.name = "gavel";
    const gavelHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: 0x5a2d12, roughness: 0.3 })
    );
    gavelHead.rotation.z = Math.PI / 2;
    gavelGroup.add(gavelHead);
    const gavelHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
      woodLightMat
    );
    gavelHandle.rotation.x = Math.PI / 2;
    gavelHandle.position.set(0, 0, 0.25);
    gavelGroup.add(gavelHandle);
    judgeDeskGroup.add(gavelGroup);

    scene.add(judgeDeskGroup);

    // Helper: Build Lawyer Tables with chairs and paper exhibits
    function createLawyerStation(xPos: number, zPos: number, isDefense: boolean) {
      const station = new THREE.Group();
      station.position.set(xPos, 0, zPos);

      // Wooden Desk
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.12, 1.3),
        woodDarkMat
      );
      desk.position.set(0, 1.35, 0);
      desk.castShadow = true;
      desk.receiveShadow = true;
      station.add(desk);

      // Desk side panels/legs
      const legGeo = new THREE.BoxGeometry(0.12, 1.35, 1.2);
      const leftLeg = new THREE.Mesh(legGeo, woodLightMat);
      leftLeg.position.set(-1.08, 0.675, 0);
      leftLeg.castShadow = true;
      station.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, woodLightMat);
      rightLeg.position.set(1.08, 0.675, 0);
      rightLeg.castShadow = true;
      station.add(rightLeg);

      // Modesty panel
      const modesty = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.9, 0.06),
        woodDarkMat
      );
      modesty.position.set(0, 0.85, 0.55);
      modesty.castShadow = true;
      station.add(modesty);

      // Lawyer Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, -1.0);
      const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.8), woodLightMat);
      cSeat.position.set(0, 0.75, 0);
      chairGroup.add(cSeat);
      const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.1), woodDarkMat);
      cBack.position.set(0, 1.2, -0.35);
      chairGroup.add(cBack);
      for (const lx of [-0.35, 0.35]) {
        for (const lz of [-0.3, 0.3]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8), woodDarkMat);
          leg.position.set(lx, 0.375, lz);
          chairGroup.add(leg);
        }
      }
      station.add(chairGroup);

      // Open Legal Pad / Notebook
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.4), paperMat);
      pad.position.set(isDefense ? 0.3 : -0.3, 1.42, 0.1);
      pad.rotation.y = isDefense ? 0.15 : -0.15;
      station.add(pad);


      scene.add(station);
      return station;
    }

    // Left station: Defense Pigeon
    createLawyerStation(-4.5, 1.8, true);
    // Right station: Prosecutor Cyber-Parrot
    createLawyerStation(4.5, 1.8, false);

    // 9. Elevated Jury Box (Background stepped benches with cute juror birds)
    const juryGroup = new THREE.Group();
    juryGroup.position.set(-5.6, 0, -3.2);

    for (let row = 0; row < 2; row++) {
      const zOffset = -row * 1.3;
      const yOffset = row * 0.55;

      // Platform
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 0.55, 1.4),
        woodDarkMat
      );
      platform.position.set(0, yOffset + 0.275, zOffset);
      platform.receiveShadow = true;
      juryGroup.add(platform);

      // Bench seat
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.1, 0.45),
        woodLightMat
      );
      bench.position.set(0, yOffset + 0.6, zOffset);
      bench.castShadow = true;
      juryGroup.add(bench);

      // Bench backrest
      const backrest = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.6, 0.08),
        woodDarkMat
      );
      backrest.position.set(0, yOffset + 0.95, zOffset - 0.2);
      backrest.castShadow = true;
      juryGroup.add(backrest);
    }
    scene.add(juryGroup);

    // Second Jury Bench on Right (balance)
    const rightJuryGroup = new THREE.Group();
    rightJuryGroup.position.set(5.6, 0, -3.2);
    for (let row = 0; row < 2; row++) {
      const zOffset = -row * 1.3;
      const yOffset = row * 0.55;
      const platform = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.55, 1.4), woodDarkMat);
      platform.position.set(0, yOffset + 0.275, zOffset);
      rightJuryGroup.add(platform);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.45), woodLightMat);
      bench.position.set(0, yOffset + 0.6, zOffset);
      rightJuryGroup.add(bench);
    }
    scene.add(rightJuryGroup);

    // 10. Build 3D Characters matching the reference image!

    // A. JUDGE OWL (Center, majestic owl with glasses & judicial robe)
    const judgeOwl = new THREE.Group();
    judgeOwl.position.set(0, 1.9, -0.6);
    judgeOwl.name = "judge";

    // Owl Body (Black Judicial Robe)
    const owlRobeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.6 });
    const owlBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.75, 1.25, 24),
      owlRobeMat
    );
    owlBody.position.set(0, 0.55, 0);
    owlBody.castShadow = true;
    judgeOwl.add(owlBody);

    // White judicial collar bib
    const owlCollar = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.35, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    owlCollar.position.set(0, 0.95, 0.52);
    judgeOwl.add(owlCollar);

    // Owl Head
    const owlFeatherMat = new THREE.MeshStandardMaterial({ color: 0x8a6242, roughness: 0.7 });
    const owlHead = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), owlFeatherMat);
    owlHead.position.set(0, 1.45, 0);
    owlHead.castShadow = true;
    judgeOwl.add(owlHead);

    // Owl Eye Rings (White and Gold)
    for (const eyeSide of [-0.19, 0.19]) {
      // Golden eye outer ring / glasses
      const glassesRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.025, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.2 })
      );
      glassesRim.position.set(eyeSide, 1.5, 0.42);
      judgeOwl.add(glassesRim);

      // Yellow eye iris
      const eyeIris = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffc107 })
      );
      eyeIris.position.set(eyeSide, 1.5, 0.4);
      judgeOwl.add(eyeIris);

      // Pupil
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x050505 })
      );
      pupil.position.set(eyeSide, 1.5, 0.48);
      judgeOwl.add(pupil);

      // Ear tufts
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.3, 8),
        owlFeatherMat
      );
      tuft.position.set(eyeSide * 1.7, 1.88, 0.05);
      tuft.rotation.z = -eyeSide * 0.4;
      judgeOwl.add(tuft);
    }

    // Glasses bridge
    const glassesBridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 })
    );
    glassesBridge.rotation.z = Math.PI / 2;
    glassesBridge.position.set(0, 1.5, 0.45);
    judgeOwl.add(glassesBridge);

    // Curved Owl Beak
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0xe68a00, roughness: 0.4 })
    );
    beak.rotation.x = Math.PI / 2.3;
    beak.position.set(0, 1.35, 0.48);
    judgeOwl.add(beak);

    scene.add(judgeOwl);
    charactersRef.current.judge = judgeOwl;

    // B. DEFENSE PIGEON (Left, blue-grey plumage, suit and raised wing)
    const defensePigeon = new THREE.Group();
    defensePigeon.position.set(-4.5, 0.75, 1.8);
    defensePigeon.rotation.y = 0.55;
    defensePigeon.name = "defense";

    // Pigeon Body (Navy pinstripe suit)
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.5 });
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.05, 20), suitMat);
    pBody.position.set(0, 0.55, 0);
    pBody.castShadow = true;
    defensePigeon.add(pBody);

    // Pigeon Head (Blue-grey plumage)
    const pigeonMat = new THREE.MeshStandardMaterial({ color: 0x7792a8, roughness: 0.6 });
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), pigeonMat);
    pHead.position.set(0, 1.28, 0.08);
    pHead.castShadow = true;
    defensePigeon.add(pHead);

    // Beak
    const pBeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0xf5b596, roughness: 0.5 })
    );
    pBeak.rotation.x = Math.PI / 2.1;
    pBeak.position.set(0, 1.22, 0.45);
    defensePigeon.add(pBeak);

    // Pigeon Eyes
    for (const side of [-0.18, 0.18]) {
      const pEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      pEye.position.set(side, 1.32, 0.38);
      defensePigeon.add(pEye);
    }

    // Left Wing (Resting on table)
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.38), pigeonMat);
    leftWing.position.set(-0.46, 0.7, 0.1);
    defensePigeon.add(leftWing);

    // Right Wing (DRAMATICALLY RAISED POINTING UPWARD matching image!)
    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(0.46, 0.9, 0);
    rightWingGroup.name = "defenseWing";
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.36), pigeonMat);
    rightWing.position.set(0.2, 0.35, 0.15);
    rightWing.rotation.z = -0.7; // Angled up
    rightWing.rotation.x = -0.3;
    rightWingGroup.add(rightWing);
    defensePigeon.add(rightWingGroup);

    scene.add(defensePigeon);
    charactersRef.current.defense = defensePigeon;

    // C. PROSECUTOR CYBER-PARROT (Right, green feathers, yellow cyber-eye, bowtie, pointing arm)
    const prosecutorParrot = new THREE.Group();
    prosecutorParrot.position.set(4.5, 0.75, 1.8);
    prosecutorParrot.rotation.y = -0.55;
    prosecutorParrot.name = "prosecutor";

    // Parrot Body (Dark charcoal suit with bowtie)
    const pSuitMat = new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.5 });
    const parrotBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.58, 1.1, 20),
      pSuitMat
    );
    parrotBody.position.set(0, 0.55, 0);
    parrotBody.castShadow = true;
    prosecutorParrot.add(parrotBody);

    // Bowtie
    const bowtie = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.1, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x0f0f10 })
    );
    bowtie.position.set(0, 1.05, 0.44);
    prosecutorParrot.add(bowtie);

    // Parrot Head (Vibrant green feathers)
    const parrotGreenMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });
    const parrotHead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), parrotGreenMat);
    parrotHead.position.set(0, 1.34, 0.08);
    parrotHead.castShadow = true;
    prosecutorParrot.add(parrotHead);

    // Big Curved Parrot Beak (Dark grey)
    const parrotBeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.4 })
    );
    parrotBeak.rotation.x = Math.PI / 1.9;
    parrotBeak.position.set(0, 1.25, 0.5);
    prosecutorParrot.add(parrotBeak);

    // Right Eye: Normal bird eye
    const normalEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    normalEye.position.set(0.2, 1.4, 0.38);
    prosecutorParrot.add(normalEye);

    // Left Eye: ROBOTIC CYBERNETIC EYE (Glowing yellow with metallic ring matching image!)
    const cyberEyeRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.03, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.9, roughness: 0.2 })
    );
    cyberEyeRim.position.set(-0.2, 1.4, 0.4);
    prosecutorParrot.add(cyberEyeRim);

    const cyberEyeLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffeb3b })
    );
    cyberEyeLens.position.set(-0.2, 1.4, 0.39);
    prosecutorParrot.add(cyberEyeLens);

    // Pointing Arm/Wing (Accusatory forward point matching reference image)
    const pointWingGroup = new THREE.Group();
    pointWingGroup.position.set(-0.46, 0.85, 0.1);
    pointWingGroup.name = "prosecutorArm";
    const armFore = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.65), parrotGreenMat);
    armFore.position.set(-0.25, 0.1, 0.45);
    armFore.rotation.y = -0.4;
    pointWingGroup.add(armFore);

    // Pointing cyber-finger
    const finger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.4 })
    );
    finger.rotation.x = Math.PI / 2;
    finger.position.set(-0.35, 0.1, 0.85);
    pointWingGroup.add(finger);
    prosecutorParrot.add(pointWingGroup);

    scene.add(prosecutorParrot);
    charactersRef.current.prosecutor = prosecutorParrot;

    // D. JUROR BIRDS (Cute little birds sitting in jury box)
    charactersRef.current.jurors = [];
    const jurorDefs = [
      { x: -6.4, y: 0.85, z: -3.2, color: 0x9e7855, size: 0.24, label: "Sparrow" }, // Sparrow
      { x: -5.4, y: 0.85, z: -3.2, color: 0x222226, size: 0.28, label: "Penguin", tie: true }, // Penguin in tie!
      { x: -4.4, y: 0.85, z: -3.2, color: 0x4fa3e3, size: 0.22, label: "Bluebird" }, // Bluebird
      { x: -6.0, y: 1.4, z: -4.5, color: 0x7c5030, size: 0.32, label: "Falcon" }, // Falcon
    ];

    jurorDefs.forEach((j) => {
      const bird = new THREE.Group();
      bird.position.set(j.x, j.y, j.z);
      bird.lookAt(0, 1.5, 0); // Face judge & lawyers

      const bBody = new THREE.Mesh(
        new THREE.SphereGeometry(j.size, 16, 16),
        new THREE.MeshStandardMaterial({ color: j.color, roughness: 0.7 })
      );
      bBody.scale.set(0.9, 1.2, 0.9);
      bBody.castShadow = true;
      bird.add(bBody);

      const bHead = new THREE.Mesh(
        new THREE.SphereGeometry(j.size * 0.7, 16, 16),
        new THREE.MeshStandardMaterial({ color: j.color, roughness: 0.7 })
      );
      bHead.position.set(0, j.size * 0.95, j.size * 0.35);
      bird.add(bHead);

      const bBeak = new THREE.Mesh(
        new THREE.ConeGeometry(j.size * 0.25, j.size * 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      );
      bBeak.rotation.x = Math.PI / 2;
      bBeak.position.set(0, j.size * 0.9, j.size * 1.05);
      bird.add(bBeak);

      if (j.tie) {
        const miniTie = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.18, 0.02),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        miniTie.position.set(0, j.size * 0.45, j.size * 0.75);
        bird.add(miniTie);
      }

      scene.add(bird);
      charactersRef.current.jurors!.push(bird);
    });

    // 11. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Idle breathing and head movements
      if (charactersRef.current.judge) {
        charactersRef.current.judge.position.y = 1.9 + Math.sin(time * 1.6) * 0.025 * motionScale;
        // Head slight turn
        const jHead = charactersRef.current.judge.children.find((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry);
        if (jHead) jHead.rotation.y = Math.sin(time * 0.8) * 0.12 * motionScale;
      }

      if (charactersRef.current.defense) {
        const dWing = charactersRef.current.defense.getObjectByName("defenseWing");
        if (dWing) {
          // Bob wing emphatically when defense is speaking
          dWing.rotation.x = -0.3 + Math.sin(time * 3.5) * 0.15 * motionScale;
        }
      }

      if (charactersRef.current.prosecutor) {
        const pArm = charactersRef.current.prosecutor.getObjectByName("prosecutorArm");
        if (pArm) {
          // Sharp accusatory thrust
          pArm.position.z = 0.1 + Math.sin(time * 3.0) * 0.05 * motionScale;
        }
      }

      // Little juror birds look around and chirp
      charactersRef.current.jurors?.forEach((jBird, idx) => {
        jBird.rotation.y = Math.sin(time * 1.8 + idx * 1.2) * 0.15 * motionScale;
      });

      // Smooth camera interpolation towards target
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.05);
        controlsRef.current.target.lerp(targetCamLook.current, 0.05);
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize handler
    const handleResize = () => {
      if (!cameraRef.current || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  // Update Camera presets or follow active speaker
  useEffect(() => {
    switch (cameraPreset) {
      case "judge":
        targetCamPos.current.set(0, 3.8, 4.2);
        targetCamLook.current.set(0, 3.2, -0.6);
        break;
      case "defense":
        targetCamPos.current.set(-3.2, 2.6, 5.0);
        targetCamLook.current.set(-4.5, 2.2, 1.8);
        break;
      case "prosecutor":
        targetCamPos.current.set(3.2, 2.6, 5.0);
        targetCamLook.current.set(4.5, 2.2, 1.8);
        break;
      case "jury":
        targetCamPos.current.set(-3.2, 3.2, -0.8);
        targetCamLook.current.set(-5.6, 2.0, -3.2);
        break;
      case "overview":
      default:
        targetCamPos.current.set(0, 4.8, 10.5);
        targetCamLook.current.set(0, 1.8, 0);
        break;
    }
  }, [cameraPreset]);

  // Auto-focus camera on current speaker if user hasn't locked camera
  useEffect(() => {
    if (!currentMessage) return;
    if (cameraPreset === "overview") {
      if (currentMessage.speaker === "judge") {
        targetCamLook.current.set(0, 2.6, -0.6);
      } else if (currentMessage.speaker === "defense") {
        targetCamLook.current.set(-4.2, 2.2, 1.8);
      } else if (currentMessage.speaker === "prosecutor") {
        targetCamLook.current.set(4.2, 2.2, 1.8);
      } else if (currentMessage.speaker.startsWith("juror")) {
        targetCamLook.current.set(-5.2, 2.2, -3.0);
      }
    }
  }, [currentMessage, cameraPreset]);

  useEffect(() => {
    const active = currentMessage?.speaker;
    const characters = charactersRef.current;
    (["judge", "defense", "prosecutor"] as const).forEach((role) => {
      const group = characters[role];
      if (group) group.scale.setScalar(active === role ? 1.08 : 1);
    });
    characters.jurors?.forEach((group, index) => {
      const activeIndex = active?.startsWith("juror") ? Number(active.slice(-1)) - 1 : -1;
      group.scale.setScalar(activeIndex === index ? 1.22 : 1);
    });
  }, [currentMessage]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {currentMessage && <div key={`${currentMessage.speaker}-${currentMessage.timestamp}-${replayToken}`} className="absolute inset-0 pointer-events-none">
        <article role="status" aria-live="polite" aria-atomic="true" className={`message-bubble bubble-${currentMessage.speaker} bubble-${currentMessage.type} ${/charges|first-degree|vaporware/i.test(currentMessage.text)?"bubble-accusation":""}`}>
          <header><span aria-hidden="true" className="speaker-seal">{currentMessage.speakerName.slice(0,1)}</span><span><b>{currentMessage.speakerName}</b><small>{currentMessage.role} · {currentMessage.phase?.replaceAll("-"," ")}</small></span></header>
          {currentMessage.type === "objection" && <strong className="bubble-event objection-label">OBJECTION</strong>}
          {currentMessage.type === "ruling" && <strong className="bubble-event ruling-label">THE COURT RULES</strong>}
          {currentMessage.type === "order" && <strong className="bubble-event ruling-label">ORDER IN THE COURT</strong>}
          {currentMessage.type === "verdict" && <strong className="bubble-event verdict-label">FINAL VERDICT</strong>}
          <p>{currentMessage.text}</p>
        </article>
      </div>}

      {/* Camera Guidance Pill */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-300 text-xs text-gray-600 shadow-sm flex items-center gap-2 pointer-events-none">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Drag to rotate 3D camera • Scroll to zoom • Right-click to pan</span>
      </div>
    </div>
  );
}
