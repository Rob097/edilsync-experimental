import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export default function DocumentPreviewDialog({ document, open, onOpenChange }) {
  if (!document) return null;

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(document.file_type?.toLowerCase());
  const isPdf = document.file_type?.toLowerCase() === 'pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{document.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={document.file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Scarica
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {isImage ? (
            <div className="flex items-center justify-center h-full">
              <img 
                src={document.file_url} 
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={document.file_url}
              className="w-full h-full rounded-lg shadow-lg bg-white"
              title={document.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}