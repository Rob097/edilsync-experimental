const enterProjectSection = (navigateToSection, tab, section) => () => {
  navigateToSection?.(tab, section);
};

export const getProjectTour = (language = 'it', options = {}) => {
  const {
    navigateToSection,
    isBlockedProject = false,
    canInvite = false,
    showFinanceSection = false,
    showQuickActions = false,
  } = options;

  if (language === 'it') {
    return {
      id: 'projects',
      steps: [
        {
          target: null,
          title: 'Benvenuto nel tuo cantiere',
          content: 'Ti facciamo vedere dove seguire lavori, documenti, chat, squadra e costi del cantiere.',
          placement: 'center',
        },
        {
          target: '[data-tour="project-header"]',
          title: 'Nome del Cantiere',
          content: 'Questa è la scheda del cantiere. Da qui entri in tutte le aree operative.',
          placement: 'bottom',
          padding: 12,
        },
        {
          target: '[data-tour="project-tabs"]',
          title: 'Sezioni del Cantiere',
          content: 'Queste schede dividono il cantiere per area: riepilogo, lavori e informazioni di squadra.',
          placement: 'bottom',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, isBlockedProject ? 'info' : 'cantiere'),
        },
        !isBlockedProject ? {
          target: '[data-tour="project-overview-panel"]',
          title: 'Quadro del cantiere',
          content: 'Qui vedi subito cosa richiede attenzione: attività aperte, varianti, scadenze e punti da controllare.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'cantiere'),
        } : null,
        !isBlockedProject ? {
          target: '#section-tasks',
          title: 'Attività del cantiere',
          content: 'Qui organizzi le attività del cantiere: chi deve farle, entro quando e a che punto sono.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'lavori', 'tasks'),
        } : null,
        !isBlockedProject ? {
          target: '#section-changes',
          title: 'Varianti e extra',
          content: 'Qui gestisci richieste di modifica ed extra, così restano tracciati con tempi e impatto economico.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'lavori', 'changes'),
        } : null,
        !isBlockedProject ? {
          target: '#section-disputes',
          title: 'Contestazioni',
          content: 'Qui tieni traccia di contestazioni e blocchi, con storico e documenti collegati.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'lavori', 'disputes'),
        } : null,
        !isBlockedProject ? {
          target: '#section-milestones',
          title: 'Fasi del lavoro',
          content: 'Qui dividi il lavoro in fasi, così capisci meglio cosa è chiuso e cosa è ancora da completare.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'lavori', 'milestones'),
        } : null,
        !isBlockedProject ? {
          target: '#section-chat',
          title: 'Chat del cantiere',
          content: 'Qui parli con le persone coinvolte nel cantiere senza mischiare i messaggi con altre attività.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'info', 'chat'),
        } : null,
        !isBlockedProject ? {
          target: '#section-documents',
          title: 'Documenti di cantiere',
          content: 'Qui tieni foto, allegati e documenti del cantiere, tutti nello stesso posto.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'info', 'documents'),
        } : null,
        showFinanceSection && !isBlockedProject ? {
          target: '#section-finance',
          title: 'Economia di cantiere',
          content: 'Qui controlli budget, costi e SAL del cantiere senza uscire dal progetto.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'info', 'finance'),
        } : null,
        {
          target: '#section-participants',
          title: 'Squadra e partecipanti',
          content: isBlockedProject
            ? 'Se il cantiere è bloccato perché manca la sponsorship, da qui vedi chi è coinvolto e riparti con gli inviti giusti.'
            : 'Qui vedi chi partecipa al cantiere, con che ruolo e se l\'invito è già stato accettato.',
          placement: 'top',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'info', 'participants'),
        },
        canInvite ? {
          target: '[data-tour="project-invite-button"]',
          title: 'Invita persone o imprese',
          content: isBlockedProject
            ? 'Se devi ripristinare la sponsorship, da qui inviti la società giusta direttamente nel punto corretto.'
            : 'Da qui inviti persone o imprese nel cantiere, senza uscire da questa pagina.',
          placement: 'left',
          padding: 8,
          onEnter: enterProjectSection(navigateToSection, 'info', 'participants'),
        } : null,
        showQuickActions && !isBlockedProject ? {
          target: '[data-tour="project-quick-actions-trigger"]',
          title: 'Azioni rapide',
          content: 'Qui trovi scorciatoie per le azioni più usate, in base a quello che puoi fare nel cantiere.',
          placement: 'left',
          padding: 12,
        } : null,
        {
          target: null,
          title: 'Pronto a partire',
          content: 'Adesso puoi invitare la squadra, creare attività e iniziare a organizzare il cantiere. Buon lavoro.',
          placement: 'center',
        },
      ].filter(Boolean),
    };
  }

  return {
    id: 'projects',
    steps: [
      {
        target: null,
        title: 'Welcome to your worksite',
        content: 'We will show you where to follow work, documents, chat, team, and costs for this worksite.',
        placement: 'center',
      },
      {
        target: '[data-tour="project-header"]',
        title: 'Worksite Name',
        content: 'This is the main worksite page. From here you open every operational area.',
        placement: 'bottom',
        padding: 12,
      },
      {
        target: '[data-tour="project-tabs"]',
        title: 'Worksite Sections',
        content: 'These tabs split the worksite into clear areas: overview, work, and team information.',
        placement: 'bottom',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, isBlockedProject ? 'info' : 'cantiere'),
      },
      !isBlockedProject ? {
        target: '[data-tour="project-overview-panel"]',
        title: 'Worksite overview',
        content: 'See right away what needs attention: open activities, changes, deadlines, and key points to check.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'cantiere'),
      } : null,
      !isBlockedProject ? {
        target: '#section-tasks',
        title: 'Worksite activities',
        content: 'Organize worksite activities here: who has to do them, by when, and what stage they are at.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'lavori', 'tasks'),
      } : null,
      !isBlockedProject ? {
        target: '#section-changes',
        title: 'Changes and extras',
        content: 'Manage change requests and extras here so they stay tracked with timing and cost impact.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'lavori', 'changes'),
      } : null,
      !isBlockedProject ? {
        target: '#section-disputes',
        title: 'Disputes',
        content: 'Track disputes and blockers here, with history and linked documents.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'lavori', 'disputes'),
      } : null,
      !isBlockedProject ? {
        target: '#section-milestones',
        title: 'Work phases',
        content: 'Split the job into phases so it is easier to see what is done and what is still open.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'lavori', 'milestones'),
      } : null,
      !isBlockedProject ? {
        target: '#section-chat',
        title: 'Worksite chat',
        content: 'Talk with the people involved in this worksite without mixing messages with other work.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'info', 'chat'),
      } : null,
      !isBlockedProject ? {
        target: '#section-documents',
        title: 'Worksite documents',
        content: 'Keep photos, attachments, and worksite documents together here.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'info', 'documents'),
      } : null,
      showFinanceSection && !isBlockedProject ? {
        target: '#section-finance',
        title: 'Worksite finance',
        content: 'Check budget, costs, and progress statements here without leaving the project.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'info', 'finance'),
      } : null,
      {
        target: '#section-participants',
        title: 'Team and participants',
        content: isBlockedProject
          ? 'If the worksite is blocked because sponsorship is missing, start here to see who is involved and send the right invite.'
          : 'See who is part of the worksite, which role they have, and whether the invite was accepted.',
        placement: 'top',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'info', 'participants'),
      },
      canInvite ? {
        target: '[data-tour="project-invite-button"]',
        title: 'Invite people or companies',
        content: isBlockedProject
          ? 'If you need to restore sponsorship, invite the right company from here in the correct section.'
          : 'Invite people or companies into the worksite from here without leaving the page.',
        placement: 'left',
        padding: 8,
        onEnter: enterProjectSection(navigateToSection, 'info', 'participants'),
      } : null,
      showQuickActions && !isBlockedProject ? {
        target: '[data-tour="project-quick-actions-trigger"]',
        title: 'Quick actions',
        content: 'These shortcuts give you the most common actions based on what your role can do in the worksite.',
        placement: 'left',
        padding: 12,
      } : null,
      {
        target: null,
        title: 'Ready to start',
        content: 'You can now invite the team, create activities, and start organizing the worksite.',
        placement: 'center',
      },
    ].filter(Boolean),
  };
};
