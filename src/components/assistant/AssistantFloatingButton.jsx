import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles, Send, Mic, MicOff, Loader2, MessageSquare, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "@/components/assistant/MessageBubble";
import SuggestedMessages from "@/components/assistant/SuggestedMessages";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AssistantFloatingButton({ className }) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Initialize conversation when sheet opens
  useEffect(() => {
    const initConversation = async () => {
      if (!isOpen || conversationId || !user) return;
      
      try {
        const conv = await base44.agents.createConversation({
          agent_name: "edilsync_assistant",
          metadata: {
            name: "Assistente EdilSync",
            description: "Conversazione con l'assistente AI",
          }
        });
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        toast.error('Errore durante l\'inizializzazione dell\'assistente');
      }
    };

    if (isOpen) {
      initConversation();
    }
  }, [isOpen, user, conversationId]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages);
      setIsLoading(data.messages[data.messages.length - 1]?.role === 'user');
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col min-h-0">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}