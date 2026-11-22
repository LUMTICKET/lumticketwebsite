
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function TicketHero3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animationFrame = 0;
    let disposed = false;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      38,
      1,
      0.1,
      100
    );
    camera.position.set(0, 8.5, 15.5);
    camera.lookAt(0, 0.3, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");

    mount.appendChild(renderer.domElement);

    // LumTicket brand palette
    const navy = 0x042045;
    const deepNavy = 0x06172d;
    const gold = 0xcc9f2f;
    const paleGold = 0xf1d98e;
    const buildingBlue = 0x163c63;
    const glassBlue = 0x8caec8;
    const roadColor = 0x25374a;

    // Lighting
    scene.add(new THREE.HemisphereLight(0xe9f2ff, 0x18263a, 2.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
    keyLight.position.set(-5, 10, 8);
    scene.add(keyLight);

    const goldLight = new THREE.PointLight(gold, 25, 25);
    goldLight.position.set(4, 5, -3);
    scene.add(goldLight);

    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, -0.7, 0);
    cityGroup.rotation.x = -0.12;
    scene.add(cityGroup);

    // Materials
    const islandMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8edf3,
      roughness: 0.88,
      metalness: 0.02,
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: navy,
      roughness: 0.72,
    });

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: roadColor,
      roughness: 0.92,
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: gold,
      metalness: 0.25,
      roughness: 0.42,
      emissive: gold,
      emissiveIntensity: 0.08,
    });

    // Floating city island base
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(5.25, 5.0, 0.55, 96),
      islandMaterial
    );
    island.position.y = 0;
    island.receiveShadow = true;
    cityGroup.add(island);

    const islandSide = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 4.85, 0.4, 96),
      sideMaterial
    );
    islandSide.position.y = -0.43;
    cityGroup.add(islandSide);

    // Gold trim around the island
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(4.98, 0.045, 8, 96),
      goldMaterial
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = -0.17;
    cityGroup.add(trim);

    // Central green/plaza area
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(2.35, 64),
      new THREE.MeshStandardMaterial({
        color: 0xd9e6df,
        roughness: 1,
      })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.29;
    cityGroup.add(plaza);

    // Circular road
    const road = new THREE.Mesh(
      new THREE.RingGeometry(2.72, 3.55, 96),
      roadMaterial
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.31;
    cityGroup.add(road);

    // Road edge markings
    const makeRoadLine = (radius: number, color: number) => {
      const line = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.025, 6, 96),
        new THREE.MeshBasicMaterial({ color })
      );
      line.rotation.x = Math.PI / 2;
      line.position.y = 0.335;
      cityGroup.add(line);
    };

    makeRoadLine(2.76, 0xffffff);
    makeRoadLine(3.5, gold);

    // Dashed lane markings around the road
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const dash = new THREE.Mesh(
        new THREE.BoxGeometry(0.19, 0.012, 0.035),
        new THREE.MeshBasicMaterial({ color: 0xf4f5f6 })
      );

      dash.position.set(
        Math.cos(angle) * 3.12,
        0.345,
        Math.sin(angle) * 3.12
      );
      dash.rotation.y = -angle;
      cityGroup.add(dash);
    }

    // Building materials
    const buildingMaterials = [
      new THREE.MeshStandardMaterial({
        color: buildingBlue,
        roughness: 0.45,
        metalness: 0.15,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x294f73,
        roughness: 0.5,
        metalness: 0.1,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xe0e5eb,
        roughness: 0.7,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xb7c9d9,
        roughness: 0.5,
        metalness: 0.12,
      }),
    ];

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: glassBlue,
      emissive: 0x284d6b,
      emissiveIntensity: 0.18,
      metalness: 0.2,
      roughness: 0.28,
    });

    // Create city buildings around the inner plaza and outer edge.
    const buildingPositions = [
      [-1.3, -1.15, 0.75, 1.15, 0.8],
      [1.15, -1.35, 0.8, 1.5, 0.85],
      [-1.3, 1.25, 0.8, 1.25, 0.8],
      [1.25, 1.2, 0.8, 1.1, 0.8],
      [-4.15, -1.25, 0.78, 1.5, 0.8],
      [-3.95, 1.15, 0.95, 2.1, 0.85],
      [-2.25, -3.95, 0.8, 1.5, 0.8],
      [0.0, -4.1, 0.95, 2.1, 0.8],
      [2.2, -3.9, 0.75, 1.35, 0.8],
      [4.0, -1.25, 0.8, 1.6, 0.85],
      [4.05, 1.15, 0.78, 1.3, 0.8],
      [-2.2, 3.9, 0.85, 1.8, 0.8],
      [0.0, 4.05, 0.72, 1.3, 0.8],
      [2.2, 3.85, 0.82, 1.65, 0.8],
    ];

    buildingPositions.forEach((data, index) => {
      const [x, z, width, height, depth] = data;

      const material = buildingMaterials[index % buildingMaterials.length];
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
      );

      building.position.set(x, 0.31 + height / 2, z);
      cityGroup.add(building);

      // Rooftop detail
      if (index % 3 === 0) {
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.35, 0.12, depth * 0.35),
          goldMaterial
        );
        roof.position.set(
          x,
          0.31 + height + 0.06,
          z
        );
        cityGroup.add(roof);
      }

      // Front-facing rows of windows
      const rows = Math.max(1, Math.floor(height / 0.28));
      const columns = Math.max(1, Math.floor(width / 0.22));

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const windowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.075, 0.09, 0.018),
            windowMaterial
          );

          windowMesh.position.set(
            x - width / 2 + 0.13 + col * 0.19,
            0.42 + row * 0.23,
            z + depth / 2 + 0.012
          );
          cityGroup.add(windowMesh);
        }
      }
    });

    // Small trees around the plaza
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x806344,
      roughness: 1,
    });

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c8d78,
      roughness: 1,
    });

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = Math.cos(angle) * 2.05;
      const z = Math.sin(angle) * 2.05;

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, 0.28, 6),
        trunkMaterial
      );
      trunk.position.set(x, 0.48, z);
      cityGroup.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        leafMaterial
      );
      crown.position.set(x, 0.69, z);
      cityGroup.add(crown);
    }

    // Bus group
    const bus = new THREE.Group();
    cityGroup.add(bus);

    const busBodyMaterial = new THREE.MeshStandardMaterial({
      color: navy,
      roughness: 0.38,
      metalness: 0.16,
    });

    const busGoldMaterial = new THREE.MeshStandardMaterial({
      color: gold,
      roughness: 0.38,
      metalness: 0.22,
    });

    const busBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.32, 0.88),
      busBodyMaterial
    );
    busBody.position.y = 0.53;
    bus.add(busBody);

    const busRoof = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.09, 0.64),
      busGoldMaterial
    );
    busRoof.position.set(0, 0.73, -0.01);
    bus.add(busRoof);

    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.025),
      new THREE.MeshStandardMaterial({
        color: 0xbdd5e7,
        metalness: 0.2,
        roughness: 0.2,
      })
    );
    windshield.position.set(0, 0.58, 0.45);
    bus.add(windshield);

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x17202b,
      roughness: 0.85,
    });

    for (const side of [-1, 1]) {
      for (const frontBack of [-1, 1]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.055, 12),
          wheelMaterial
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(
          side * 0.22,
          0.43,
          frontBack * 0.27
        );
        bus.add(wheel);
      }
    }

    // Ticket-like paper planes
    const ticketGroup = new THREE.Group();
    scene.add(ticketGroup);

    const ticketMaterials = [
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.72,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: paleGold,
        roughness: 0.68,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xe4edf5,
        roughness: 0.7,
        side: THREE.DoubleSide,
      }),
    ];

    type FlyingTicket = {
      group: THREE.Group;
      speed: number;
      phase: number;
      radius: number;
      height: number;
      tilt: number;
    };

    const flyingTickets: FlyingTicket[] = [];

    const createTicket = (material: THREE.Material) => {
      const group = new THREE.Group();

      // Ticket body with a pointed front, giving it a paper-plane silhouette.
      const shape = new THREE.Shape();
      shape.moveTo(-0.36, -0.16);
      shape.lineTo(0.17, -0.16);
      shape.lineTo(0.39, 0);
      shape.lineTo(0.17, 0.16);
      shape.lineTo(-0.36, 0.16);
      shape.lineTo(-0.29, 0.08);
      shape.lineTo(-0.36, 0);
      shape.lineTo(-0.29, -0.08);
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      const face = new THREE.Mesh(geometry, material);
      group.add(face);

      // Center crease / paper-plane fold
      const creasePoints = [
        new THREE.Vector3(-0.29, 0, 0.012),
        new THREE.Vector3(0.36, 0, 0.012),
      ];
      const creaseGeometry = new THREE.BufferGeometry().setFromPoints(
        creasePoints
      );
      const crease = new THREE.Line(
        creaseGeometry,
        new THREE.LineBasicMaterial({
          color: navy,
          transparent: true,
          opacity: 0.38,
        })
      );
      group.add(crease);

      // Ticket perforation marks
      for (let i = 0; i < 4; i++) {
        const mark = new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.012, 0.008),
          new THREE.MeshBasicMaterial({
            color: gold,
            transparent: true,
            opacity: 0.9,
          })
        );
        mark.position.set(-0.19 + i * 0.09, -0.07, 0.015);
        group.add(mark);
      }

      return group;
    };

    for (let i = 0; i < 9; i++) {
      const group = createTicket(ticketMaterials[i % ticketMaterials.length]);
      ticketGroup.add(group);

      flyingTickets.push({
        group,
        speed: 0.16 + (i % 4) * 0.035,
        phase: (i / 9) * Math.PI * 2,
        radius: 5.8 + (i % 3) * 0.7,
        height: 1.0 + (i % 4) * 0.85,
        tilt: (i % 2 === 0 ? 1 : -1) * (0.15 + (i % 3) * 0.12),
      });
    }

    // Floating gold and white particles
    const particleCount = 140;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 17;
      particlePositions[i * 3 + 1] = Math.random() * 8 - 1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: gold,
      size: 0.035,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Soft decorative orbit rings behind the city
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    for (let i = 0; i < 3; i++) {
      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(5.9 + i * 0.55, 0.009, 4, 120),
        new THREE.MeshBasicMaterial({
          color: i === 1 ? gold : 0x8fa9c2,
          transparent: true,
          opacity: i === 1 ? 0.42 : 0.22,
        })
      );
      orbit.rotation.x = 1.1 + i * 0.18;
      orbit.rotation.y = i * 0.45;
      orbit.position.set(0, 0.4 + i * 0.22, -0.3);
      orbitGroup.add(orbit);
    }

    // Responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      if (!mount || disposed) return;

      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);

      camera.aspect = width / height;
      camera.position.z = width < 640 ? 19 : width < 1024 ? 17 : 15.5;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    });

    resizeObserver.observe(mount);

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      if (disposed) return;

      animationFrame = window.requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Slowly rotate the island for a living, miniature-city effect.
      cityGroup.rotation.y = time * 0.055;

      // Bus follows the circular road.
      const busAngle = time * 0.42;
      const busRadius = 3.12;

      bus.position.set(
        Math.cos(busAngle) * busRadius,
        0,
        Math.sin(busAngle) * busRadius
      );

      // Align the bus to its direction of travel.
      bus.rotation.y = -busAngle + Math.PI / 2;

      // Paper tickets glide around the city at different heights.
      flyingTickets.forEach((ticket, index) => {
        const angle = time * ticket.speed + ticket.phase;

        ticket.group.position.set(
          Math.cos(angle) * ticket.radius,
          ticket.height + Math.sin(time * 1.2 + index) * 0.24,
          Math.sin(angle) * ticket.radius * 0.62
        );

        ticket.group.rotation.set(
          ticket.tilt + Math.sin(time + index) * 0.12,
          -angle + Math.PI / 2,
          Math.sin(time * 0.8 + index) * 0.14
        );
      });

      particles.rotation.y = time * 0.012;
      orbitGroup.rotation.y = -time * 0.018;
      goldLight.intensity = 22 + Math.sin(time * 1.4) * 3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
          object.geometry.dispose();

          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="ticket-scene"
      aria-hidden="true"
    />
  );
}
