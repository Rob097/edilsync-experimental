import React, { useEffect, useMemo, useRef, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles, Send, Mic, MicOff, Loader2, MessageSquare, X, Plus, Trash2, History, MessageCircleOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "@/components/assistant/MessageBubble";
import SuggestedMessages from "@/components/assistant/SuggestedMessages";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/i18n/useLanguage';

const STORAGE_KEY = 'edilsync_assistant_ui_conversations';
const ACTIVE_CONVERSATION_KEY = 'edilsync_assistant_ui_active';
const ASSISTANT_AVAILABLE = false;

const readStoredConversations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeStoredConversations = (conversations) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

const buildScopeKey = (user) => {
  const context = user?.active_context || 'personal';
  const companyId = user?.active_company_id || 'none';
  const email = user?.email || 'unknown';
  return `${email}::${context}::${companyId}`;
};

const buildConversationName = (dateLocale) => `Chat ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}`;

export default function AssistantFloatingButton({ className }) {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const [isOpen, setIsOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [conversationId, setConversationId] = useState(null);
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

  const scopeKey = useMemo(() => buildScopeKey(user), [user]);

  const conversations = useMemo(() => {
    return readStoredConversations()
      .filter((conv) => conv.scopeKey === scopeKey)
      .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
  }, [scopeKey, isOpen, conversationId, messages.length]);

  const persistConversation = (nextConversation) => {
    const allConversations = readStoredConversations().filter((conv) => conv.id !== nextConversation.id);
    allConversations.push(nextConversation);
    writeStoredConversations(allConversations);
  };

  const openConversation = (conversation) => {
    setConversationId(conversation.id);
    setMessages(conversation.messages || []);
    localStorage.setItem(`${ACTIVE_CONVERSATION_KEY}:${scopeKey}`, conversation.id);
  };

  const createConversation = () => {
    const conversation = {
      id: crypto.randomUUID(),
      scopeKey,
      metadata: {
        name: buildConversationName(dateLocale),
        context: user?.active_context || 'personal',
        company_id: user?.active_company_id || null,
      },
      messages: [],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    persistConversation(conversation);
    openConversation(conversation);
    return conversation;
  };

  useEffect(() => {
    if (!ASSISTANT_AVAILABLE) return;
    if (!isOpen || !user) return;
    if (conversationId) return;

    const activeConversationId = localStorage.getItem(`${ACTIVE_CONVERSATION_KEY}:${scopeKey}`);
    const existingConversations = readStoredConversations()
      .filter((conv) => conv.scopeKey === scopeKey)
      .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));

    const activeConversation = existingConversations.find((conv) => conv.id === activeConversationId);

    if (activeConversation) {
      openConversation(activeConversation);
      return;
    }

    if (existingConversations[0]) {
      openConversation(existingConversations[0]);
      return;
    }

    createConversation();
  }, [isOpen, user, conversationId, scopeKey]);

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
        toast.error(tr('Errore nel riconoscimento vocale', 'Speech recognition error'));
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [currentLanguage]);

  const handleSendMessage = async (messageText) => {
    if (!ASSISTANT_AVAILABLE) {
      toast.info(tr('Stiamo lavorando all\'assistente AI. Per ora non e ancora attivo.', 'We are working on the AI assistant. It is not active yet.'));
      return;
    }

    const textToSend = (messageText || input).trim();
    if (!textToSend) return;

    const existingConversation = conversations.find((conv) => conv.id === conversationId) || createConversation();
    const nextMessages = [
      ...(existingConversation.messages || []),
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: textToSend,
        created_date: new Date().toISOString(),
      },
    ];

    const updatedConversation = {
      ...existingConversation,
      messages: nextMessages,
      updated_date: new Date().toISOString(),
    };

    persistConversation(updatedConversation);
    openConversation(updatedConversation);
    setInput('');
    setIsLoading(true);

    setIsLoading(false);
  };

  const toggleVoiceInput = () => {
    if (!ASSISTANT_AVAILABLE) {
      toast.info(tr('La funzione vocale arrivera piu avanti, insieme all\'assistente AI.', 'Voice input will be available later, together with the AI assistant.'));
      return;
    }

    if (!recognition) {
      toast.error(tr('Il riconoscimento vocale non è supportato dal tuo browser', 'Speech recognition is not supported by your browser'));
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.start();
    setIsListening(true);
    toast.info(tr('In ascolto...', 'Listening...'));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    if (!ASSISTANT_AVAILABLE) {
      toast.info(tr('L\'assistente AI e ancora in preparazione.', 'The AI assistant is still in progress.'));
      return;
    }

    createConversation();
    setShowConversations(false);
    toast.success(tr('Nuova chat avviata', 'New chat started'));
  };

  const handleLoadConversation = (targetConversationId) => {
    const targetConversation = readStoredConversations().find((conv) => conv.id === targetConversationId && conv.scopeKey === scopeKey);
    if (!targetConversation) return;
    openConversation(targetConversation);
    setShowConversations(false);
  };

  const handleDeleteConversation = (targetConversationId) => {
    const nextConversations = readStoredConversations().filter((conv) => conv.id !== targetConversationId);
    writeStoredConversations(nextConversations);

    if (targetConversationId === conversationId) {
      setConversationId(null);
      setMessages([]);
      localStorage.removeItem(`${ACTIVE_CONVERSATION_KEY}:${scopeKey}`);
    }

    setShowConversations(false);
    toast.success(tr('Chat eliminata', 'Chat deleted'));
  };

  return (
    <>
      <Button
        data-tour="assistant"
        onClick={() => setIsOpen(true)}
        title={tr('Assistente AI in lavorazione', 'AI assistant in progress')}
        aria-label={tr('Apri il pannello dell\'assistente AI in lavorazione', 'Open the AI assistant panel in progress')}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-[#ef6144] to-orange-600 hover:from-[#ef6144]/90 hover:to-orange-600/90 z-50",
          className,
        )}
        size="icon"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ef6144] to-orange-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-lg">{tr('Assistente AI', 'AI Assistant')}</SheetTitle>
                <p className="text-xs text-gray-500">{tr('Stiamo lavorando a questo strumento: per ora non e ancora attivo', 'We are working on this tool: it is not active yet')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title={tr('Assistente AI in lavorazione', 'AI assistant in progress')}
                  onClick={() => toast.info(tr('Stiamo preparando l\'assistente AI. Quando sara pronto potrai usarlo da qui.', 'We are preparing the AI assistant. When it is ready, you will use it from here.'))}
                >
                  <MessageCircleOff className="h-4 w-4" />
                </Button>
                {ASSISTANT_AVAILABLE && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowConversations(!showConversations)}
                      title={tr('Storico chat', 'Chat history')}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNewConversation}
                      title={tr('Nuova chat', 'New chat')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {ASSISTANT_AVAILABLE && showConversations ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{tr('Le tue chat', 'Your chats')}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowConversations(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">{tr('Nessuna chat disponibile', 'No chats available')}</p>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          conversation.id === conversationId
                            ? "bg-[#ef6144]/10 border-[#ef6144]"
                            : "hover:bg-gray-50 border-gray-200",
                        )}
                        onClick={() => handleLoadConversation(conversation.id)}
                      >
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.metadata?.name || tr('Chat senza titolo', 'Untitled chat')}
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
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {!ASSISTANT_AVAILABLE ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-[#ef6144]/10 flex items-center justify-center mb-4">
                        <MessageCircleOff className="h-8 w-8 text-[#ef6144]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {tr('Assistente AI in lavorazione', 'AI assistant in progress')}
                      </h3>
                      <p className="text-sm text-gray-600 max-w-sm">
                        {tr('Stiamo preparando uno strumento che ti aiutera a trovare piu in fretta informazioni su cantieri, documenti e attivita di cantiere.', 'We are preparing a tool that will help you find information about worksites, documents, and site activities faster.')}
                      </p>
                      <p className="text-sm text-gray-500 max-w-sm mt-3">
                        {tr('Per ora non funziona ancora. Quando sara pronto, potrai scrivergli da questo pannello.', 'For now, it does not work yet. When it is ready, you will be able to write to it from this panel.')}
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-[#ef6144]/10 flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-[#ef6144]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {tr('Ciao! La UI dell’assistente e di nuovo disponibile', 'Hi! The assistant UI is available again')}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {tr('Puoi usare questa interfaccia come placeholder. Le risposte sono locali finche il backend non viene ricollegato.', 'You can use this interface as a placeholder. Replies are local until backend support is wired back in.')}
                      </p>
                    </div>
                  ) : (
                    messages.map((message, idx) => (
                      <MessageBubble key={message.id || idx} message={message} />
                    ))
                  )}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{tr('Sto pensando...', 'Thinking...')}</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {ASSISTANT_AVAILABLE && messages.length === 0 && (
                  <div className="border-t border-gray-200 p-4">
                    <SuggestedMessages onSelectMessage={handleSendMessage} />
                  </div>
                )}

                <div className="border-t border-gray-200 p-4">
                  {!ASSISTANT_AVAILABLE ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-medium text-amber-900">
                        {tr('Funzione in preparazione', 'Feature in progress')}
                      </p>
                      <p className="text-sm text-amber-800 mt-1">
                        {tr('Qui potrai parlare con l\'assistente AI, ma non e ancora disponibile.', 'You will be able to talk to the AI assistant here, but it is not available yet.')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={tr('Scrivi un messaggio...', 'Write a message...')}
                        className="min-h-[60px] max-h-[120px] resize-none"
                        disabled={isLoading}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          size="icon"
                          variant={isListening ? 'destructive' : 'outline'}
                          onClick={toggleVoiceInput}
                          disabled={isLoading}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => handleSendMessage()}
                          disabled={!input.trim() || isLoading}
                          className="bg-[#ef6144] hover:bg-[#ef6144]/90"
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
        </SheetContent>
      </Sheet>
    </>
  );
}