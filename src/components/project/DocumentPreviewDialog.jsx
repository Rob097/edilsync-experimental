import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, X, ChevronLeft, ChevronRight, MessageSquare, FileText } from "lucide-react";
import DocumentComments from './DocumentComments';

export default function DocumentPreviewDialog({ document, open, onOpenChange, allDocuments = [], onNavigate, scopeType = 'project' }) {
  const [activeTab, setActiveTab] = useState('preview');
  
  if (!document) return null;

  const currentIndex = allDocuments.findIndex(doc => doc.id === document.id);
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

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(document.file_type?.toLowerCase());
  const isPdf = document.file_type?.toLowerCase() === 'pdf';

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
              <a href={document.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </a>
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Anteprima
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Commenti
            </TabsTrigger>
          </TabsList>

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
                src={document.file_url} 
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.file_url)}&embedded=true`}
              className="w-full h-full border-0"
              title={document.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-gray-500 mb-4">
                Anteprima non disponibile per questo tipo di file.
              </p>
              <Button asChild>
                <a href={document.file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Scarica per visualizzare
                </a>
              </Button>
            </div>
          )}
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-auto p-6 mt-0">
            <DocumentComments
              documentId={document.id}
              projectId={document.project_id}
              companyId={document.company_id}
              scopeType={scopeType}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}