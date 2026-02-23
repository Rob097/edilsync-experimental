import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const categoryLabel = {
  project: 'Progetto',
  contract: 'Contratto',
  permit: 'Permesso',
  drawing: 'Disegno',
  photo: 'Foto',
  report: 'Report',
  other: 'Altro',
};

export default function EssentialDocumentsSection({ projectId, currentUser, canUpload }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('photo');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.currentTarget.files?.[0] || null;
    setSelectedFile(file);
    if (file && !name.trim()) {
      setName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const { data: documents = [] } = useQuery({
    queryKey: ['essentialDocuments', projectId],
    queryFn: () => appClient.entities.ProjectDocument.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const filteredDocuments = useMemo(() => {
    if (categoryFilter === 'all') return documents;
    return documents.filter((document) => (document.category || 'other') === categoryFilter);
  }, [documents, categoryFilter]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return;
      const uploaded = await appClient.integrations.Core.UploadFile({ file: selectedFile });
      await appClient.entities.ProjectDocument.create({
        project_id: projectId,
        name: name.trim() || selectedFile.name,
        file_url: uploaded.file_url,
        file_type: selectedFile.name.split('.').pop()?.toLowerCase() || 'file',
        file_size: selectedFile.size,
        category,
        uploaded_by_email: currentUser?.email,
        uploaded_by_name: currentUser?.display_name || currentUser?.full_name || currentUser?.email,
      });
    },
    onSuccess: async () => {
      setName('');
      setCategory('photo');
      setSelectedFile(null);
      await queryClient.invalidateQueries({ queryKey: ['essentialDocuments', projectId] });
    },
  });

  return (
    <div className="space-y-5">
      {canUpload ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Aggiungi foto o documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome (opzionale)" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="project">Progetto</SelectItem>
                <SelectItem value="contract">Contratto</SelectItem>
                <SelectItem value="permit">Permesso</SelectItem>
                <SelectItem value="drawing">Disegno</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="other">Altro</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="file"
              accept="image/*,.heic,.heif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
              onChange={handleFileChange}
              className="block h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
            {selectedFile ? (
              <p className="text-sm text-gray-600 truncate">File selezionato: {selectedFile.name}</p>
            ) : null}
            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !selectedFile}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Carica
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">Filtra documenti</p>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="project">Progetto</SelectItem>
                <SelectItem value="contract">Contratto</SelectItem>
                <SelectItem value="permit">Permesso</SelectItem>
                <SelectItem value="drawing">Disegno</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="other">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredDocuments.map((document) => (
        <Card key={document.id} className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{document.name}</p>
                <p className="text-sm text-gray-600">{categoryLabel[document.category] || document.category || 'Documento'}</p>
              </div>
              <Button variant="outline" className="border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10" size="sm" onClick={() => window.open(document.file_url, '_blank', 'noopener,noreferrer')}>
                Apri
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredDocuments.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            {documents.length === 0 ? 'Nessun documento presente.' : 'Nessun documento per il filtro selezionato.'}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
