import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search,
  Grid3x3,
  List,
  File,
  Image,
  FileText
} from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';
import { useLanguage } from '@/components/i18n/useLanguage';

const categoryLabels = {
  project: 'Cantiere',
  contract: 'Contratto',
  permit: 'Permesso',
  drawing: 'Disegno',
  photo: 'Foto',
  report: 'Report',
  other: 'Altro',
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

export default function SelectDocumentDialog({ projectId, companyId, scopeType = 'project', open, onOpenChange, onSelectDocument }) {
  const { currentLanguage, t } = useLanguage();
  const tr = (it, en) => currentLanguage === 'it' ? it : en;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const isCompanyScope = scopeType === 'company';
  const scopeId = isCompanyScope ? companyId : projectId;
  const documentsQueryKey = isCompanyScope ? ['companyDocuments', companyId] : ['projectDocuments', projectId];

  const { data: documents = [], isLoading } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: () => appClient.entities.ProjectDocument.filter(
      isCompanyScope ? { company_id: companyId } : { project_id: projectId },
    ),
    enabled: !!scopeId && open,
  });

  let filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesType = filterType === 'all' || doc.file_type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const uniqueFileTypes = [...new Set(documents.map(d => d.file_type))].filter(Boolean);

  const handleSelectDocument = (doc) => {
    onSelectDocument(doc);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{tr('Seleziona documento da linkare', 'Select document to link')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t('documents.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr('Tutte', 'All')}</SelectItem>
                  <SelectItem value="project">{tr('Cantiere', 'Worksite')}</SelectItem>
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
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              filteredDocuments.length > 0 ? (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-[#ef6144]/5 hover:border-[#ef6144] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate text-sm">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {doc.category && (
                              <span>{categoryLabels[doc.category]}</span>
                            )}
                            {doc.file_size && (
                              <span>•</span>
                            )}
                            {doc.file_size && (
                              <span>{formatFileSize(doc.file_size)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title={tr('Nessun documento trovato', 'No documents found')}
                  description={t('common.tryModifyingFilters')}
                />
              )
            ) : (
              filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredDocuments.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc)}
                      className="rounded-lg border bg-white hover:shadow-md hover:border-[#ef6144] transition-all overflow-hidden text-left"
                    >
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.file_type?.toLowerCase()) ? (
                          <img 
                            src={doc.file_url} 
                            alt={doc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center">
                            {getFileIcon(doc.file_type)}
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="font-medium text-gray-900 truncate text-xs" title={doc.name}>
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(doc.file_size)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title={tr('Nessun documento trovato', 'No documents found')}
                  description={t('common.tryModifyingFilters')}
                />
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}