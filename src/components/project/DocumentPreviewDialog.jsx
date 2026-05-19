import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ChevronLeft, ChevronRight, MessageSquare, FileText, History, Cuboid, Maximize2, Minimize2 } from "lucide-react";
import DocumentComments from './DocumentComments';
import BimViewer from './BimViewer';
import InAppIfcViewer from './InAppIfcViewer';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function DocumentPreviewDialog({ document, open, onOpenChange, allDocuments = [], onNavigate, scopeType = 'project', featureAccess }) {
  const { t, currentLanguage } = useLanguage();
  const tx = (key, options) => t(`completeScoped.components_project_DocumentPreviewDialog.${key}`, options);
  const [activeTab, setActiveTab] = useState('preview');
  const [isBimFullscreen, setIsBimFullscreen] = useState(false);
  const bimContainerRef = useRef(null);
  const safeDocument = document || {};
  const browserDocument = typeof window !== 'undefined' ? window.document : null;

  const currentIndex = allDocuments.findIndex(doc => doc.id === safeDocument.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allDocuments.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(allDocuments[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(allDocuments[currentIndex + 1]);
    }
  };

  const fileType = safeDocument.file_type?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
  const isPdf = fileType === 'pdf';
  const isBim = ['ifc', 'glb', 'gltf'].includes(fileType) || ['ifc', 'glb', 'gltf'].includes(safeDocument.model_format);
  const isIfc = (fileType || safeDocument.model_format) === 'ifc';
  const featureMode = featureAccess?.config?.mode || null;
  const bimPreviewBlocked = isBim && featureAccess?.access_level === 'limited' && ['basic', 'basic_chronological'].includes(featureMode);

  const { data: accessUrl } = useQuery({
    queryKey: ['documentAccessUrl', safeDocument.id, safeDocument.file_path, safeDocument.updated_date],
    queryFn: () => appClient.integrations.Core.ResolveFileAccessUrl({
      filePath: safeDocument.file_path,
      fallbackUrl: safeDocument.file_url,
    }),
    enabled: !!document,
    staleTime: 1000 * 60 * 30,
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ['documentRevisions', safeDocument.root_document_id || safeDocument.id],
    queryFn: async () => {
      const rootId = safeDocument.root_document_id || safeDocument.id;
      let rows = await appClient.entities.ProjectDocument.filter({ root_document_id: rootId });
      if (!rows.length) {
        rows = [safeDocument];
      }
      return [...rows].sort((a, b) => (b.revision_number || 1) - (a.revision_number || 1));
    },
    enabled: !!document,
  });

  useEffect(() => {
    if (!open) return;
    setActiveTab(isBim ? 'bim' : 'preview');
  }, [open, isBim, safeDocument.id]);

  useEffect(() => {
    if (!browserDocument) return undefined;

    const handleFullscreenChange = () => {
      const container = bimContainerRef.current;
      const fullscreenElement = browserDocument.fullscreenElement;
      setIsBimFullscreen(Boolean(container && fullscreenElement === container));
    };

    window.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => window.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [browserDocument]);

  const toggleBimFullscreen = async () => {
    if (!bimContainerRef.current || !browserDocument) return;
    if (browserDocument.fullscreenElement === bimContainerRef.current) {
      await browserDocument.exitFullscreen();
      return;
    }
    await bimContainerRef.current.requestFullscreen();
  };

  const downloadUrl = accessUrl || safeDocument.access_url || safeDocument.file_url;

  const getDocumentStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return tx('k1');
      case 'in_review':
        return tx('k2');
      case 'approved':
        return tx('k3');
      case 'rejected':
        return tx('k4');
      case 'superseded':
        return tx('k5');
      case 'archived':
        return tx('k6');
      default:
        return status || tx('k7');
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle className="text-lg font-semibold truncate flex-1">{document.name}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-shrink-0"
            >
              <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </a>
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-2">
            {!isBim && (
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Anteprima
              </TabsTrigger>
            )}
            {isBim && (
              <TabsTrigger value="bim" className="flex items-center gap-2">
                <Cuboid className="h-4 w-4" />
                BIM 3D
              </TabsTrigger>
            )}
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Commenti
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Revisioni
            </TabsTrigger>
          </TabsList>

          {!isBim && (
          <TabsContent value="preview" className="flex-1 overflow-hidden bg-gray-50 relative mt-0">
          {/* Navigation Arrows */}
          {hasPrevious && (
            <Button
              variant="secondary"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {hasNext && (
            <Button
              variant="secondary"
              size="icon"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              <img 
                src={downloadUrl} 
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={downloadUrl}
              className="w-full h-full border-0"
              title={document.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-gray-500 mb-4">
                Anteprima non disponibile per questo tipo di file.
              </p>
              <Button asChild>
                <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Scarica per visualizzare
                </a>
              </Button>
            </div>
          )}
          </TabsContent>
          )}

          {isBim && (
            <TabsContent value="bim" className="flex-1 overflow-hidden p-4 mt-0 bg-slate-100">
              <div ref={bimContainerRef} className="relative h-full w-full bg-slate-100">
                {bimPreviewBlocked ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
                      <Cuboid className="mx-auto h-10 w-10 text-amber-600" />
                      <p className="mt-4 text-base font-semibold text-slate-900">
                        {scopeType === 'company' ? 'Preview BIM disponibile solo con società Pro' : 'Preview BIM disponibile solo nei cantieri sponsorizzati'}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {scopeType === 'company'
                          ? 'I file IFC, GLB e GLTF già presenti restano archiviati, ma la visualizzazione 3D è disponibile solo con le funzioni premium della società.'
                          : 'I file IFC, GLB e GLTF già presenti restano archiviati, ma la visualizzazione 3D è disponibile solo quando il cantiere ha una sponsorship attiva.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={toggleBimFullscreen}
                      className="absolute right-2 top-2 z-30 bg-white/90"
                      title={isBimFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
                    >
                      {isBimFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>

                    {isIfc ? (
                      <InAppIfcViewer
                        fileUrl={downloadUrl}
                        fallbackUrl={safeDocument.file_url}
                        filePath={safeDocument.file_path}
                        documentId={safeDocument.id}
                        fileType={fileType || safeDocument.model_format || 'ifc'}
                        fileSize={safeDocument.file_size}
                      />
                    ) : (
                      <BimViewer
                        fileUrl={downloadUrl}
                        fallbackUrl={safeDocument.file_url}
                        filePath={safeDocument.file_path}
                        fileType={fileType || document.model_format}
                      />
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent value="comments" className="flex-1 overflow-auto p-6 mt-0">
            <DocumentComments
              documentId={document.id}
              projectId={document.project_id}
              companyId={document.company_id}
              scopeType={scopeType}
            />
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-auto p-6 mt-0 space-y-3">
            {revisions.length === 0 ? (
              <p className="text-sm text-gray-500">Nessuna revisione disponibile.</p>
            ) : (
              revisions.map((revision) => (
                <button
                  key={revision.id}
                  type="button"
                  className={`w-full text-left rounded-md border px-4 py-3 transition-colors ${
                    revision.id === document.id ? 'border-[#ef6144] bg-[#ef6144]/5' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => onNavigate?.(revision)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">Rev {revision.revision_number || 1} - {revision.name}</p>
                    <span className="text-xs uppercase bg-slate-100 px-2 py-1 rounded">
                      {getDocumentStatusLabel(revision.document_status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {revision.created_date ? new Date(revision.created_date).toLocaleString() : ''}
                  </p>
                </button>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}