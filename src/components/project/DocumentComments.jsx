import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function DocumentComments({ documentId, projectId }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['documentComments', documentId],
    queryFn: () => base44.entities.DocumentComment.filter({ document_id: documentId }),
    enabled: !!documentId,
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentComments', documentId]);
      setCommentText('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    createCommentMutation.mutate({
      document_id: documentId,
      project_id: projectId,
      comment: commentText.trim(),
      author_email: user.email,
      author_name: user.full_name,
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sortedComments = [...comments].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <MessageSquare className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold">{tr('Commenti', 'Comments')}</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : sortedComments.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {sortedComments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                  {getInitials(comment.author_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="font-medium text-sm">{comment.author_name}</p>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_date), 'dd MMM, HH:mm', { locale: dateLocale })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {comment.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          {tr('Nessun commento. Sii il primo a commentare!', 'No comments yet. Be the first to comment!')}
        </p>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={tr('Scrivi un commento...', 'Write a comment...')}
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim() || createCommentMutation.isPending}
              className="bg-[#ef6144] hover:bg-[#d9553a]"
            >
              <Send className="h-4 w-4 mr-2" />
              {tr('Invia', 'Send')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}