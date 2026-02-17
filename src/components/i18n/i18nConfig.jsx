import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const itTranslations = {
  "common": {
    "yes": "Sì",
    "no": "No",
    "ok": "OK",
    "cancel": "Annulla",
    "save": "Salva",
    "delete": "Elimina",
    "edit": "Modifica",
    "close": "Chiudi",
    "loading": "Caricamento...",
    "error": "Errore",
    "success": "Successo",
    "confirm": "Conferma",
    "search": "Cerca...",
    "add": "Aggiungi",
    "create": "Crea",
    "update": "Aggiorna",
    "remove": "Rimuovi",
    "back": "Indietro",
    "next": "Avanti",
    "previous": "Precedente",
    "more": "Altro",
    "noData": "Nessun dato disponibile",
    "selectLanguage": "Seleziona Lingua",
    "newProject": "Nuovo Progetto",
    "newCompany": "Nuova Società",
    "projects": "Progetti",
    "companies": "Società",
    "members": "Membri",
    "seeAll": "Vedi tutti",
    "all": "Tutti",
    "noResults": "Nessun risultato",
    "tryModifyingFilters": "Prova a modificare i filtri di ricerca.",
    "tryModifyingSearchTerms": "Prova a modificare i termini di ricerca.",
    "searchProjects": "Cerca progetti...",
    "searchCompanies": "Cerca società..."
  },
  "navigation": {
    "dashboard": "Dashboard",
    "projects": "Progetti",
    "companies": "Società",
    "calendar": "Calendario",
    "settings": "Impostazioni",
    "logout": "Esci",
    "systemDashboard": "Dashboard di Sistema"
  },
  "header": {
    "notifications": "Notifiche",
    "messaging": "Messaggi",
    "contextSwitcher": "Seleziona Contesto",
    "profile": "Profilo",
    "personalContext": "Personale",
    "companyContext": "Azienda"
  },
  "footer": {
    "privacy": "Privacy Policy",
    "terms": "Termini di Servizio",
    "cookies": "Cookie Policy",
    "copyright": "© 2026 EdilSync. Tutti i diritti riservati."
  },
  "dashboard": {
    "welcome": "Benvenuto",
    "projectStats": "Statistiche Progetti",
    "totalProjects": "Progetti Totali",
    "recentProjects": "Progetti Recenti",
    "viewAll": "Visualizza Tutto",
    "noProjects": "Nessun progetto",
    "noPersonalProjects": "Non hai ancora progetti personali. Crea il tuo primo cantiere.",
    "noCompanyProjects": "Questa società non ha ancora progetti. Crea il primo cantiere.",
    "greetingPrefix": "Ciao,",
    "workingAs": "Stai operando come",
    "yourCompanies": "Le tue Società",
    "noCompanies": "Nessuna società",
    "noCompaniesDescription": "Non fai parte di nessuna società. Creane una o attendi un invito."
  },
  "projects": {
    "title": "Progetti",
    "filter": "Filtra",
    "participants": "Partecipanti",
    "tasks": "Task",
    "noProjects": "Nessun progetto trovato",
    "status": {
      "planning": "Pianificazione",
      "in_progress": "In corso",
      "completed": "Completati",
      "on_hold": "In Sospeso"
    }
  },
  "companies": {
    "title": "Società",
    "members": "Membri",
    "admin": "Amministratore",
    "member": "Membro",
    "noCompanies": "Nessuna società disponibile",
    "manageCompanies": "Gestisci le società di cui fai parte"
  },
  "tasks": {
    "task": "Task",
    "tasks": "Task",
    "newTask": "Nuovo Task",
    "status": "Stato",
    "notStarted": "Non Iniziato",
    "inProgress": "In Corso",
    "completed": "Completato",
    "blocked": "Bloccato",
    "assignee": "Assegnato a",
    "dueDate": "Data di Scadenza",
    "noTasks": "Nessun task disponibile"
  },
  "milestones": {
    "milestone": "Milestone",
    "milestones": "Milestone",
    "newMilestone": "Nuova Milestone",
    "status": "Stato",
    "pending": "In Sospeso",
    "inProgress": "In Corso",
    "completed": "Completata",
    "delayed": "In Ritardo",
    "targetDate": "Data Target",
    "completionDate": "Data Completamento"
  },
  "calendar": {
    "title": "Calendario",
    "newEvent": "Nuovo Evento",
    "today": "Oggi"
  },
  "events": {
    "event": "Evento",
    "events": "Eventi",
    "calendar": "Calendario",
    "title": "Titolo",
    "startTime": "Orario Inizio",
    "endTime": "Orario Fine",
    "participants": "Partecipanti",
    "location": "Luogo",
    "noEvents": "Nessun evento disponibile"
  },
  "messages": {
    "messages": "Messaggi",
    "newMessage": "Nuovo Messaggio",
    "channels": "Canali",
    "general": "Generale",
    "typing": "sta scrivendo...",
    "noMessages": "Nessun messaggio"
  },
  "documents": {
    "document": "Documento",
    "documents": "Documenti",
    "upload": "Carica",
    "download": "Scarica",
    "file": "File",
    "category": "Categoria",
    "uploadedBy": "Caricato da",
    "noDocuments": "Nessun documento disponibile"
  },
  "changeRequests": {
    "changeRequest": "Change Request",
    "changeRequests": "Change Request",
    "newChangeRequest": "Nuovo Change Request",
    "status": "Stato",
    "pending": "In Sospeso",
    "approved": "Approvato",
    "rejected": "Rifiutato",
    "clarificationNeeded": "Chiarimento Necessario",
    "costImpact": "Impatto Costo",
    "timeImpact": "Impatto Tempo"
  },
  "assistant": {
    "title": "Assistente AI",
    "subtitle": "Sempre qui per aiutarti",
    "placeholder": "Scrivi un messaggio...",
    "newChat": "Nuova chat",
    "chatHistory": "Storico chat",
    "noChats": "Nessuna chat disponibile",
    "listening": "In ascolto...",
    "thinking": "Sto pensando...",
    "greeting": "Ciao! Sono qui per aiutarti",
    "greetingSubtitle": "Posso aiutarti con progetti, task, eventi e molto altro. Chiedi pure!",
    "whatsapp": "Apri su WhatsApp",
    "chatDeleted": "Chat eliminata"
  },
  "notifications": {
    "notifications": "Notifiche",
    "noNotifications": "Nessuna notifica",
    "markAsRead": "Segna come letto",
    "markAllAsRead": "Segna tutto come letto"
  },
  "settings": {
    "settings": "Impostazioni",
    "language": "Lingua",
    "theme": "Tema",
    "notifications": "Notifiche",
    "privacy": "Privacy",
    "account": "Account"
  },
  "errors": {
    "unauthorized": "Non autorizzato",
    "notFound": "Non trovato",
    "serverError": "Errore del server",
    "networkError": "Errore di rete",
    "loadingError": "Errore durante il caricamento"
  },
  "dates": {
    "today": "Oggi",
    "yesterday": "Ieri",
    "tomorrow": "Domani",
    "thisWeek": "Questa settimana",
    "thisMonth": "Questo mese"
  },
  "tour": {
    "dashboard": "Questo è il tuo dashboard. Qui vedi una panoramica dei tuoi progetti.",
    "projects": "Gestisci tutti i tuoi progetti edilizi da questa sezione.",
    "calendar": "Pianifica e traccia gli eventi del tuo progetto.",
    "companies": "Gestisci le tue società e i membri del team.",
    "contextSwitcher": "Passa tra il contesto personale e aziendale.",
    "notifications": "Ricevi notifiche su tutte le attività importanti.",
    "messaging": "Comunica con il tuo team tramite messaggi.",
    "assistant": "Chiedi al nostro assistente AI per aiuto."
  }
};

