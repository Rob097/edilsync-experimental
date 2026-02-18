import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Image, 
  File, 
  Upload, 
  Search,
  Download,
  Trash2,
  MoreVertical,
  Pencil,
  Folder,
  ArrowLeft,
  Grid3x3,
  List
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import UploadDocumentDialog from './UploadDocumentDialog';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import { Eye } from "lucide-react";
import { useLanguage } from '@/components/i18n/useLanguage';

const categoryLabels = {
  project: 'Progetto',
  contract: 'Contratto',
  permit: 'Permesso',
  drawing: 'Disegno',
  photo: 'Foto',
  report: 'Report',
  other: 'Altro',
};

const getFileIcon = (fileType) => {
  const type = fileType?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) {
    return <Image className="h-5 w-5 text-green-500" />;
  }
  if (['pdf'].includes(type)) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5 text-blue-500" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function DocumentList({ projectId, canUpload, currentUserEmail, uploadDialogOpen: externalUploadDialog, onUploadDialogChange }) {
  const { currentLanguage, t } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
  const [openFolder, setOpenFolder] = useState(null); // category name when folder is open

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['projectDocuments', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.ProjectDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectDocuments', projectId]);
    },
  });

  let filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesType = filterType === 'all' || doc.file_type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Sort documents
  if (sortBy === 'date_desc') {
    filteredDocuments = [...filteredDocuments].sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  } else if (sortBy === 'date_asc') {
    filteredDocuments = [...filteredDocuments].sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    );
  } else if (sortBy === 'name_asc') {
    filteredDocuments = [...filteredDocuments].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  const uniqueFileTypes = [...new Set(documents.map(d => d.file_type))].filter(Boolean);

  // Group documents by category for folder view (use filtered documents)
  const categoriesWithCounts = Object.keys(categoryLabels).map(category => ({
    value: category,
    label: categoryLabels[category],
    count: filteredDocuments.filter(doc => doc.category === category).length
  })).filter(cat => cat.count > 0);

  // Get documents for open folder
  // If search or filters are active, show all filtered documents
  // Otherwise, show only documents from the selected category
  const hasActiveFilters = searchQuery || filterCategory !== 'all' || filterType !== 'all';
  const folderDocuments = openFolder 
    ? (hasActiveFilters ? filteredDocuments : filteredDocuments.filter(doc => doc.category === openFolder))
    : [];

  const isImageFile = (fileType) => {
    const type = fileType?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type);
  };

  const isPdfFile = (fileType) => {
    return fileType?.toLowerCase() === 'pdf';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Back button when folder is open */}
          {openFolder && viewMode === 'grid' && (
            <Button
              variant="outline"
              onClick={() => setOpenFolder(null)}
              className="sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tr('Indietro', 'Back')}
            </Button>
          )}
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => {
                setViewMode('grid');
                setOpenFolder(null);
              }}
              title={tr('Vista a griglia', 'Grid view')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => {
                setViewMode('list');
                setOpenFolder(null);
              }}
              title={tr('Vista a lista', 'List view')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {canUpload && (
            <Button 
              onClick={() => {
                setUploadDialogOpen(true);
                onUploadDialogChange?.(true);
              }}
              className="bg-[#ef6144] hover:bg-[#d9553a]"
            >
              <Upload className="h-4 w-4 mr-2" />
              {tr('Carica', 'Upload')}
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('documents.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr('Tutte', 'All')}</SelectItem>
              <SelectItem value="project">{tr('Progetto', 'Project')}</SelectItem>
              <SelectItem value="contract">{tr('Contratto', 'Contract')}</SelectItem>
              <SelectItem value="permit">{tr('Permesso', 'Permit')}</SelectItem>
              <SelectItem value="drawing">{tr('Disegno', 'Drawing')}</SelectItem>
              <SelectItem value="photo">{tr('Foto', 'Photo')}</SelectItem>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="other">{tr('Altro', 'Other')}</SelectItem>
            </SelectContent>
          </Select>
          
          {uniqueFileTypes.length > 0 && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder={tr('Tipo', 'Type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr('Tutti', 'All')}</SelectItem>
                {uniqueFileTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={tr('Ordina', 'Sort')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">{tr('Più recenti', 'Newest')}</SelectItem>
              <SelectItem value="date_asc">{tr('Meno recenti', 'Oldest')}</SelectItem>
              <SelectItem value="name_asc">{tr('Nome A-Z', 'Name A-Z')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'grid' && !openFolder ? (
        /* Folder Grid View */
        categoriesWithCounts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categoriesWithCounts.map(category => (
              <div
                key={category.value}
                onClick={() => setOpenFolder(category.value)}
                className="p-6 rounded-lg border bg-white hover:bg-gray-50 hover:border-[#ef6144] transition-all cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 group-hover:bg-[#ef6144]/10 flex items-center justify-center transition-colors">
                    <Folder className="h-8 w-8 text-gray-400 group-hover:text-[#ef6144] transition-colors" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.label}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.count} {tr('file', 'files')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Folder}
            title={tr('Nessun documento', 'No documents')}
            description={tr('Carica il primo documento del progetto.', 'Upload the first project document.')}
            actionLabel={canUpload ? tr('Carica documento', 'Upload document') : undefined}
            onAction={canUpload ? () => {
              setUploadDialogOpen(true);
              onUploadDialogChange?.(true);
            } : undefined}
          />
        )
      ) : viewMode === 'grid' && openFolder ? (
        /* File Grid View (inside folder) */
        folderDocuments.length > 0 ? (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {categoryLabels[openFolder]}
              </h3>
              <p className="text-sm text-gray-500">
                {folderDocuments.length} {folderDocuments.length === 1 ? tr('documento', 'document') : tr('documenti', 'documents')}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {folderDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="rounded-lg border bg-white hover:shadow-md transition-shadow overflow-hidden group"
                >
                  {/* Preview */}
                  <div 
                    className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden cursor-pointer"
                    onClick={() => setPreviewDocument(doc)}
                  >
                    {isImageFile(doc.file_type) ? (
                      <img 
                        src={doc.file_url} 
                        alt={doc.name}
                        className="w-full h-full object-cover"
                      />
                    ) : isPdfFile(doc.file_type) ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-12 w-12 text-red-500" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="h-12 w-12 text-blue-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="p-3">
                    <p className="font-medium text-sm text-gray-900 truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                          title={tr('Scarica', 'Download')}
                        >
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-3.5 w-3.5 text-gray-500" />
                          </a>
                        </Button>
                        {(canUpload || doc.uploaded_by_email === currentUserEmail) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingDocument(doc)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {tr('Modifica', 'Edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(doc.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {tr('Elimina', 'Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title={tr('Nessun documento in questa cartella', 'No documents in this folder')}
            description={tr('Carica documenti in questa categoria.', 'Upload documents in this category.')}
            actionLabel={canUpload ? tr('Carica documento', 'Upload document') : undefined}
            onAction={canUpload ? () => {
              setUploadDialogOpen(true);
              onUploadDialogChange?.(true);
            } : undefined}
          />
        )
      ) : (
        /* List View */
        filteredDocuments.length > 0 ? (
          <div className="space-y-2">
            {filteredDocuments.map(doc => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {doc.category && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {categoryLabels[doc.category] || doc.category}
                        </span>
                      )}
                      {doc.file_size && (
                        <span>{formatFileSize(doc.file_size)}</span>
                      )}
                      <span>•</span>
                      <span>{format(new Date(doc.created_date), 'd MMM yyyy', { locale: dateLocale })}</span>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{doc.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewDocument(doc)}
                    title={tr('Anteprima', 'Preview')}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    title={tr('Scarica', 'Download')}
                  >
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 text-gray-500" />
                    </a>
                  </Button>
                  
                  {(canUpload || doc.uploaded_by_email === currentUserEmail) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingDocument(doc)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {tr('Modifica', 'Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(doc.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {tr('Elimina', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title={searchQuery ? t('common.noResults') : tr('Nessun documento', 'No documents')}
            description={
              searchQuery
                ? t('common.tryModifyingSearchTerms')
                : tr('Carica il primo documento del progetto.', 'Upload the first project document.')
            }
            actionLabel={!searchQuery && canUpload ? tr('Carica documento', 'Upload document') : undefined}
            onAction={!searchQuery && canUpload ? () => {
              setUploadDialogOpen(true);
              onUploadDialogChange?.(true);
            } : undefined}
          />
        )
      )}

      <UploadDocumentDialog
        open={externalUploadDialog ?? uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          onUploadDialogChange?.(open);
        }}
        projectId={projectId}
      />

      <UploadDocumentDialog
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        projectId={projectId}
        document={editingDocument}
      />

      <DocumentPreviewDialog
        document={previewDocument}
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        allDocuments={filteredDocuments}
        onNavigate={setPreviewDocument}
      />
    </div>
  );
}