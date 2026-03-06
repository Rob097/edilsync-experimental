import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Download, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import { appClient } from '@/api/appClient';

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

const toAbsoluteUrl = (url) => {
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
};

const WEB_IFC_WASM_URL = toAbsoluteUrl('/web-ifc.wasm');
const WEB_IFC_MT_WASM_URL = toAbsoluteUrl('/web-ifc-mt.wasm');
const FRAGMENTS_WORKER_URL = toAbsoluteUrl('/thatopen-fragments-worker.mjs');

const resolveWasmUrl = (requestedUrl) => {
  const normalized = String(requestedUrl || '').split('?')[0].toLowerCase();
  if (normalized.includes('web-ifc-mt.wasm')) return WEB_IFC_MT_WASM_URL;
  if (normalized.includes('web-ifc.wasm')) return WEB_IFC_WASM_URL;
  return requestedUrl;
};

const locateWebIfcAsset = (url) => {
  return resolveWasmUrl(url);
};

const assertWasmBinary = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download WASM fallito (${response.status}) da ${url}`);
  }
  const header = new Uint8Array(await response.arrayBuffer().then((buffer) => buffer.slice(0, 4)));
  const isWasm = header.length === 4
    && header[0] === 0x00
    && header[1] === 0x61
    && header[2] === 0x73
    && header[3] === 0x6d;

  if (!isWasm) {
    throw new Error(`Runtime WASM non valido (atteso 00 61 73 6d) su ${url}`);
  }
};

export default function InAppIfcViewer({ fileUrl, fallbackUrl, filePath, documentId, fileType, fileSize }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState('Preparazione viewer...');
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutFallbackActive, setTimeoutFallbackActive] = useState(false);

  const ifcSourceUrl = useMemo(
    () =>
      uniqueUrls([
        fileUrl,
        fallbackUrl,
        toPublicStorageUrl(filePath),
      ])[0] || null,
    [fileUrl, fallbackUrl, filePath],
  );

  const ifcViewerUrl = ifcSourceUrl ? `https://3dviewer.net/#model=${ifcSourceUrl}` : null;

  const trackTelemetry = async (eventType, payload = {}) => {
    if (!documentId) return;
    try {
      await appClient.entities.DocumentRevisionEvent.create({
        document_id: documentId,
        event_type: eventType,
        payload,
      });
    } catch {
      // Telemetry must never block viewer UX.
    }
  };

  useEffect(() => {
    if (!ifcSourceUrl || !mountRef.current) {
      setStatus('error');
      setError('Nessun URL IFC disponibile per la visualizzazione in-app.');
      return undefined;
    }

    let cancelled = false;
    let components = null;
    let loadTimeoutId = null;
    let removeCameraUpdateListener = null;
    const startedAt = performance.now();

    const fitModel = (world, object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 1);
      const distance = maxDim * 1.8;

      world.camera.controls.setLookAt(
        center.x + distance,
        center.y + distance * 0.7,
        center.z + distance,
        center.x,
        center.y,
        center.z,
      );
    };

    const init = async () => {
      try {
        setStatus('loading');
        setError('');
        setTimeoutFallbackActive(false);
        setLoadingStep('Download IFC...');

        trackTelemetry('ifc_open_started', {
          file_type: fileType || 'ifc',
          file_size: fileSize || null,
          retry_count: retryCount,
        });

        const response = await fetch(ifcSourceUrl);
        if (!response.ok) {
          throw new Error(`Download IFC fallito (${response.status}).`);
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!bytes.length) {
          throw new Error('Il file IFC risulta vuoto.');
        }

        setLoadingStep('Inizializzazione motore 3D...');

        components = new OBC.Components();
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create();

        world.scene = new OBC.SimpleScene(components);
        world.renderer = new OBC.SimpleRenderer(components, mountRef.current);
        world.camera = new OBC.SimpleCamera(components);

        components.init();
        world.scene.setup();

        world.camera.controls.setLookAt(20, 15, 20, 0, 0, 0);

        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(FRAGMENTS_WORKER_URL);

        const ifcLoader = components.get(OBC.IfcLoader);
        setLoadingStep('Preparazione runtime IFC...');
        await Promise.all([assertWasmBinary(WEB_IFC_WASM_URL), assertWasmBinary(WEB_IFC_MT_WASM_URL)]);

        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: {
            path: toAbsoluteUrl('/'),
            absolute: true,
          },
          customLocateFileHandler: locateWebIfcAsset,
        });

        setLoadingStep('Parsing IFC...');
        const loadPromise = ifcLoader.load(bytes, true, `ifc-${Date.now()}`);
        const timeoutPromise = new Promise((_, reject) => {
          loadTimeoutId = window.setTimeout(() => {
            reject(new Error('Timeout caricamento IFC in-app (oltre 60s).'));
          }, 60000);
        });

        const model = await Promise.race([loadPromise, timeoutPromise]);
        model.useCamera(world.camera.three);
        world.scene.three.add(model.object);

        const onCameraUpdate = () => {
          fragments.core.update();
        };
        world.camera.controls.addEventListener('update', onCameraUpdate);
        removeCameraUpdateListener = () => {
          world.camera.controls.removeEventListener('update', onCameraUpdate);
        };

        // Force an initial tile update so the first frame is not an empty scene.
        setLoadingStep('Rendering geometrie...');
        await fragments.core.update(true);

        if (model.visibleItems.size === 0) {
          throw new Error('Nessuna geometria IFC visibile nel modello (file vuoto o non supportato).');
        }

        fitModel(world, model.object);

        const firstRenderMs = Math.round(performance.now() - startedAt);
        trackTelemetry('ifc_open_success', {
          file_type: fileType || 'ifc',
          file_size: fileSize || null,
          first_render_ms: firstRenderMs,
          retry_count: retryCount,
        });

        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err) {
        const message = err?.message || 'Impossibile avviare il viewer IFC in-app.';
        const isTimeout = message.toLowerCase().includes('timeout');

        trackTelemetry('ifc_open_failed', {
          file_type: fileType || 'ifc',
          file_size: fileSize || null,
          error: message,
          retry_count: retryCount,
          failed_after_ms: Math.round(performance.now() - startedAt),
        });

        if (isTimeout) {
          trackTelemetry('ifc_fallback_used', {
            reason: 'timeout',
            retry_count: retryCount,
          });
        }

        if (!cancelled) {
          if (isTimeout && ifcViewerUrl) {
            setTimeoutFallbackActive(true);
            setStatus('fallback');
            setError('Il rendering IFC in-app ha superato il timeout: fallback automatico attivato.');
          } else {
            setStatus('error');
            setError(message);
          }
        }
      } finally {
        if (loadTimeoutId) {
          clearTimeout(loadTimeoutId);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (removeCameraUpdateListener) {
        removeCameraUpdateListener();
      }
      if (components) {
        components.dispose();
      }
    };
  }, [documentId, fileSize, fileType, fallbackUrl, fileUrl, filePath, ifcSourceUrl, ifcViewerUrl, retryCount]);

  return (
    <div className="h-full min-h-[320px] w-full rounded-md border bg-white overflow-hidden relative">
      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center text-sm text-slate-600 bg-white/80 z-10">
          <div className="text-center space-y-1">
            <p>Caricamento IFC in-app...</p>
            <p className="text-xs text-slate-500">{loadingStep}</p>
          </div>
        </div>
      )}

      <div ref={mountRef} className="h-full w-full" />

      {status === 'fallback' && timeoutFallbackActive && ifcViewerUrl && (
        <div className="absolute inset-0 z-20 bg-white">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-amber-50 text-amber-800 text-xs">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setRetryCount((value) => value + 1)}
              className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2 py-1 hover:bg-amber-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Riprova in-app
            </button>
          </div>
          <iframe
            src={ifcViewerUrl}
            className="w-full h-[calc(100%-37px)] border-0"
            title="IFC fallback viewer"
          />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center bg-white z-20">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 w-10 h-10">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">Viewer IFC in-app non disponibile</p>
              <p className="text-sm text-slate-600">
                {error || 'Il rendering IFC nativo non e\' riuscito. Usa il fallback esterno.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setRetryCount((value) => value + 1)}
                className="inline-flex items-center rounded-md border border-slate-300 hover:bg-slate-100 px-4 py-2 text-sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Riprova in-app
              </button>
              <a
                href={ifcViewerUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-[#ef6144] hover:bg-[#d9553a] text-white px-4 py-2 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Apri IFC nel viewer
              </a>
              <a
                href={ifcSourceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-slate-300 hover:bg-slate-100 px-4 py-2 text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Apri file IFC
              </a>
            </div>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="absolute right-3 top-3 z-10">
          <a
            href={ifcSourceUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-white/90 border border-slate-200 hover:bg-white px-3 py-1.5 text-xs text-slate-700"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Apri file IFC
          </a>
        </div>
      )}
    </div>
  );
}
