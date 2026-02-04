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
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import EmptyState from '@/components/ui/EmptyState';
import UploadDocumentDialog from './UploadDocumentDialog';

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

export default function DocumentList({ projectId, canUpload, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca documenti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {canUpload && (
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="bg-[#ef6144] hover:bg-[#d9553a]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Carica
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="project">Progetto</SelectItem>
              <SelectItem value="contract">Contratto</SelectItem>
              <SelectItem value="permit">Permesso</SelectItem>
              <SelectItem value="drawing">Disegno</SelectItem>
              <SelectItem value="photo">Foto</SelectItem>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="other">Altro</SelectItem>
            </SelectContent>
          </Select>
          
          {uniqueFileTypes.length > 0 && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {uniqueFileTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Ordina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Più recenti</SelectItem>
              <SelectItem value="date_asc">Meno recenti</SelectItem>
              <SelectItem value="name_asc">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document list */}
      {filteredDocuments.length > 0 ? (
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
                    <span>{format(new Date(doc.created_date), 'd MMM yyyy', { locale: it })}</span>
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
                  asChild
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
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(doc.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
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
          title={searchQuery ? "Nessun risultato" : "Nessun documento"}
          description={
            searchQuery
              ? "Prova a modificare i termini di ricerca."
              : "Carica il primo documento del progetto."
          }
          actionLabel={!searchQuery && canUpload ? "Carica documento" : undefined}
          onAction={!searchQuery && canUpload ? () => setUploadDialogOpen(true) : undefined}
        />
      )}

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}