const enTranslations = {
  "common": {
    "yes": "Yes",
    "no": "No",
    "ok": "OK",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "confirm": "Confirm",
    "search": "Search...",
    "add": "Add",
    "create": "Create",
    "update": "Update",
    "remove": "Remove",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "more": "More",
    "noData": "No data available",
    "selectLanguage": "Select Language"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "projects": "Projects",
    "companies": "Companies",
    "calendar": "Calendar",
    "settings": "Settings",
    "logout": "Logout",
    "systemDashboard": "System Dashboard"
  },
  "header": {
    "notifications": "Notifications",
    "messaging": "Messaging",
    "contextSwitcher": "Select Context",
    "profile": "Profile",
    "personalContext": "Personal",
    "companyContext": "Company"
  },
  "footer": {
    "privacy": "Privacy Policy",
    "terms": "Terms of Service",
    "cookies": "Cookie Policy",
    "copyright": "© 2026 EdilSync. All rights reserved."
  },
  "dashboard": {
    "welcome": "Welcome",
    "newProject": "New Project",
    "projectStats": "Project Statistics",
    "totalProjects": "Total Projects",
    "inProgress": "In Progress",
    "completed": "Completed",
    "companies": "Companies",
    "members": "Members",
    "recentProjects": "Recent Projects",
    "viewAll": "View All",
    "noProjects": "No projects available"
  },
  "projects": {
    "title": "Projects",
    "newProject": "New Project",
    "filter": "Filter",
    "all": "All",
    "planning": "Planning",
    "inProgress": "In Progress",
    "completed": "Completed",
    "onHold": "On Hold",
    "participants": "Participants",
    "tasks": "Tasks",
    "noProjects": "No projects found"
  },
  "companies": {
    "title": "Companies",
    "newCompany": "New Company",
    "members": "Members",
    "admin": "Administrator",
    "member": "Member",
    "noCompanies": "No companies available"
  },
  "tasks": {
    "task": "Task",
    "tasks": "Tasks",
    "newTask": "New Task",
    "status": "Status",
    "notStarted": "Not Started",
    "inProgress": "In Progress",
    "completed": "Completed",
    "blocked": "Blocked",
    "assignee": "Assigned to",
    "dueDate": "Due Date",
    "noTasks": "No tasks available"
  },
  "milestones": {
    "milestone": "Milestone",
    "milestones": "Milestones",
    "newMilestone": "New Milestone",
    "status": "Status",
    "pending": "Pending",
    "inProgress": "In Progress",
    "completed": "Completed",
    "delayed": "Delayed",
    "targetDate": "Target Date",
    "completionDate": "Completion Date"
  },
  "events": {
    "event": "Event",
    "events": "Events",
    "newEvent": "New Event",
    "calendar": "Calendar",
    "title": "Title",
    "startTime": "Start Time",
    "endTime": "End Time",
    "participants": "Participants",
    "location": "Location",
    "noEvents": "No events available"
  },
  "messages": {
    "messages": "Messages",
    "newMessage": "New Message",
    "channels": "Channels",
    "general": "General",
    "typing": "is typing...",
    "noMessages": "No messages"
  },
  "documents": {
    "document": "Document",
    "documents": "Documents",
    "upload": "Upload",
    "download": "Download",
    "file": "File",
    "category": "Category",
    "uploadedBy": "Uploaded by",
    "noDocuments": "No documents available"
  },
  "changeRequests": {
    "changeRequest": "Change Request",
    "changeRequests": "Change Requests",
    "newChangeRequest": "New Change Request",
    "status": "Status",
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected",
    "clarificationNeeded": "Clarification Needed",
    "costImpact": "Cost Impact",
    "timeImpact": "Time Impact"
  },
  "assistant": {
    "title": "AI Assistant",
    "subtitle": "Always here to help",
    "placeholder": "Write a message...",
    "newChat": "New chat",
    "chatHistory": "Chat History",
    "noChats": "No chats available",
    "listening": "Listening...",
    "thinking": "Thinking...",
    "greeting": "Hi! I'm here to help",
    "greetingSubtitle": "I can help you with projects, tasks, events and much more. Just ask!",
    "whatsapp": "Open on WhatsApp",
    "chatDeleted": "Chat deleted"
  },
  "notifications": {
    "notifications": "Notifications",
    "noNotifications": "No notifications",
    "markAsRead": "Mark as read",
    "markAllAsRead": "Mark all as read"
  },
  "settings": {
    "settings": "Settings",
    "language": "Language",
    "theme": "Theme",
    "notifications": "Notifications",
    "privacy": "Privacy",
    "account": "Account"
  },
  "errors": {
    "unauthorized": "Unauthorized",
    "notFound": "Not found",
    "serverError": "Server error",
    "networkError": "Network error",
    "loadingError": "Error loading data"
  },
  "dates": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "thisWeek": "This week",
    "thisMonth": "This month"
  },
  "tour": {
    "dashboard": "This is your dashboard. Here you see an overview of your projects.",
    "projects": "Manage all your construction projects from this section.",
    "calendar": "Plan and track your project events.",
    "companies": "Manage your companies and team members.",
    "contextSwitcher": "Switch between personal and company contexts.",
    "notifications": "Receive notifications on all important activities.",
    "messaging": "Communicate with your team via messages.",
    "assistant": "Ask our AI assistant for help."
  }
};

const resources = {
  it: { translation: itTranslations },
  en: { translation: enTranslations },
};

export const initializeI18n = () => {
  if (i18next.isInitialized) return;

  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'it',
      ns: ['translation'],
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
};

export default i18next;