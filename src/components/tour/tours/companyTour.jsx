
export const companyTour = {
  id: 'companies',
  steps: [
    {
      target: null,
      title: 'Benvenuto nella tua società! 🏢',
      content: 'Ti guideremo attraverso le funzionalità principali per gestire la tua società e il team.',
      placement: 'center',
    },
    {
      target: 'h1',
      title: 'Nome della Società',
      content: 'Questa è la tua società. Qui potrai gestire i membri del team, i dati aziendali e i progetti associati.',
      placement: 'bottom',
      padding: 12,
    },
    {
      target: null,
      title: 'Informazioni Società 📋',
      content: 'Nella parte superiore puoi visualizzare e modificare i dati della società: indirizzo, telefono, email e descrizione.',
      placement: 'center',
    },
    {
      target: 'h4:contains("Membri")',
      title: 'Gestisci il Team 👥',
      content: 'Nella sezione Membri puoi vedere tutti i componenti del team, invitare nuovi professionisti e gestire i ruoli.',
      placement: 'top',
      padding: 8,
    },
    {
      target: null,
      title: 'Invita Professionisti 🤝',
      content: 'Usa il pulsante "Invita" per aggiungere contractor, architetti, ingegneri e altri professionisti alla società.',
      placement: 'center',
    },
    {
      target: null,
      title: 'Società Pronta! ✅',
      content: 'Ora puoi iniziare a collaborare con il tuo team. Crea progetti a nome della società e gestisci la collaborazione!',
      placement: 'center',
    },
  ],
};
