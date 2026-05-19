import React, { useEffect, useMemo, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Mic, MicOff, Loader2, MessageSquare, X, Plus, Trash2, History } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "@/components/assistant/MessageBubble";
import SuggestedMessages from "@/components/assistant/SuggestedMessages";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';
import { useLocation } from 'react-router-dom';
import { describeAssistantContext, resolveAssistantChatScope, resolveAssistantContext, resolveAssistantUiMode } from '@/lib/assistantContext';

const EMPTY_ITEMS = [];

const replacePendingAssistantMessage = (items, updater) => {
  const assistantIndex = [...items].reverse().findIndex((message) => message.role === 'assistant');
  if (assistantIndex === -1) {
    return items;
  }

  const targetIndex = items.length - 1 - assistantIndex;
  return items.map((message, index) => (index === targetIndex ? updater(message) : message));
};

const TEMPORARY_ASSISTANT_ERROR_PATTERNS = [
  /assistant_temporarily_unavailable/i,
  /high demand/i,
  /resource_exhausted/i,
  /quota/i,
  /rate limit/i,
  /too many requests/i,
  /temporarily unavailable/i,
  /try again later/i,
  /service unavailable/i,
  /overloaded/i,
  /gemini/i,
  /openai/i,
];

const getAssistantConversationTimestamp = (conversation) => String(
  conversation?.updated_date || conversation?.last_message_at || conversation?.created_date || '',
);

const sortAssistantConversations = (left, right) => (
  getAssistantConversationTimestamp(right).localeCompare(getAssistantConversationTimestamp(left))
  || String(right?.id || '').localeCompare(String(left?.id || ''))
);

const mergeAssistantConversations = (...conversationGroups) => {
  const conversationsById = new Map();

  conversationGroups.flat().forEach((conversation) => {
    if (!conversation?.id) {
      return;
    }

    const existingConversation = conversationsById.get(conversation.id);
    if (!existingConversation || sortAssistantConversations(conversation, existingConversation) < 0) {
      conversationsById.set(conversation.id, conversation);
    }
  });

  return Array.from(conversationsById.values()).sort(sortAssistantConversations);
};

