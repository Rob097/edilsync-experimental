import React, { useState, useRef } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
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

const getCategoryLabel = (value, t) => {
  const categoryMap = {
    'project': t('uploadDocumentDialog.categoryProject'),
    'contract': t('uploadDocumentDialog.categoryContract'),
    'permit': t('uploadDocumentDialog.categoryPermit'),
    'drawing': t('uploadDocumentDialog.categoryDrawing'),
    'photo': t('uploadDocumentDialog.categoryPhoto'),
    'report': t('uploadDocumentDialog.categoryReport'),
    'other': t('uploadDocumentDialog.categoryOther'),
  };
  return categoryMap[value] || value;
};

export default function UploadDocumentDialog({ open, onOpenChange, projectId, document }) {
  const { t } = useLanguage();
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
    queryFn: () => appClient.auth.me(),
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
          const uploadResult = await appClient.integrations.Core.UploadFile({ file });
          file_url = uploadResult.file_url;
          file_type = file.name.split('.').pop()?.toLowerCase() || '';
          file_size = file.size;
        }

        return appClient.entities.ProjectDocument.update(document.id, {
          name,
          description: description || null,
          file_url,
          file_type,
          file_size,
          category,
        });
      } else {
        // Create mode
        const { file_url } = await appClient.integrations.Core.UploadFile({ file });
        const fileType = file.name.split('.').pop()?.toLowerCase() || '';
        
        return appClient.entities.ProjectDocument.create({
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
          <DialogTitle>{isEditMode ? t('uploadDocumentDialog.editTitle') : t('uploadDocumentDialog.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? t('uploadDocumentDialog.editDescription')
              : t('uploadDocumentDialog.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4 max-w-full overflow-hidden">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>{t('uploadDocumentDialog.file')} {!isEditMode && '*'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.dwg,.dxf,.zip,.rar"
            />
            
            {file ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <File className="h-5 w-5 text-[#ef6144] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
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
                  className="flex-shrink-0"
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
                  {isEditMode ? t('uploadDocumentDialog.clickToReplace') : t('uploadDocumentDialog.clickToSelect')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('uploadDocumentDialog.supportedFormats')}
                </p>
              </div>
            )}
            {isEditMode && !file && (
              <p className="text-xs text-gray-500">
                {t('uploadDocumentDialog.currentFile')}: {document.name}.{document.file_type}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('uploadDocumentDialog.documentName')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('uploadDocumentDialog.documentNamePlaceholder')}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t('uploadDocumentDialog.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">{t('uploadDocumentDialog.categoryProject')}</SelectItem>
                <SelectItem value="contract">{t('uploadDocumentDialog.categoryContract')}</SelectItem>
                <SelectItem value="permit">{t('uploadDocumentDialog.categoryPermit')}</SelectItem>
                <SelectItem value="drawing">{t('uploadDocumentDialog.categoryDrawing')}</SelectItem>
                <SelectItem value="photo">{t('uploadDocumentDialog.categoryPhoto')}</SelectItem>
                <SelectItem value="report">{t('uploadDocumentDialog.categoryReport')}</SelectItem>
                <SelectItem value="other">{t('uploadDocumentDialog.categoryOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('uploadDocumentDialog.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('uploadDocumentDialog.descriptionPlaceholder')}
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
              {t('uploadDocumentDialog.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!isValid || isUploading}
            >
              {isUploading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditMode ? t('uploadDocumentDialog.save') : t('uploadDocumentDialog.upload')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}