import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function EssentialDocumentsSection({ projectId, currentUser, canUpload }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('photo');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.currentTarget.files?.[0] || null;
    setSelectedFile(file);
    if (file && !name.trim()) {
      setName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0] || null;
    if (!file) return;
    setSelectedFile(file);
    if (!name.trim()) {
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

  const categoryLabel = {
    project: tr('Progetto', 'Project'),
    contract: tr('Contratto', 'Contract'),
    permit: tr('Permesso', 'Permit'),
    drawing: tr('Disegno', 'Drawing'),
    photo: tr('Foto', 'Photo'),
    report: tr('Report', 'Report'),
    other: tr('Altro', 'Other'),
  };

  return (
    <div className="space-y-5">
      {canUpload ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">{tr('Aggiungi foto o documento', 'Add photo or document')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`w-full rounded-xl border-2 border-dashed p-5 text-left transition-colors ${dragActive ? 'border-[#ef6144] bg-[#ef6144]/5' : 'border-[#ef6144]/35 bg-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#ef6144]/10 flex items-center justify-center">
                  <UploadCloud className="h-5 w-5 text-[#ef6144]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {dragActive
                      ? tr('Rilascia qui il file', 'Drop file here')
                      : tr('Trascina qui il file o clicca per selezionarlo', 'Drag file here or click to select')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{tr('Supportati: immagini, PDF, documenti Office, CSV, ZIP', 'Supported: images, PDF, Office docs, CSV, ZIP')}</p>
                </div>
              </div>
            </button>
            {selectedFile ? (
              <p className="text-sm text-gray-600 truncate">{tr('File selezionato', 'Selected file')}: {selectedFile.name}</p>
            ) : null}

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">{tr('Foto', 'Photo')}</SelectItem>
                <SelectItem value="project">{tr('Progetto', 'Project')}</SelectItem>
                <SelectItem value="contract">{tr('Contratto', 'Contract')}</SelectItem>
                <SelectItem value="permit">{tr('Permesso', 'Permit')}</SelectItem>
                <SelectItem value="drawing">{tr('Disegno', 'Drawing')}</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="other">{tr('Altro', 'Other')}</SelectItem>
              </SelectContent>
            </Select>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={tr('Nome (opzionale)', 'Name (optional)')} />

            <Button className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !selectedFile}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {tr('Carica', 'Upload')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">{tr('Filtra documenti', 'Filter documents')}</p>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr('Tutti', 'All')}</SelectItem>
                <SelectItem value="photo">{tr('Foto', 'Photo')}</SelectItem>
                <SelectItem value="project">{tr('Progetto', 'Project')}</SelectItem>
                <SelectItem value="contract">{tr('Contratto', 'Contract')}</SelectItem>
                <SelectItem value="permit">{tr('Permesso', 'Permit')}</SelectItem>
                <SelectItem value="drawing">{tr('Disegno', 'Drawing')}</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="other">{tr('Altro', 'Other')}</SelectItem>
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
                <p className="text-sm text-gray-600">{categoryLabel[document.category] || document.category || tr('Documento', 'Document')}</p>
              </div>
              <Button variant="outline" className="border-[#ef6144]/30 text-[#ef6144] hover:bg-[#ef6144]/10" size="sm" onClick={() => window.open(document.file_url, '_blank', 'noopener,noreferrer')}>
                {tr('Apri', 'Open')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredDocuments.length === 0 ? (
        <Card className="border-[#ef6144]/20 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            {documents.length === 0
              ? tr('Nessun documento presente.', 'No documents available.')
              : tr('Nessun documento per il filtro selezionato.', 'No documents for the selected filter.')}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
