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
import { toast } from '@/components/ui/use-toast';

const LEGACY_TECHNICAL_CATEGORIES = new Set(['project', 'permit', 'drawing', 'technical']);

const normalizeCategory = (value) => (LEGACY_TECHNICAL_CATEGORIES.has(value) ? 'technical' : (value || 'other'));

const inferModelFormat = (fileType) => {
  if (fileType === 'ifc') return 'ifc';
  if (fileType === 'glb') return 'glb';
  if (fileType === 'gltf') return 'gltf';
  return null;
};

const BIM_FILE_TYPES = new Set(['ifc', 'glb', 'gltf']);

const isBimFileType = (fileType) => BIM_FILE_TYPES.has((fileType || '').toLowerCase());

export default function UploadDocumentDialog({ open, onOpenChange, projectId, companyId, document, featureAccess }) {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const queryClient = useQueryClient();
  const isCompanyScope = !projectId && !!companyId;
  const documentsQueryKey = isCompanyScope ? ['companyDocuments', companyId] : ['projectDocuments', projectId];
  const fileInputRef = useRef(null);
  const isEditMode = !!document;
  const featureMode = featureAccess?.config?.mode || null;
  const bimUploadsBlocked = featureAccess?.access_level === 'limited' && ['basic', 'basic_chronological'].includes(featureMode);
  
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [discipline, setDiscipline] = useState('');
  const [workArea, setWorkArea] = useState('');
  const [projectPhase, setProjectPhase] = useState('');
  const [documentStatus, setDocumentStatus] = useState('draft');
  const [documentTags, setDocumentTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const isTechnicalCategory = category === 'technical';

  const disciplineOptions = [
    { value: 'architecture', label: tr('Architettura', 'Architecture') },
    { value: 'structure', label: tr('Struttura', 'Structure') },
    { value: 'mep', label: tr('Impianti (MEP)', 'MEP') },
    { value: 'interior', label: tr('Interni', 'Interior') },
    { value: 'landscape', label: tr('Paesaggio', 'Landscape') },
    { value: 'geotechnical', label: tr('Geotecnica', 'Geotechnical') },
    { value: 'other', label: tr('Altro', 'Other') },
  ];

  const workAreaOptions = [
    { value: 'room', label: tr('Stanza', 'Room') },
    { value: 'detail', label: tr('Particolare', 'Detail') },
    { value: 'interior', label: tr('Interno', 'Interior') },
    { value: 'exterior', label: tr('Esterno', 'Exterior') },
    { value: 'garden', label: tr('Giardino', 'Garden') },
    { value: 'foundation', label: tr('Fondamenta', 'Foundation') },
    { value: 'section', label: tr('Sezione', 'Section') },
    { value: 'static_calculation', label: tr('Calcoli statici', 'Static calculations') },
    { value: 'other', label: tr('Altro', 'Other') },
  ];

  const phaseOptions = [
    { value: 'concept', label: tr('Concept', 'Concept') },
    { value: 'definitive', label: tr('Definitivo', 'Definitive') },
    { value: 'executive', label: tr('Esecutivo', 'Executive') },
    { value: 'as_built', label: tr('As built', 'As built') },
    { value: 'calculation', label: tr('Calcolo', 'Calculation') },
    { value: 'other', label: tr('Altro', 'Other') },
  ];

  const statusOptions = [
    { value: 'draft', label: tr('Bozza', 'Draft') },
    { value: 'in_review', label: tr('In revisione', 'In review') },
    { value: 'approved', label: tr('Approvato', 'Approved') },
    { value: 'rejected', label: tr('Respinto', 'Rejected') },
    { value: 'archived', label: tr('Archiviato', 'Archived') },
  ];

  // Initialize form with document data when editing
  React.useEffect(() => {
    if (document) {
      setName(document.name || '');
      setDescription(document.description || '');
      setCategory(normalizeCategory(document.category));
      setDiscipline(document.discipline || '');
      setWorkArea(document.work_area || '');
      setProjectPhase(document.project_phase || '');
      setDocumentStatus(document.document_status || 'draft');
      setDocumentTags(Array.isArray(document.document_tags) ? document.document_tags.join(', ') : '');
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
        // New file in edit mode creates a new revision and marks the old one as superseded.
        if (file) {
          const uploadResult = await appClient.integrations.Core.UploadFile({ file });

          await appClient.entities.ProjectDocument.update(document.id, {
            is_current_revision: false,
            document_status: 'superseded',
          });

          const fileType = file.name.split('.').pop()?.toLowerCase() || '';
          const tagArray = documentTags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

          return appClient.entities.ProjectDocument.create({
            project_id: isCompanyScope ? null : projectId,
            company_id: isCompanyScope ? companyId : null,
            parent_document_id: document.id,
            root_document_id: document.root_document_id || document.id,
            revision_number: (document.revision_number || 1) + 1,
            is_current_revision: true,
            name,
            description: description || null,
            file_url: uploadResult.file_url,
            file_path: uploadResult.file_path,
            file_type: fileType,
            file_size: file.size,
            uploaded_by_email: user?.email,
            uploaded_by_name: user?.full_name,
            category,
            discipline: isTechnicalCategory ? (discipline || null) : null,
            work_area: isTechnicalCategory ? (workArea || null) : null,
            project_phase: isTechnicalCategory ? (projectPhase || null) : null,
            document_status: isTechnicalCategory ? documentStatus : 'draft',
            document_tags: isTechnicalCategory ? tagArray : [],
            model_format: inferModelFormat(fileType),
          });
        }

        const tagArray = documentTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        return appClient.entities.ProjectDocument.update(document.id, {
          name,
          description: description || null,
          category,
          discipline: isTechnicalCategory ? (discipline || null) : null,
          work_area: isTechnicalCategory ? (workArea || null) : null,
          project_phase: isTechnicalCategory ? (projectPhase || null) : null,
          document_status: isTechnicalCategory ? documentStatus : 'draft',
          document_tags: isTechnicalCategory ? tagArray : [],
        });
      } else {
        // Create mode
        const { file_url, file_path } = await appClient.integrations.Core.UploadFile({ file });
        const fileType = file.name.split('.').pop()?.toLowerCase() || '';
        const tagArray = documentTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
        
        return appClient.entities.ProjectDocument.create({
          project_id: isCompanyScope ? null : projectId,
          company_id: isCompanyScope ? companyId : null,
          name: name || file.name,
          description: description || null,
          file_url,
          file_path,
          file_type: fileType,
          file_size: file.size,
          uploaded_by_email: user?.email,
          uploaded_by_name: user?.full_name,
          category,
          discipline: isTechnicalCategory ? (discipline || null) : null,
          work_area: isTechnicalCategory ? (workArea || null) : null,
          project_phase: isTechnicalCategory ? (projectPhase || null) : null,
          document_status: isTechnicalCategory ? documentStatus : 'draft',
          document_tags: isTechnicalCategory ? tagArray : [],
          model_format: inferModelFormat(fileType),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['projectDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['companyDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['documentRevisions'] });
      queryClient.invalidateQueries({ queryKey: ['documentAccessUrl'] });
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
    setDiscipline('');
    setWorkArea('');
    setProjectPhase('');
    setDocumentStatus('draft');
    setDocumentTags('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.currentTarget.files?.[0];
    setDragActive(false);
    if (selectedFile) {
      const selectedFileType = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      if (bimUploadsBlocked && isBimFileType(selectedFileType)) {
        toast({
          title: tr('BIM disponibile solo con funzioni premium', 'BIM available only with premium features'),
          description: isCompanyScope
            ? tr('I file IFC, GLB e GLTF si possono caricare solo con una società Pro.', 'IFC, GLB, and GLTF files can be uploaded only with a Pro company.')
            : tr('I file IFC, GLB e GLTF si possono caricare solo nei progetti sponsorizzati.', 'IFC, GLB, and GLTF files can be uploaded only on sponsored projects.'),
        });
        e.currentTarget.value = '';
        return;
      }
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;
    const droppedFileType = droppedFile.name.split('.').pop()?.toLowerCase() || '';
    if (bimUploadsBlocked && isBimFileType(droppedFileType)) {
      toast({
        title: tr('BIM disponibile solo con funzioni premium', 'BIM available only with premium features'),
        description: isCompanyScope
          ? tr('I file IFC, GLB e GLTF si possono caricare solo con una società Pro.', 'IFC, GLB, and GLTF files can be uploaded only with a Pro company.')
          : tr('I file IFC, GLB e GLTF si possono caricare solo nei progetti sponsorizzati.', 'IFC, GLB, and GLTF files can be uploaded only on sponsored projects.'),
      });
      return;
    }
    setFile(droppedFile);
    if (!name) {
      setName(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedFileType = file?.name.split('.').pop()?.toLowerCase() || '';
    if (bimUploadsBlocked && file && isBimFileType(selectedFileType)) {
      toast({
        title: tr('BIM disponibile solo con funzioni premium', 'BIM available only with premium features'),
        description: isCompanyScope
          ? tr('I file IFC, GLB e GLTF si possono caricare solo con una società Pro.', 'IFC, GLB, and GLTF files can be uploaded only with a Pro company.')
          : tr('I file IFC, GLB e GLTF si possono caricare solo nei progetti sponsorizzati.', 'IFC, GLB, and GLTF files can be uploaded only on sponsored projects.'),
      });
      return;
    }
    uploadMutation.mutate();
  };

  const handleCategoryChange = (value) => {
    const nextCategory = normalizeCategory(value);
    setCategory(nextCategory);
    if (nextCategory !== 'technical') {
      setDiscipline('');
      setWorkArea('');
      setProjectPhase('');
      setDocumentStatus('draft');
      setDocumentTags('');
    }
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
              accept="image/*,.heic,.heif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.dwg,.dxf,.ifc,.glb,.gltf,.zip,.rar"
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
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-[#ef6144] bg-[#ef6144]/5' : 'hover:border-[#ef6144] hover:bg-[#ef6144]/5'}`}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {dragActive
                    ? tr('Rilascia qui il file', 'Drop file here')
                    : isEditMode
                      ? t('uploadDocumentDialog.clickToReplace')
                      : t('uploadDocumentDialog.clickToSelect')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('uploadDocumentDialog.supportedFormats')}
                </p>
                {bimUploadsBlocked ? (
                  <p className="text-xs text-amber-700 mt-2">
                    {isCompanyScope
                      ? tr('IFC, GLB e GLTF sono disponibili solo con la società Pro.', 'IFC, GLB, and GLTF are available only with the Pro company plan.')
                      : tr('IFC, GLB e GLTF sono disponibili solo nei progetti sponsorizzati.', 'IFC, GLB, and GLTF are available only on sponsored projects.')}
                  </p>
                ) : null}
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
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">{t('uploadDocumentDialog.categoryTechnical')}</SelectItem>
                <SelectItem value="contract">{t('uploadDocumentDialog.categoryContract')}</SelectItem>
                <SelectItem value="photo">{t('uploadDocumentDialog.categoryPhoto')}</SelectItem>
                <SelectItem value="report">{t('uploadDocumentDialog.categoryReport')}</SelectItem>
                <SelectItem value="other">{t('uploadDocumentDialog.categoryOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isTechnicalCategory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{tr('Disciplina', 'Discipline')}</Label>
                <Select value={discipline || 'none'} onValueChange={(value) => setDiscipline(value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tr('Seleziona disciplina', 'Select discipline')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tr('Nessuna', 'None')}</SelectItem>
                    {disciplineOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{tr('Ambito tecnico del documento', 'Technical scope of document')}</Label>
                <Select value={workArea || 'none'} onValueChange={(value) => setWorkArea(value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tr('Seleziona ambito tecnico', 'Select technical scope')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tr('Nessuna', 'None')}</SelectItem>
                    {workAreaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{tr('Fase progetto', 'Project phase')}</Label>
                <Select value={projectPhase || 'none'} onValueChange={(value) => setProjectPhase(value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tr('Seleziona fase', 'Select phase')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tr('Nessuna', 'None')}</SelectItem>
                    {phaseOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{tr('Stato documento', 'Document status')}</Label>
                <Select value={documentStatus} onValueChange={setDocumentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {isTechnicalCategory && (
            <div className="space-y-2">
              <Label htmlFor="tags">{tr('Tag (separati da virgola)', 'Tags (comma separated)')}</Label>
              <Input
                id="tags"
                value={documentTags}
                onChange={(e) => setDocumentTags(e.target.value)}
                placeholder={tr('es. piano terra, struttura, variante', 'e.g. ground floor, structure, variation')}
              />
            </div>
          )}

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