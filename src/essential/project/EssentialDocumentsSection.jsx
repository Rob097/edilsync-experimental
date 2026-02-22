import React, { useState } from 'react';
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
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['essentialDocuments', projectId],
    queryFn: () => appClient.entities.ProjectDocument.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

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
            <Input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !selectedFile}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Carica
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {documents.map((document) => (
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

      {documents.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">Nessun documento presente.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
