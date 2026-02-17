import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles, Send, Mic, MicOff, Loader2, MessageSquare, X, Plus, Trash2, History } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "@/components/assistant/MessageBubble";
import SuggestedMessages from "@/components/assistant/SuggestedMessages";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AssistantFloatingButton({ className }) {
  const queryClient = useQueryClient();
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
    queryFn: () => base44.auth.me(),
  });

  // Fetch all user conversations filtered by active context
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['assistantConversations', user?.active_context, user?.active_company_id],
    queryFn: async () => {
      const allConversations = await base44.agents.listConversations({ agent_name: "edilsync_assistant" });
      // Filter conversations by active context
      const currentContext = user?.active_context || 'personal';
      const currentCompanyId = user?.active_company_id || null;
      
      return allConversations.filter(conv => {
        const convContext = conv.metadata?.context || 'personal';
        const convCompanyId = conv.metadata?.company_id || null;
        
        if (currentContext === 'personal') {
          return convContext === 'personal';
        } else {
          return convContext === 'company' && convCompanyId === currentCompanyId;
        }
      });
    },
    enabled: !!user && isOpen,
    staleTime: 0,
  });

  // Delete conversation mutation - tracks deleted IDs in localStorage
  const deleteConversationMutation = useMutation({
    mutationFn: async (convId) => {
      const deletedIds = JSON.parse(localStorage.getItem('deleted_conversations') || '[]');
      deletedIds.push(convId);
      localStorage.setItem('deleted_conversations', JSON.stringify(deletedIds));
      return convId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistantConversations'] });
      toast.success('Chat eliminata');
    },
  });

  // Get deleted conversation IDs from localStorage
  const getDeletedConversationIds = () => {
    return JSON.parse(localStorage.getItem('deleted_conversations') || '[]');
  };

  // Load or create conversation when opening
  useEffect(() => {
    const initConversation = async () => {
      if (!isOpen || !user) return;
      
      try {
        // Check localStorage for last conversation ID
        const lastConvId = localStorage.getItem('assistant_conversation_id');
        
        // Filter out deleted conversations (from localStorage)
        const deletedIds = getDeletedConversationIds();
        const activeConversations = conversations.filter(c => !deletedIds.includes(c.id));
        
        if (lastConvId && activeConversations.find(c => c.id === lastConvId)) {
          // Load last conversation
          const conv = await base44.agents.getConversation(lastConvId);
          setConversationId(conv.id);
          setMessages(conv.messages || []);
        } else if (activeConversations.length > 0) {
          // Load most recent conversation
          const latestConv = activeConversations.sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
          )[0];
          const conv = await base44.agents.getConversation(latestConv.id);
          setConversationId(conv.id);
          setMessages(conv.messages || []);
          localStorage.setItem('assistant_conversation_id', conv.id);
        } else {
          // Create new conversation with context info
          const conv = await base44.agents.createConversation({
            agent_name: "edilsync_assistant",
            metadata: {
              name: `Chat ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`,
              context: user?.active_context || 'personal',
              company_id: user?.active_company_id || null,
            }
          });
          setConversationId(conv.id);
          setMessages(conv.messages || []);
          localStorage.setItem('assistant_conversation_id', conv.id);
          refetchConversations();
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        toast.error('Errore durante l\'inizializzazione');
      }
    };

    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen, user, conversationId, conversations, refetchConversations]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages);
      setIsLoading(data.messages[data.messages.length - 1]?.role === 'user');
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Auto-scroll to bottom when messages change or sheet opens
  useEffect(() => {
    if (isOpen && !showConversations && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen, showConversations]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'it-IT';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Errore nel riconoscimento vocale');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleSendMessage = async (messageText) => {
    if (!conversationId || (!messageText && !input.trim())) return;

    const textToSend = messageText || input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const conversation = { id: conversationId, messages };
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: textToSend,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Errore durante l\'invio del messaggio');
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      toast.error('Il riconoscimento vocale non è supportato dal tuo browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('In ascolto...');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "edilsync_assistant",
        metadata: {
          name: `Chat ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`,
          context: user?.active_context || 'personal',
          company_id: user?.active_company_id || null,
        }
      });
      setConversationId(conv.id);
      setMessages([]);
      localStorage.setItem('assistant_conversation_id', conv.id);
      setShowConversations(false);
      refetchConversations();
      toast.success('Nuova chat avviata');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Errore nella creazione della chat');
    }
  };

  const handleLoadConversation = async (convId) => {
    try {
      const conv = await base44.agents.getConversation(convId);
      setConversationId(conv.id);
      setMessages(conv.messages || []);
      localStorage.setItem('assistant_conversation_id', conv.id);
      setShowConversations(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Errore nel caricamento della chat');
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (convId === conversationId) {
      // If deleting current conversation, create a new one
      setConversationId(null);
      setMessages([]);
      localStorage.removeItem('assistant_conversation_id');
    }
    await deleteConversationMutation.mutateAsync(convId);
  };

  const deletedIds = getDeletedConversationIds();
  const activeConversations = conversations.filter(c => !deletedIds.includes(c.id)).sort((a, b) => 
    new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
  );

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-[#ef6144] to-orange-600 hover:from-[#ef6144]/90 hover:to-orange-600/90 z-50",
          className
        )}
        size="icon"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ef6144] to-orange-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-lg">Assistente AI</SheetTitle>
                <p className="text-xs text-gray-500">Sempre qui per aiutarti</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConversations(!showConversations)}
                  title="Storico chat"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  title="Nuova chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Conversations List */}
            {showConversations ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Le tue chat</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConversations(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {activeConversations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Nessuna chat disponibile</p>
                  ) : (
                    activeConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          conv.id === conversationId
                            ? "bg-[#ef6144]/10 border-[#ef6144]"
                            : "hover:bg-gray-50 border-gray-200"
                        )}
                        onClick={() => handleLoadConversation(conv.id)}
                      >
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conv.metadata?.name || 'Chat senza titolo'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(conv.updated_date || conv.created_date), 'dd/MM/yyyy HH:mm', { locale: it })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
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
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-[#ef6144]/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-[#ef6144]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ciao! Sono qui per aiutarti
                  </h3>
                  <p className="text-sm text-gray-500">
                    Posso aiutarti con progetti, task, eventi e molto altro. Chiedi pure!
                  </p>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <MessageBubble key={idx} message={message} />
                ))
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Sto pensando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

                {/* Suggested Messages */}
                {messages.length === 0 && (
                  <div className="border-t border-gray-200 p-4">
                    <SuggestedMessages onSelectMessage={handleSendMessage} />
                  </div>
                )}

                {/* Input */}
                <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scrivi un messaggio..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant={isListening ? "destructive" : "outline"}
                    onClick={toggleVoiceInput}
                    disabled={isLoading}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
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
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}