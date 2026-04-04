import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { appClient } from '@/api/appClient';
import { useOperativeData } from '@/operativa/useOperativeData';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageSquare, FileText, Clock, Menu, UploadCloud, Loader2, History, FolderTree } from 'lucide-react';
import ChannelList from '@/components/messaging/ChannelList';
import MessageList from '@/components/messaging/MessageList';
import MessageInput from '@/components/messaging/MessageInput';
import CompanyTimeTrackingSection from '@/components/company/CompanyTimeTrackingSection';
import FeatureGateCard from '@/components/ui/FeatureGateCard';
import { toast } from '@/components/ui/use-toast';
import { isFeatureAccessible, isFeatureFullyEnabled, useCompanyFeatureAccess } from '@/hooks/useFeatureAccess';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

const tabs = ['timbrature', 'docs', 'chat'];
const BIM_FILE_TYPES = new Set(['ifc', 'glb', 'gltf']);

export default function OperativeCompanyWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentLanguage, t } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  const {
    user,
    activeCompanyId,
    currentCompany,
    companyMemberships,
    isLoading,
  } = useOperativeData();

  const [activeTab, setActiveTab] = useState(null);
  const [docsView, setDocsView] = useState('chronological');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('photo');
  const [chatShowChannels, setChatShowChannels] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  const currentMembership = companyMemberships.find((entry) => entry.company_id === activeCompanyId);
  const isCompanyAdmin = currentMembership?.role === 'admin';
  const { featureMap: companyFeatureMap, isLoading: isCompanyFeatureAccessLoading } = useCompanyFeatureAccess(activeCompanyId, [
    'company_time_tracking',
    'company_chat',
    'company_documents',
  ], { enabled: !!activeCompanyId });

  const companyTimeTrackingFeatureAccess = companyFeatureMap.company_time_tracking;
  const companyChatFeatureAccess = companyFeatureMap.company_chat;
  const companyDocumentsFeatureAccess = companyFeatureMap.company_documents;
  const canUseCompanyTimeTracking = isFeatureAccessible(companyTimeTrackingFeatureAccess);
  const canCreateCompanyChannels = isFeatureFullyEnabled(companyChatFeatureAccess);
  const companyChatAccessMode = isFeatureFullyEnabled(companyChatFeatureAccess) ? 'full' : 'general_only';
  const isGeneralOnlyChat = companyChatAccessMode === 'general_only';
  const canUseCompanyDocuments = isFeatureAccessible(companyDocumentsFeatureAccess);
  const companyDocumentsMode = companyDocumentsFeatureAccess?.config?.mode || null;
  const bimBlocked = companyDocumentsFeatureAccess?.access_level === 'limited' && ['basic', 'basic_chronological'].includes(companyDocumentsMode);
  const canUpload = currentMembership?.status === 'active' && canUseCompanyDocuments;

  const { data: companyMembers = [] } = useQuery({
    queryKey: ['companyMembers', activeCompanyId],
    queryFn: () => appClient.entities.CompanyMember.filter({ company_id: activeCompanyId, status: 'active' }),
    enabled: !!activeCompanyId,
    staleTime: 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: companyDocuments = [] } = useQuery({
    queryKey: ['companyDocuments', activeCompanyId],
    queryFn: () => appClient.entities.ProjectDocument.filter({ company_id: activeCompanyId }, '-created_date'),
    enabled: !!activeCompanyId,
    staleTime: 60 * 1000,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', 'company', activeCompanyId],
    queryFn: () => appClient.entities.Channel.filter({ company_id: activeCompanyId }),
    enabled: !!activeCompanyId,
    staleTime: 60 * 1000,
  });

  const companyParticipants = useMemo(
    () => companyMembers.map((member) => ({
      id: member.id,
      user_email: member.user_email,
      company_id: activeCompanyId,
      status: member.status,
      user_display_name: getUserDisplayNameByEmail(member.user_email, allUsers),
    })),
    [companyMembers, activeCompanyId, allUsers],
  );

  const generalChannel = isGeneralOnlyChat
    ? channels.find((channel) => channel.type === 'company') || null
    : null;

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) || generalChannel || null;

  const documentsChronological = [...companyDocuments].sort((first, second) => new Date(second.created_date) - new Date(first.created_date));
  const isBimFileType = (fileType) => BIM_FILE_TYPES.has((fileType || '').toLowerCase());

  const docsByCategory = useMemo(() => {
    return documentsChronological.reduce((acc, document) => {
      const key = document.category || 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(document);
      return acc;
    }, {});
  }, [documentsChronological]);

  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !activeCompanyId) return;
      const fileType = uploadFile.name.split('.').pop()?.toLowerCase() || 'file';
      if (bimBlocked && isBimFileType(fileType)) {
        throw new Error(tr('I file BIM sono disponibili solo con la società Pro.', 'BIM files are available only with the Pro company plan.'));
      }
      const uploaded = await appClient.integrations.Core.UploadFile({ file: uploadFile });
      await appClient.entities.ProjectDocument.create({
        project_id: null,
        company_id: activeCompanyId,
        name: uploadName.trim() || uploadFile.name,
        file_url: uploaded.file_url,
        file_type: fileType,
        file_size: uploadFile.size,
        category: uploadCategory,
        uploaded_by_email: user?.email,
        uploaded_by_name: user?.display_name || user?.full_name || user?.email,
      });
    },
    onSuccess: () => {
      setUploadFile(null);
      setUploadName('');
      setUploadOpen(false);
      queryClient.invalidateQueries({ queryKey: ['companyDocuments', activeCompanyId] });
    },
    onError: (error) => {
      toast({
        title: tr('Upload non disponibile', 'Upload unavailable'),
        description: error?.message || tr('Impossibile caricare il documento.', 'Unable to upload the document.'),
      });
    },
  });

  const handleChannelSelection = (channelId) => {
    setSelectedChannelId(channelId);
    setChatShowChannels(false);
  };

  useEffect(() => {
    if (activeTab !== null || isCompanyFeatureAccessLoading) return;
    setActiveTab(canUseCompanyTimeTracking ? 'timbrature' : 'docs');
  }, [activeTab, isCompanyFeatureAccessLoading, canUseCompanyTimeTracking]);

  useEffect(() => {
    if (!isGeneralOnlyChat) return;
    setChatShowChannels(false);
    if (generalChannel?.id && selectedChannelId !== generalChannel.id) {
      setSelectedChannelId(generalChannel.id);
    }
  }, [isGeneralOnlyChat, generalChannel?.id, selectedChannelId]);

  const documentCategoryLabel = (category) => {
    const map = {
      photo: t('operational.photo'),
      report: t('operational.report'),
      drawing: t('operational.drawing'),
      other: t('operational.other'),
    };
    return map[category] || category || t('operational.other');
  };

  if (isLoading) {
    return <div className="text-sm text-gray-600">{t('common.loading')}</div>;
  }

  if (activeTab === null) {
    return <div className="text-sm text-gray-600">{t('common.loading')}</div>;
  }

  if (!activeCompanyId || !currentCompany) {
    return (
      <Card className="operative-simple-card rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-[#6d5c55]">{tr('Nessuna società attiva nel contesto operativo.', 'No active company in operational context.')}</p>
          <Button className="w-full" onClick={() => navigate('/app/operativa')}>{t('operational.backToSelection')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="operative-shell space-y-3 pb-24">
      <div className="operative-sticky-strip sticky top-16 z-20 pb-2">
        <Button variant="outline" className="w-full" onClick={() => navigate('/app/operativa')}>
          Torna alla home
        </Button>
      </div>

      <Card className="operative-simple-card rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
        <CardHeader>
          <CardTitle className="text-base text-[#231b18]">{currentCompany.name}</CardTitle>
        </CardHeader>
      </Card>

      {activeTab === 'timbrature' && (
        canUseCompanyTimeTracking ? (
          <CompanyTimeTrackingSection
            companyId={activeCompanyId}
            companyName={currentCompany.name}
            currentUser={user}
            isAdmin={isCompanyAdmin}
            mode="operational"
          />
        ) : (
          <FeatureGateCard
            compact
            title={tr('Timbrature premium', 'Premium time tracking')}
            description={tr(
              'Le timbrature societarie sono disponibili solo con le funzioni premium della società.',
              'Company time tracking is available only with the company premium features.',
            )}
            badgeLabel={tr('Società Pro', 'Pro company')}
          />
        )
      )}

      {activeTab === 'docs' && (
        canUseCompanyDocuments ? (
          <Card className="operative-simple-card rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
            <CardHeader>
              <CardTitle className="text-base text-[#231b18]">{tr('Documenti società', 'Company documents')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[58vh] overflow-y-auto">
              <p className="text-xs text-[#8c766e]">{t('operational.docsOrderedInfo')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={docsView === 'chronological' ? 'default' : 'outline'}
                  onClick={() => setDocsView('chronological')}
                >
                  <History className="h-4 w-4 mr-2" />
                  {t('operational.docsChronological')}
                </Button>
                <Button
                  variant={docsView === 'explorer' ? 'default' : 'outline'}
                  onClick={() => setDocsView('explorer')}
                >
                  <FolderTree className="h-4 w-4 mr-2" />
                  {t('operational.docsExplorer')}
                </Button>
              </div>
              <Button className="operative-quick-button w-full justify-center" onClick={() => setUploadOpen(true)} disabled={!canUpload}>
                <UploadCloud className="h-4 w-4 mr-2" />
                {t('operational.addPhoto')}
              </Button>
              {companyDocuments.length > 0 ? (
                docsView === 'chronological' ? (
                  documentsChronological.map((document) => (
                    <div key={document.id} className="rounded-[1rem] border border-[rgba(197,177,165,0.42)] bg-[rgba(255,251,248,0.96)] p-3">
                      <p className="font-semibold text-[#231b18]">{document.name}</p>
                      <p className="mt-1 text-xs text-[#6d5c55]">
                        {format(new Date(document.created_date), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                        {' • '}
                        {documentCategoryLabel(document.category)}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                        if (bimBlocked && isBimFileType(document.file_type || document.model_format)) {
                          toast({
                            title: tr('Preview BIM non disponibile', 'BIM preview unavailable'),
                            description: tr('Con la società free i file IFC, GLB e GLTF non sono apribili in anteprima.', 'With a free company, IFC, GLB, and GLTF files cannot be previewed.'),
                          });
                          return;
                        }
                        window.open(document.file_url, '_blank', 'noopener,noreferrer');
                      }}>
                        {t('operational.openFile')}
                      </Button>
                    </div>
                  ))
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(docsByCategory).map(([category, docs]) => (
                      <AccordionItem key={category} value={`cat-${category}`}>
                        <AccordionTrigger>{`${documentCategoryLabel(category)} (${docs.length})`}</AccordionTrigger>
                        <AccordionContent className="space-y-2 max-h-[30vh] overflow-y-auto">
                          {docs.map((document) => (
                            <div key={document.id} className="rounded-[1rem] border border-[rgba(197,177,165,0.42)] bg-[rgba(255,251,248,0.96)] p-3">
                              <p className="font-semibold text-[#231b18]">{document.name}</p>
                              <p className="mt-1 text-xs text-[#6d5c55]">{format(new Date(document.created_date), 'dd MMM yyyy HH:mm', { locale: dateLocale })}</p>
                              <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                                if (bimBlocked && isBimFileType(document.file_type || document.model_format)) {
                                  toast({
                                    title: tr('Preview BIM non disponibile', 'BIM preview unavailable'),
                                    description: tr('Con la società free i file IFC, GLB e GLTF non sono apribili in anteprima.', 'With a free company, IFC, GLB, and GLTF files cannot be previewed.'),
                                  });
                                  return;
                                }
                                window.open(document.file_url, '_blank', 'noopener,noreferrer');
                              }}>
                                {t('operational.openFile')}
                              </Button>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )
              ) : <p className="text-sm text-[#6d5c55]">{t('documents.noDocuments')}</p>}
            </CardContent>
          </Card>
        ) : (
          <FeatureGateCard
            compact
            title={tr('Documenti premium', 'Premium documents')}
            description={tr(
              'I documenti della società sono disponibili solo con le funzioni premium della società.',
              'Company documents are available only with the company premium features.',
            )}
            badgeLabel={tr('Società Pro', 'Pro company')}
          />
        )
      )}

      {activeTab === 'chat' && (
        <Card className="operative-simple-card flex h-[66vh] flex-col overflow-hidden rounded-[1.5rem] border-[rgba(197,177,165,0.44)]">
          <div className="flex items-center justify-between border-b border-[rgba(197,177,165,0.42)] p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#231b18]">{selectedChannel?.name || tr('Canali società', 'Company channels')}</p>
            </div>
            {!isGeneralOnlyChat && (
              <Button variant="ghost" size="icon" onClick={() => setChatShowChannels((prev) => !prev)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>

          {!isGeneralOnlyChat && (chatShowChannels || !selectedChannelId) ? (
            <div className="p-3 overflow-y-auto">
              <ChannelList
                scopeType="company"
                scopeId={activeCompanyId}
                companyId={activeCompanyId}
                currentUserEmail={user?.email}
                activeCompanyId={activeCompanyId}
                selectedChannelId={selectedChannelId}
                onSelectChannel={handleChannelSelection}
                participants={companyParticipants}
                canCreateChannels={isCompanyAdmin && canCreateCompanyChannels}
                channelAccessMode={companyChatAccessMode}
              />
            </div>
          ) : (
            <>
              <MessageList
                channelId={selectedChannelId}
                companyId={activeCompanyId}
                scopeType="company"
                currentUserEmail={user?.email}
              />
              <MessageInput
                channelId={selectedChannelId}
                companyId={activeCompanyId}
                scopeType="company"
                currentUserEmail={user?.email}
                currentUserName={user?.full_name || user?.display_name}
                contextType="company"
                activeCompanyId={activeCompanyId}
                activeCompanyName={currentCompany.name}
                participants={companyParticipants}
              />
            </>
          )}
        </Card>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('operational.uploadTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="file" accept={bimBlocked ? 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar' : 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ifc,.glb,.gltf,.zip,.rar'} onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
            {bimBlocked ? <p className="text-xs text-amber-700">{tr('IFC, GLB e GLTF si attivano solo con la società Pro.', 'IFC, GLB, and GLTF unlock only with the Pro company plan.')}</p> : null}
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">{t('operational.photo')}</SelectItem>
                <SelectItem value="report">{t('operational.report')}</SelectItem>
                <SelectItem value="drawing">{t('operational.drawing')}</SelectItem>
                <SelectItem value="other">{t('operational.other')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={uploadName}
              onChange={(event) => setUploadName(event.target.value)}
              placeholder={t('operational.fileNameOptional')}
            />
            <Button
              className="w-full"
              disabled={!uploadFile || uploadDocumentMutation.isPending}
              onClick={() => uploadDocumentMutation.mutate()}
            >
              {uploadDocumentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
              {t('operational.uploadNow')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="operative-bottom-nav fixed bottom-0 left-0 right-0 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          <Button variant={activeTab === 'timbrature' ? 'default' : 'ghost'} className="h-12 flex-col rounded-[1rem]" onClick={() => setActiveTab('timbrature')}>
            <Clock className="h-4 w-4" />
            <span className="text-[10px]">{tr('Timbrature', 'Tracking')}</span>
          </Button>
          <Button variant={activeTab === 'docs' ? 'default' : 'ghost'} className="h-12 flex-col rounded-[1rem]" onClick={() => setActiveTab('docs')}>
            <FileText className="h-4 w-4" />
            <span className="text-[10px]">{t('operational.docsTab')}</span>
          </Button>
          <Button variant={activeTab === 'chat' ? 'default' : 'ghost'} className="h-12 flex-col rounded-[1rem]" onClick={() => setActiveTab('chat')}>
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px]">{t('operational.chatTab')}</span>
          </Button>
        </div>
      </div>

    </div>
  );
}
