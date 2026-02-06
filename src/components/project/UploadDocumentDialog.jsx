import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, File, X } from "lucide-react";

const categories = [
  { value: 'project', label: 'Progetto' },
  { value: 'contract', label: 'Contratto' },
  { value: 'permit', label: 'Permesso' },
  { value: 'drawing', label: 'Disegno tecnico' },
  { value: 'photo', label: 'Foto' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Altro' },
];

export default function UploadDocumentDialog({ open, onOpenChange, projectId, document }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const isEditMode = !!document;
  
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form with document data when editing
  React.useEffect(() => {
    if (document) {
      setName(document.name || '');
      setDescription(document.description || '');
      setCategory(document.category || 'other');
    } else {
      resetForm();
    }
  }, [document]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      
      if (isEditMode) {
        // Edit mode
        let file_url = document.file_url;
        let file_type = document.file_type;
        let file_size = document.file_size;

        // If new file is selected, upload it
        if (file) {
          const uploadResult = await base44.integrations.Core.UploadFile({ file });
          file_url = uploadResult.file_url;
          file_type = file.name.split('.').pop()?.toLowerCase() || '';
          file_size = file.size;
        }

        return base44.entities.ProjectDocument.update(document.id, {
          name,
          description: description || null,
          file_url,
          file_type,
          file_size,
          category,
        });
      } else {
        // Create mode
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const fileType = file.name.split('.').pop()?.toLowerCase() || '';
        
        return base44.entities.ProjectDocument.create({
          project_id: projectId,
          name: name || file.name,
          description: description || null,
          file_url,
          file_type: fileType,
          file_size: file.size,
          uploaded_by_email: user?.email,
          uploaded_by_name: user?.full_name,
          category,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projectDocuments', projectId]);
      onOpenChange(false);
      resetForm();
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const resetForm = () => {
    setFile(null);
    setName('');
    setDescription('');
    setCategory('other');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  const isValid = isEditMode ? name : (file && name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifica Documento' : 'Carica Documento'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Modifica le informazioni del documento o sostituisci il file.' 
              : 'Carica un file da associare al progetto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.dwg,.dxf,.zip,.rar"
            />
            
            {file ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <File className="h-5 w-5 text-[#ef6144] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[#ef6144] hover:bg-[#ef6144]/5 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Clicca per selezionare un file
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOC, XLS, JPG, PNG, DWG
                </p>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome documento *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Planimetria piano terra"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione opzionale..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!isValid || isUploading}
            >
              {isUploading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Carica
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}