export default function AssistantFloatingButton({ className }) {
  const { t, currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const location = useLocation();const tx = (key, options) => t(`completeScoped.components_assistant_AssistantFloatingButton.${key}`, options);
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const [isOpen, setIsOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isDraftConversation, setIsDraftConversation] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const { data: activeCompany } = useQuery({
    queryKey: ['assistantActiveCompany', user?.active_company_id],
    queryFn: async () => {
      const companies = await appClient.entities.Company.filter({ id: user.active_company_id }, 'created_date', 1);
      return companies[0] || null;
    },
    enabled: !!user?.active_company_id,
    staleTime: 5 * 60 * 1000,
  });

  const assistantFocusContext = useMemo(() => resolveAssistantContext({
    pathname: location.pathname,
    search: location.search,
    user,
  }), [location.pathname, location.search, user]);

  const assistantChatScope = useMemo(() => resolveAssistantChatScope({ user }), [user]);

  const assistantUiMode = useMemo(
    () => resolveAssistantUiMode({ pathname: location.pathname }),
    [location.pathname],
  );

  const assistantContextLabel = useMemo(
    () => describeAssistantContext(assistantChatScope, currentLanguage, { companyName: activeCompany?.name }),
    [activeCompany?.name, assistantChatScope, currentLanguage],
  );

  const showAssistantToolCalls = user?.role === 'admin';

  const assistantScopeKey = assistantChatScope ? `${assistantChatScope.type}:${assistantChatScope.id}:${assistantUiMode}` : 'none';
  const assistantConversationQueryKey = useMemo(
    () => ['assistantChats', user?.id, assistantChatScope?.type, assistantChatScope?.id, assistantFocusContext?.type, assistantFocusContext?.id],
    [user?.id, assistantChatScope?.type, assistantChatScope?.id, assistantFocusContext?.type, assistantFocusContext?.id],
  );
  const getFriendlyAssistantErrorMessage = (rawMessage) => {
    const fallbackMessage = tx('k26');
    const normalizedMessage = String(rawMessage || '').trim();

    if (!normalizedMessage) {
      return fallbackMessage;
    }

    if (TEMPORARY_ASSISTANT_ERROR_PATTERNS.some((pattern) => pattern.test(normalizedMessage))) {
      return fallbackMessage;
    }

    return normalizedMessage;
  };

  const { data: conversations = EMPTY_ITEMS, isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: assistantConversationQueryKey,
    queryFn: async () => {
      const scopeConversationsPromise = appClient.entities.AiChat.filter({
        user_id: user.id,
        context_type: assistantChatScope.type,
        context_id: assistantChatScope.id,
      }, '-updated_date', 30);

      const shouldIncludeLegacyProjectConversations = assistantFocusContext?.type === 'project'
        && !(assistantChatScope.type === 'project' && assistantChatScope.id === assistantFocusContext.id);

      if (!shouldIncludeLegacyProjectConversations) {
        return scopeConversationsPromise;
      }

      const [scopeConversations, legacyProjectConversations] = await Promise.all([
        scopeConversationsPromise,
        appClient.entities.AiChat.filter({
          user_id: user.id,
          context_type: assistantFocusContext.type,
          context_id: assistantFocusContext.id,
        }, '-updated_date', 30),
      ]);

      return mergeAssistantConversations(scopeConversations, legacyProjectConversations);
    },
    enabled: isOpen && !!user?.id && !!assistantChatScope,
    staleTime: 15 * 1000,
  });

  const { data: loadedMessages = EMPTY_ITEMS, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['assistantMessages', conversationId],
    queryFn: () => appClient.entities.AiMessage.filter({ chat_id: conversationId }, 'created_date', 100),
    enabled: isOpen && !!conversationId,
    staleTime: 0,
  });

  useEffect(() => {
    setConversationId(null);
    setIsDraftConversation(false);
    setMessages([]);
    setShowConversations(false);
  }, [assistantScopeKey]);

  useEffect(() => {
    if (!isOpen || !assistantChatScope) return;
    if (isDraftConversation || conversationId) {
      return;
    }

    setConversationId(conversations[0]?.id || null);
  }, [assistantChatScope, conversationId, conversations, isDraftConversation, isOpen]);

  useEffect(() => {
    if (!isOpen || isDraftConversation || !conversationId) {
      return;
    }

    if (conversations.length === 0) {
      return;
    }

    const conversationStillVisible = conversations.some((conversation) => conversation.id === conversationId);
    if (!conversationStillVisible) {
      setConversationId(conversations[0]?.id || null);
    }
  }, [conversationId, conversations, isDraftConversation, isOpen]);

  useEffect(() => {
    if (!conversationId) {
      if (!isDraftConversation) {
        setMessages((currentMessages) => (currentMessages.length === 0 ? currentMessages : EMPTY_ITEMS));
      }
      return;
    }

    if (isLoadingMessages) {
      return;
    }

    setMessages((currentMessages) => (currentMessages === loadedMessages ? currentMessages : loadedMessages));
  }, [conversationId, isDraftConversation, isLoadingMessages, loadedMessages]);

  useEffect(() => {
    if (isOpen && !showConversations && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen, showConversations]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = currentLanguage === 'it' ? 'it-IT' : 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
        toast.error(tx('k1'));
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleWindowKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowConversations(false);
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (messageText) => {
    if (!assistantFocusContext || !assistantChatScope || !user?.id) {
      toast.error(tx('k2'));
      return;
    }

    const textToSend = (messageText || input).trim();
    if (!textToSend) return;

    const tempAssistantId = `assistant-${crypto.randomUUID()}`;
    let nextConversationId = conversationId;
    let streamingError = null;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${crypto.randomUUID()}`,
        role: 'user',
        content: textToSend,
        created_date: new Date().toISOString(),
      },
      {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        status: 'streaming',
        tool_calls: [],
        created_date: new Date().toISOString(),
      },
    ]);

    setInput('');
    setIsLoading(true);

    try {
      await appClient.functions.stream('chat-agent', {
        chat_id: conversationId,
        message: textToSend,
        context_type: assistantFocusContext.type,
        context_id: assistantFocusContext.id,
        ui_mode: assistantUiMode,
        route_path: location.pathname,
        route_search: location.search,
        stream: true,
      }, {
        onEvent: ({ event, payload }) => {
          if (event === 'meta' && payload?.chat_id) {
            nextConversationId = payload.chat_id;
          }
        },
        onDelta: (payload) => {
          setMessages((currentMessages) => replacePendingAssistantMessage(currentMessages, (message) => ({
            ...message,
            content: `${message.content || ''}${payload?.content || ''}`,
            status: 'streaming',
          })));
        },
        onTool: (payload) => {
          setMessages((currentMessages) => replacePendingAssistantMessage(currentMessages, (message) => ({
            ...message,
            tool_calls: [...(message.tool_calls || []), payload],
          })));
        },
        onDone: (payload) => {
          if (payload?.chat_id) {
            nextConversationId = payload.chat_id;
            setIsDraftConversation(false);
            setConversationId(payload.chat_id);
          }

          setMessages((currentMessages) => replacePendingAssistantMessage(currentMessages, (message) => ({
            ...message,
            id: payload?.assistant_message_id || message.id,
            content: payload?.content || message.content,
            tool_calls: Array.isArray(payload?.tool_calls) ? payload.tool_calls : (message.tool_calls || []),
            status: 'completed',
          })));
        },
        onError: (payload) => {
          const friendlyMessage = getFriendlyAssistantErrorMessage(payload?.message);
          streamingError = friendlyMessage;
          setMessages((currentMessages) => replacePendingAssistantMessage(currentMessages, (message) => ({
            ...message,
            content: friendlyMessage,
            status: 'failed',
          })));
        },
      });

      if (streamingError) {
        throw new Error(streamingError);
      }

      await queryClient.invalidateQueries({ queryKey: assistantConversationQueryKey });
      await refetchConversations();
      if (nextConversationId) {
        setConversationId(nextConversationId);
      }
    } catch (error) {
      const errorMessage = getFriendlyAssistantErrorMessage(error?.message);
      setMessages((currentMessages) => replacePendingAssistantMessage(currentMessages, (message) => ({
        ...message,
        content: errorMessage,
        status: 'failed',
      })));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      toast.error(tx('k3'));
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.start();
    setIsListening(true);
    toast.info(tx('k4'));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setIsDraftConversation(true);
    setMessages([]);
    setShowConversations(false);
    toast.success(tx('k5'));
  };

  const handleLoadConversation = (targetConversationId) => {
    setIsDraftConversation(false);
    setConversationId(targetConversationId);
    setShowConversations(false);
  };

  const handleDeleteConversation = async (targetConversationId) => {
    try {
      await appClient.entities.AiChat.delete(targetConversationId);

      if (targetConversationId === conversationId) {
        setConversationId(null);
        setIsDraftConversation(false);
        setMessages([]);
      }

      await queryClient.invalidateQueries({ queryKey: assistantConversationQueryKey });
      setShowConversations(false);
      toast.success(tx('k6'));
    } catch (error) {
      toast.error(error?.message || tx('k7'));
    }
  };

  const hasMessages = messages.length > 0;
  const isBusy = isLoading || isLoadingMessages;
  const handleAssistantNavigation = () => {
    setShowConversations(false);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        data-tour="assistant"
        onClick={() => setIsOpen(true)}
        title={tx('k8')}
        aria-label={tx('k9')}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-[#ef6144] to-orange-600 hover:from-[#ef6144]/90 hover:to-orange-600/90 z-50",
          className,
        )}
        size="icon"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {isOpen && (
        <div className="fixed inset-x-3 bottom-24 z-50 sm:inset-x-auto sm:right-6 sm:w-[440px]">
          <div
            role="dialog"
            aria-modal="false"
            aria-labelledby="assistant-panel-title"
            className="relative flex h-[min(78vh,720px)] max-h-[calc(100vh-6.5rem)] w-full flex-col overflow-hidden rounded-[28px] border border-[rgba(197,177,165,0.48)] bg-[rgba(255,252,249,0.98)] shadow-[0_28px_80px_rgba(95,63,52,0.18)] backdrop-blur-sm"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(239,97,68,0.10),rgba(255,252,249,0))]" />

            <div className="relative border-b border-[rgba(197,177,165,0.45)] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ef6144] to-orange-600 shadow-[0_16px_28px_rgba(217,85,58,0.18)]">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="assistant-panel-title" className="text-base font-semibold text-slate-900">
                    {tx('k10')}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {tx('k11')}: <span className="font-medium text-slate-700">{assistantContextLabel}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-[rgba(197,177,165,0.36)] bg-white/80 text-slate-600 hover:bg-white"
                    onClick={() => setShowConversations(!showConversations)}
                    title={tx('k12')}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-[rgba(197,177,165,0.36)] bg-white/80 text-slate-600 hover:bg-white"
                    onClick={handleNewConversation}
                    title={tx('k13')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-[rgba(197,177,165,0.36)] bg-white/80 text-slate-600 hover:bg-white"
                    onClick={() => {
                      setShowConversations(false);
                      setIsOpen(false);
                    }}
                    title={tx('k14')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {showConversations ? (
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{tx('k15')}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowConversations(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center py-8 text-gray-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="text-sm">{tx('k16')}</span>
                      </div>
                    ) : conversations.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-500">{tx('k17')}</p>
                    ) : (
                      conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors',
                            conversation.id === conversationId
                              ? 'border-[#ef6144]/40 bg-[#ef6144]/8'
                              : 'border-[rgba(197,177,165,0.36)] bg-white/80 hover:bg-white',
                          )}
                          onClick={() => handleLoadConversation(conversation.id)}
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {conversation.title || tx('k18')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(conversation.updated_date || conversation.created_date), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteConversation(conversation.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,248,244,0.76),rgba(255,252,249,0.98))] px-5 py-5 space-y-4">
                    {!assistantFocusContext ? (
                      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ef6144]/10">
                          <MessageSquare className="h-8 w-8 text-[#ef6144]" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          {tx('k19')}
                        </h3>
                        <p className="max-w-sm text-sm text-gray-600">
                          {tx('k20')}
                        </p>
                      </div>
                    ) : !hasMessages ? (
                      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ef6144]/10">
                          <MessageSquare className="h-8 w-8 text-[#ef6144]" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          {tx('k21')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {tx('k22')}
                        </p>
                      </div>
                    ) : (
                      messages.map((message, idx) => (
                        <MessageBubble
                          key={message.id || idx}
                          message={message}
                          onNavigate={handleAssistantNavigation}
                          showToolCalls={showAssistantToolCalls}
                        />
                      ))
                    )}
                    {isBusy && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{tx('k23')}</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {assistantFocusContext && !hasMessages && (
                    <div className="border-t border-[rgba(197,177,165,0.42)] bg-white/82 px-4 py-4">
                      <SuggestedMessages onSelectMessage={handleSendMessage} />
                    </div>
                  )}

                  <div className="border-t border-[rgba(197,177,165,0.42)] bg-white/90 p-4">
                    {!assistantFocusContext ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm text-slate-700">
                          {tx('k24')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Textarea
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={tx('k25')}
                          className="min-h-[60px] max-h-[120px] resize-none rounded-2xl border-[rgba(197,177,165,0.52)] bg-white/96"
                          disabled={isBusy}
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            size="icon"
                            variant={isListening ? 'destructive' : 'outline'}
                            onClick={toggleVoiceInput}
                            disabled={isBusy}
                            className="h-11 w-11"
                          >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isBusy}
                            className="h-11 w-11 bg-[#ef6144] hover:bg-[#ef6144]/90"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}