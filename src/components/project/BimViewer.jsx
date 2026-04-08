import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useLanguage } from '@/components/i18n/useLanguage';

const toPublicStorageUrl = (filePath) => {
  if (!filePath) return null;
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!baseUrl) return null;
  const path = filePath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${baseUrl}/storage/v1/object/public/project-files/${path}`;
};

const uniqueUrls = (values) => [...new Set(values.filter(Boolean))];

const setupScene = (container) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f8fafc');

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    3000,
  );
  camera.position.set(12, 12, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1, 0);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.1);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(10, 20, 12);
  scene.add(hemiLight, dirLight, new THREE.GridHelper(80, 80, 0xe2e8f0, 0xe2e8f0));

  let frameId = null;
  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };
  animate();

  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('resize', handleResize);

  return {
    scene,
    camera,
    renderer,
    controls,
    dispose: () => {
      window.removeEventListener('resize', handleResize);
      if (frameId) cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
};

const fitCameraToObject = (camera, controls, object) => {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const distance = Math.max(maxDim / (2 * Math.tan(fov / 2)), maxDim * 1.2);

  camera.position.set(center.x + distance, center.y + distance * 0.8, center.z + distance);
  controls.target.copy(center);
  controls.update();
};

export default function BimViewer({ fileUrl, fileType, filePath, fallbackUrl }) {
  const { t } = useLanguage();
  const mountRef = useRef(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const isIfc = fileType === 'ifc';

  const ifcSourceUrl = uniqueUrls([
    toPublicStorageUrl(filePath),
    fallbackUrl,
    fileUrl,
  ])[0] || null;

  const ifcViewerUrl = ifcSourceUrl ? `https://3dviewer.net/#model=${ifcSourceUrl}` : null;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !fileType || isIfc) return undefined;

    let disposed = false;
    let cleanupScene = null;

    const run = async () => {
      try {
        setError('');
        setIsLoading(true);

        cleanupScene = setupScene(mount);
        const { scene, camera, controls } = cleanupScene;
        const gltfLoader = new GLTFLoader();
        const candidateUrls = uniqueUrls([
          fileUrl,
          fallbackUrl,
          toPublicStorageUrl(filePath),
        ]);

        if (!candidateUrls.length) {
          throw new Error(t('bimViewer.noModelUrl'));
        }

        let gltf = null;
        let lastError = null;

        for (const url of candidateUrls) {
          try {
            gltf = await gltfLoader.loadAsync(url);
            if (gltf) break;
          } catch (candidateError) {
            lastError = candidateError;
          }
        }

        if (!gltf) {
          throw lastError || new Error(t('bimViewer.loadFailed'));
        }

        if (!disposed) {
          scene.add(gltf.scene);
          fitCameraToObject(camera, controls, gltf.scene);
        }
      } catch (loadError) {
        if (!disposed) {
          const rawMessage = loadError?.message || '';
          const friendlyMessage = rawMessage.includes("Unexpected token '<'")
            ? t('bimViewer.invalidModelUrl')
            : (rawMessage || t('bimViewer.loadFailed'));
          setError(friendlyMessage);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      disposed = true;
      if (cleanupScene) cleanupScene.dispose();
    };
  }, [fileUrl, fileType, filePath, fallbackUrl, isIfc]);

  if (isIfc) {
    return (
      <div className="h-full min-h-[320px] w-full rounded-md border bg-slate-50 overflow-hidden grid place-items-center p-6 text-center">
        <div className="space-y-3 max-w-xl">
          <p className="text-sm text-slate-700">
            {t('bimViewer.ifcExternalDescription')}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a
              href={ifcViewerUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-[#ef6144] hover:bg-[#d9553a] text-white px-4 py-2 text-sm"
            >
              {t('bimViewer.openIfcViewer')}
            </a>
            <a
              href={ifcSourceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-slate-300 hover:bg-slate-100 px-4 py-2 text-sm"
            >
              {t('bimViewer.openIfcFile')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[320px] w-full relative rounded-md border bg-slate-50 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 grid place-items-center text-sm text-slate-600 bg-white/70 z-10">
          {t('bimViewer.loadingModel')}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center text-sm text-red-600 bg-white/90 z-20 px-4 text-center">
          {error}
        </div>
      )}
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
