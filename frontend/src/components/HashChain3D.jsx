import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function HashChain3D({ entries = [], onSelectBlock }) {
  const mountRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#070c18");
    scene.fog = new THREE.FogExp2("#070c18", 0.038);

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.4, Math.max(7.5, entries.length * 2.2));
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const keyLight = new THREE.PointLight(0x22d3ee, 3, 35);
    keyLight.position.set(4, 7, 7);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(32, 32, 0x1e293b, 0x0f172a);
    grid.position.y = -1.65;
    scene.add(grid);

    const chainGroup = new THREE.Group();
    const meshes = [];
    const spacing = 2.7;
    const startX = -((Math.max(entries.length, 1) - 1) * spacing) / 2;

    if (entries.length === 0) {
      // Genesis Placeholder Core
      const geo = new THREE.OctahedronGeometry(1.1, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        wireframe: true,
      });
      const genesis = new THREE.Mesh(geo, mat);
      chainGroup.add(genesis);
      meshes.push(genesis);
    } else {
      entries.forEach((entry, i) => {
        const ok = entry.isValid;
        const color = ok ? 0x10b981 : 0xef4444;

        const geo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: ok ? 0.28 : 0.7,
          roughness: 0.2,
          metalness: 0.75,
        });
        const cube = new THREE.Mesh(geo, mat);
        cube.position.x = startX + i * spacing;
        cube.userData = { entry };
        chainGroup.add(cube);
        meshes.push(cube);

        // Cyan Witness Halo
        if (entry.witnessName) {
          const ringGeo = new THREE.TorusGeometry(0.98, 0.045, 16, 48);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.copy(cube.position);
          ring.rotation.x = Math.PI / 2.3;
          chainGroup.add(ring);
        }

        // Cryptographic Link Bridge
        if (i < entries.length - 1) {
          const nextOk = entries[i + 1].isValid;
          const linkGeo = new THREE.CylinderGeometry(0.08, 0.08, spacing - 1.35, 14);
          const linkMat = new THREE.MeshBasicMaterial({
            color: nextOk ? 0x34d399 : 0xef4444,
            transparent: true,
            opacity: nextOk ? 0.9 : 0.4,
          });
          const link = new THREE.Mesh(linkGeo, linkMat);
          link.rotation.z = Math.PI / 2;
          link.position.set(cube.position.x + spacing / 2, nextOk ? 0 : -0.4, 0);
          if (!nextOk) link.rotation.y = 0.45;
          chainGroup.add(link);
        }
      });
    }

    scene.add(chainGroup);

    // Drag-to-rotate + Click-to-inspect
    let isDragging = false;
    let prevX = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onUp = () => {
      isDragging = false;
    };
    const onMove = (e) => {
      if (isDragging) {
        const delta = e.clientX - prevX;
        chainGroup.rotation.y += delta * 0.008;
        prevX = e.clientX;
      }
    };
    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0 && hits[0].object.userData.entry) {
        const hit = hits[0].object.userData.entry;
        setSelected(hit);
        if (onSelectBlock) onSelectBlock(hit);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    dom.addEventListener("mousemove", onMove);
    dom.addEventListener("click", onClick);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      meshes.forEach((m, idx) => {
        const isOk = m.userData?.entry ? m.userData.entry.isValid : true;
        m.rotation.y += isOk ? 0.008 : 0.04;
        m.position.y = Math.sin(Date.now() * 0.002 + idx) * 0.09;
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
      window.removeEventListener("mouseup", onUp);
      dom.removeEventListener("mousedown", onDown);
      dom.removeEventListener("mousemove", onMove);
      dom.removeEventListener("click", onClick);
      renderer.dispose();
    };
  }, [entries, onSelectBlock]);

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-800 bg-[#070c18] shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center gap-2">
        <span className="font-bold text-cyan-400">3D ProofVault Chain</span>
        <span className="text-slate-400">Drag to rotate • Click any block to inspect SHA-256</span>
      </div>

      {selected && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-slate-950/95 backdrop-blur p-3.5 rounded-xl border border-cyan-500/40 text-xs space-y-1 max-w-md">
          <div className="flex justify-between items-center">
            <span className="font-bold text-emerald-400">
              Block #{selected.id} • {selected.employer}
            </span>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white ml-4">
              ✕
            </button>
          </div>
          <p className="text-slate-300">
            Promised: <strong>₹{selected.promisedInr}</strong> | Paid:{" "}
            <strong className="text-amber-400">₹{selected.paidInr}</strong> ({selected.hours} hrs)
          </p>
          <p className="font-mono text-[10px] text-cyan-300 break-all">
            SHA-256: {selected.entryHash}
          </p>
        </div>
      )}
    </div>
  );
}
