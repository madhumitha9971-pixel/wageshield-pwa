import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function HashChain3D({ entries = [], chainValid = true, onSelectBlock }) {
  const mountRef = useRef(null);
  const [hoveredInfo, setHoveredInfo] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090d16");
    scene.fog = new THREE.FogExp2("#090d16", 0.045);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.2, Math.max(7, entries.length * 2.1));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pointLight = new THREE.PointLight(0x38bdf8, 2.5, 30);
    pointLight.position.set(4, 6, 6);
    scene.add(pointLight);

    // Subtle Grid Floor
    const grid = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    grid.position.y = -1.6;
    scene.add(grid);

    const group = new THREE.Group();
    const blockMeshes = [];
    const spacing = 2.6;
    const startX = -((entries.length - 1) * spacing) / 2;

    entries.forEach((entry, idx) => {
      const valid = entry.is_valid;
      const color = valid ? 0x10b981 : 0xef4444;

      // Core cryptographic cube
      const geo = new THREE.BoxGeometry(1.25, 1.25, 1.25);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: valid ? 0.25 : 0.65,
        roughness: 0.25,
        metalness: 0.7,
      });
      const cube = new THREE.Mesh(geo, mat);
      cube.position.x = startX + idx * spacing;
      cube.userData = { entry };
      group.add(cube);
      blockMeshes.push(cube);

      // Witness Halo Ring if co-signed
      if (entry.witness_name) {
        const ringGeo = new THREE.TorusGeometry(0.95, 0.04, 16, 48);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(cube.position);
        ring.rotation.x = Math.PI / 2.4;
        group.add(ring);
      }

      // Hash Link Beam to Next Block
      if (idx < entries.length - 1) {
        const nextValid = entries[idx + 1].is_valid;
        const linkGeo = new THREE.CylinderGeometry(0.08, 0.08, spacing - 1.3, 12);
        const linkMat = new THREE.MeshBasicMaterial({
          color: nextValid ? 0x34d399 : 0xef4444,
          transparent: true,
          opacity: nextValid ? 0.85 : 0.35,
        });
        const link = new THREE.Mesh(linkGeo, linkMat);
        link.rotation.z = Math.PI / 2;
        link.position.set(cube.position.x + spacing / 2, nextValid ? 0 : -0.35, 0);
        if (!nextValid) link.rotation.y = 0.4; // Visually fractured link
        group.add(link);
      }
    });

    scene.add(group);

    // Raycaster for interactive click/hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointer = (event, isClick = false) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(blockMeshes);
      if (hits.length > 0) {
        const hitEntry = hits[0].object.userData.entry;
        setHoveredInfo(hitEntry);
        if (isClick && onSelectBlock) onSelectBlock(hitEntry);
      } else {
        setHoveredInfo(null);
      }
    };

    const onMove = (e) => handlePointer(e, false);
    const onClick = (e) => handlePointer(e, true);
    renderer.domElement.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("click", onClick);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      blockMeshes.forEach((mesh, i) => {
        mesh.rotation.y += mesh.userData.entry.is_valid ? 0.008 : 0.035;
        mesh.position.y = Math.sin(Date.now() * 0.002 + i) * 0.08;
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
    };
  }, [entries, chainValid, onSelectBlock]);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-pointer" />
      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
        <span className="font-semibold text-slate-200">3D SHA-256 Hash Chain</span>
        <span className="ml-2 text-slate-400">• Cyan Halo = Witness Co-Signed</span>
      </div>
      {hoveredInfo && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-slate-950/90 backdrop-blur p-3 rounded-lg border border-slate-700 text-xs text-slate-200">
          <div className="font-bold text-emerald-400">
            Block #{hoveredInfo.id} — {hoveredInfo.employer}
          </div>
          <div>Promised: ₹{hoveredInfo.promised_inr} | Paid: ₹{hoveredInfo.paid_inr}</div>
          <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
            SHA-256: {hoveredInfo.entry_hash}
          </div>
        </div>
      )}
    </div>
  );
}
