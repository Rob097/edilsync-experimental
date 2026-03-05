import React, { useMemo, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AtSign, Hash, Flag, DollarSign, Paperclip, Image as ImageIcon, Loader2 } from 'lucide-react';
import SelectDocumentDialog from '@/components/messaging/SelectDocumentDialog';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

const parseMentions = (value) => {
  const mentions = {
    participant_ids: [],
    task_ids: [],
    milestone_ids: [],
    change_request_ids: [],
    document_ids: [],
  };

  const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  const docRegex = /#\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;

  let match;
  while ((match = mentionRegex.exec(value)) !== null) {
    const [, , type, id] = match;
    if (type === 'participant') mentions.participant_ids.push(id);
    if (type === 'task') mentions.task_ids.push(id);
    if (type === 'milestone') mentions.milestone_ids.push(id);
    if (type === 'change_request') mentions.change_request_ids.push(id);
  }

  while ((match = docRegex.exec(value)) !== null) {
    const [, , type, id] = match;
    if (type === 'document') mentions.document_ids.push(id);
  }

  return mentions;
};

export default function DisputeCommentComposer({
  projectId,
  currentUser,
  onSubmit,
  isPending,
}) {
  const { t, currentLanguage } = useLanguage();
  const tr = (it, en) => (currentLanguage === 'it' ? it : en);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [commentValue, setCommentValue] = useState('');
  const [mentionType, setMentionType] = useState(null);
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const [selectDocumentOpen, setSelectDocumentOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const { data: participants = [] } = useQuery({
    queryKey: ['projectParticipants', projectId],
    queryFn: () => appClient.entities.ProjectParticipant.filter({ project_id: projectId, status: 'active' }),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => appClient.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId && mentionType === 'task',
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => appClient.entities.Milestone.filter({ project_id: projectId }),
    enabled: !!projectId && mentionType === 'milestone',
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => appClient.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId && mentionType === 'change_request',
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    enabled: !!projectId && mentionType === 'participant',
    staleTime: 2 * 60 * 1000,
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
    enabled: !!projectId && mentionType === 'participant',
    staleTime: 5 * 60 * 1000,
  });

  const participantOptions = useMemo(() => {
    return participants.map((participant) => {
      if (participant.participant_type === 'personal') {
        return {
          id: participant.id,
          label: getUserDisplayNameByEmail(participant.user_email, allUsers),
        };
      }

      return {
        id: participant.id,
        label: allCompanies.find((company) => company.id === participant.company_id)?.name || participant.company_name || t('companies.title'),
      };
    });
  }, [participants, allUsers, allCompanies, t]);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const uploaded = await appClient.integrations.Core.UploadFile({ file });
      const document = await appClient.entities.ProjectDocument.create({
        project_id: projectId,
        name: file.name,
        file_url: uploaded.file_url,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'image',
        file_size: file.size,
        category: 'photo',
        uploaded_by_email: currentUser?.email,
        uploaded_by_name: currentUser?.display_name || currentUser?.full_name || currentUser?.email,
      });

      return document;
    },
    onSuccess: (document) => {
      setAttachments((prev) => ([
        ...prev,
        {
          id: document.id,
          name: document.name,
          file_url: document.file_url,
          file_type: document.file_type,
          source: 'photo',
        },
      ]));
      setCommentValue((prev) => `${prev}#[${document.name}](document:${document.id}) `);
      textareaRef.current?.focus();
    },
  });

  const insertMention = (type, item) => {
    const mentionText = `@[${item.label}](${type}:${item.id}) `;
    setCommentValue((prev) => `${prev}${mentionText}`);
    setMentionsOpen(false);
    setMentionType(null);
    textareaRef.current?.focus();
  };

  const insertDocument = (document) => {
    setAttachments((prev) => ([
      ...prev,
      {
        id: document.id,
        name: document.name,
        file_url: document.file_url,
        file_type: document.file_type,
        source: 'document',
      },
    ]));

    setCommentValue((prev) => `${prev}#[${document.name}](document:${document.id}) `);
    textareaRef.current?.focus();
  };

  const handlePickPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadPhotoMutation.mutate(file);
    event.target.value = '';
  };

  const getMentionOptions = () => {
    if (mentionType === 'participant') return participantOptions;
    if (mentionType === 'task') return tasks.map((task) => ({ id: task.id, label: task.title }));
    if (mentionType === 'milestone') return milestones.map((milestone) => ({ id: milestone.id, label: milestone.title }));
    if (mentionType === 'change_request') return changeRequests.map((request) => ({ id: request.id, label: request.title }));
    return [];
  };

  const submitDisabled = isPending || uploadPhotoMutation.isPending || !commentValue.trim();

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <h4 className="text-sm font-semibold">{t('disputes.addComment')}</h4>

      <div className="flex gap-2 flex-wrap">
        <Popover open={mentionsOpen && mentionType === 'participant'} onOpenChange={(open) => {
          setMentionsOpen(open);
          if (!open) setMentionType(null);
        }}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" onClick={() => { setMentionType('participant'); setMentionsOpen(true); }}>
              <AtSign className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {participantOptions.length > 0 ? participantOptions.map((item) => (
                <button type="button" key={item.id} onClick={() => insertMention('participant', item)} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm">{item.label}</button>
              )) : <p className="px-3 py-2 text-sm text-gray-500">{tr('Nessun partecipante disponibile', 'No participant available')}</p>}
            </div>
          </PopoverContent>
        </Popover>

        {[{ type: 'task', icon: Hash }, { type: 'milestone', icon: Flag }, { type: 'change_request', icon: DollarSign }].map(({ type, icon: Icon }) => (
          <Popover key={type} open={mentionsOpen && mentionType === type} onOpenChange={(open) => {
            setMentionsOpen(open);
            if (!open) setMentionType(null);
          }}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" onClick={() => { setMentionType(type); setMentionsOpen(true); }}>
                <Icon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {getMentionOptions().length > 0 ? getMentionOptions().map((item) => (
                  <button type="button" key={item.id} onClick={() => insertMention(type, item)} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm">{item.label}</button>
                )) : <p className="px-3 py-2 text-sm text-gray-500">{tr('Nessun elemento disponibile', 'No item available')}</p>}
              </div>
            </PopoverContent>
          </Popover>
        ))}

        <Button type="button" variant="outline" size="icon" onClick={() => setSelectDocumentOpen(true)}>
          <Paperclip className="h-4 w-4" />
        </Button>

        <Button type="button" variant="outline" size="icon" onClick={handlePickPhoto}>
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={commentValue}
        onChange={(event) => setCommentValue(event.target.value)}
        rows={4}
        placeholder={t('disputes.commentPlaceholder')}
      />

      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <a key={`${attachment.source}-${attachment.id}`} href={attachment.file_url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded border text-[#ef6144] border-[#ef6144]/30 hover:bg-[#ef6144]/5">
              {attachment.name}
            </a>
          ))}
        </div>
      ) : null}

      <Button
        className="w-full bg-[#ef6144] hover:bg-[#d9553a]"
        disabled={submitDisabled}
        onClick={() => {
          const mentions = parseMentions(commentValue);
          onSubmit({
            text: commentValue.trim(),
            mentions,
            attachments,
          });
          setCommentValue('');
          setAttachments([]);
        }}
      >
        {isPending || uploadPhotoMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {t('disputes.publishComment')}
      </Button>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />

      <SelectDocumentDialog
        projectId={projectId}
        open={selectDocumentOpen}
        onOpenChange={setSelectDocumentOpen}
        onSelectDocument={insertDocument}
      />
    </div>
  );
}
