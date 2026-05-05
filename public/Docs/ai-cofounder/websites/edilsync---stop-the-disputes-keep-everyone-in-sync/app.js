// Translations
const translations = {
    en: {
        'nav.home': 'Home',
        'nav.benefits': 'Benefits',
        'nav.features': 'Features',
        'nav.faq': 'FAQ',
        'nav.cta': 'Get early access',
        'hero.badge': 'Built for residential contractors',
        'hero.headline1': 'Stop the disputes.',
        'hero.headline2': 'Keep everyone in sync.',
        'hero.description1': 'EdilSync documents every decision, task, and change so you\'re protected from disputes - while keeping homeowners and subcontractors aligned in one place.',
        'hero.description2': 'No more "I thought you said" arguments.',
        'hero.cta1': 'Get early access',
        'hero.cta2': 'See how it works',
        'hero.survey': 'Help us with a 1-minute survey',
        'benefits.title': 'Why contractors trust EdilSync',
        'benefits.subtitle': 'Built by a contractor who lost €2,000 to a dispute. Never again.',
        'benefits.1.title': 'Stop the disputes',
        'benefits.1.description': 'Every task, photo, and change request is timestamped and documented. No more "I thought you said" arguments that eat into your margins.',
        'benefits.2.title': 'Save time',
        'benefits.2.description': 'No more endless WhatsApp threads or status update calls. Everything is in one place - tasks, messages, appointments, and photos.',
        'benefits.3.title': 'Build trust',
        'benefits.3.description': 'Homeowners see real-time progress through your work photos and updates - without you doing extra reporting. Self-protection creates transparency.',
        'features.1.title': 'One timeline, zero confusion',
        'features.1.description1': 'Every update, photo, task change, and approval appears in a single activity feed. Everyone sees the same story - no more "he said, she said" disputes.',
        'features.1.description2': 'The activity feed automatically timestamps everything, creating an indisputable record of what happened and when.',
        'features.2.title': 'Document to protect yourself',
        'features.2.description1': 'Take photos as you always do - before/after shots, work progress, issues found. They automatically appear in the homeowner\'s timeline and create proof if disputes arise.',
        'features.2.description2': 'Your self-protection becomes their peace of mind. No extra effort, just tap and upload from your phone on-site.',
        'features.3.title': 'No more scope creep',
        'features.3.description1': 'When the homeowner asks for "just one small thing," create a change request with cost and time impact. They approve or discuss - everything documented.',
        'features.3.description2': 'Stops the $200 arguments that damage relationships and eat your 3-5% margins. Every change is clear, approved, and timestamped.',
        'cta.title': 'Stop losing money on disputes',
        'cta.description': 'Join the waitlist and be among the first contractors to protect your margins while building trust with homeowners.',
        'cta.button': 'Join the Waitlist',
        'signup.title': 'Get Early Access',
        'signup.description': 'Be the first to know when EdilSync launches. No spam, just updates.',
        'signup.placeholder': 'your.email@example.com',
        'signup.button': 'Join Waitlist',
        'signup.submitting': 'Joining...',
        'signup.success': 'Thanks! You\'re on the waitlist. We\'ll be in touch soon.',
        'signup.error': 'Something went wrong. Please try again.',
        'signup.error.email': 'Please enter your email address.',
        'signup.error.connection': 'Connection error. Please check your internet and try again.',
        'footer.copyright': '© 2025 EdilSync. Built for contractors who value their margins.',
        'tagline': 'Created with builders and contractors in mind',
        // Hero cards
        'hero.card1.status.progress': 'In Progress',
        'hero.card1.status.kitchen': 'Kitchen',
        'hero.card1.due': 'Due Dec 5',
        'hero.card1.title': 'Install Kitchen Cabinets & Countertops',
        'hero.card1.description': 'Marble countertops delivered yesterday. Ready to install after plumbing inspection is complete.',
        'hero.card1.assigned': 'Assigned to Michele',
        'hero.card1.progress': 'Progress',
        'hero.card1.task1': 'Cabinet installation',
        'hero.card1.task2': 'Countertop setup',
        'hero.card1.photos': 'photos',
        'hero.card1.messages': 'messages',
        'hero.card2.role': 'Plumber',
        'hero.card2.chat': 'Chat',
        'hero.card2.tasks': 'Tasks',
        'hero.card2.thisweek': 'This week',
        'hero.card2.ontime': 'On time',
        'hero.card2.recentphotos': 'Recent Photos',
        'hero.card2.photo1.name': 'Pipe installation.jpg',
        'hero.card2.photo1.time': 'Today, 10:24 AM',
        'hero.card2.photo2.name': 'Kitchen sink setup.jpg',
        'hero.card2.photo2.time': 'Yesterday, 3:15 PM',
        'hero.card2.project': 'Project: Villa Rossi Remodel',
        'hero.card2.overallprogress': 'Overall Progress',
        // Activity feed
        'activity.title': 'Project Activity',
        'activity.1.action': 'Michele updated task status',
        'activity.1.detail': '"Kitchen cabinets" marked as Complete',
        'activity.1.time': 'Today at 2:34 PM',
        'activity.2.action': 'Paolo uploaded 3 photos',
        'activity.2.detail': 'Bathroom plumbing installation',
        'activity.2.time': 'Today at 11:15 AM',
        'activity.3.action': 'Matteo approved change request',
        'activity.3.detail': 'Additional electrical outlet - €85',
        'activity.3.time': 'Yesterday at 6:20 PM',
        'activity.4.action': 'Michele marked task as blocked',
        'activity.4.detail': 'Tile installation - waiting for delivery',
        'activity.4.time': 'Yesterday at 3:45 PM',
        // Photos section
        'photos.caption': 'All photos timestamped & organized by task',
        // Change request
        'changerequest.status': 'Pending Approval',
        'changerequest.date': 'Nov 24, 2025',
        'changerequest.title': 'Additional Electrical Outlet',
        'changerequest.description': 'Client requested extra outlet behind TV in living room. Requires additional wiring and drywall work.',
        'changerequest.cost': 'Additional cost:',
        'changerequest.time': 'Additional time:',
        'changerequest.hours': 'hours',
        'changerequest.approve': 'Approve',
        'changerequest.discuss': 'Discuss',
        // FAQ
        'faq.title': 'Frequently Asked Questions',
        'faq.subtitle': 'Everything you need to know about EdilSync',
        'faq.q1': 'How does EdilSync protect me from disputes?',
        'faq.a1': 'EdilSync automatically documents every task, photo, decision, and change request with timestamps. This creates a clear paper trail that protects you if a client claims "you never told me that" or "I didn\'t approve this." Everything is recorded and accessible in one place.',
        'faq.q2': 'Will my subcontractors actually use this?',
        'faq.a2': 'Yes. EdilSync is designed to be simpler than WhatsApp. Subcontractors can update tasks and upload photos directly from their phone in seconds. No complicated features, no training needed. Many contractors tell us their subs prefer EdilSync because they always know exactly what to do next.',
        'faq.q3': 'How is this different from project management tools like Procore or CoConstruct?',
        'faq.a3': 'Those tools are built for large commercial projects and cost €300-500/month. EdilSync is specifically designed for residential contractors and small remodeling businesses. It\'s 10x simpler, costs a fraction of the price, and focuses on the #1 problem: preventing disputes while keeping everyone aligned. You\'ll be up and running in minutes, not weeks.',
        'faq.q4': 'Can homeowners see everything in the system?',
        'faq.a4': 'You control what homeowners see. You can give them view-only access to track progress, photos, and approved changes - which keeps them happy and reduces "what\'s happening with my project?" calls. But your internal notes, costs, and team communications stay private.',
        'faq.q5': 'How much does EdilSync cost?',
        'faq.a5': 'We\'re finalizing pricing, but it will be affordable for contractors of all sizes - significantly less than enterprise tools. Early access members will get special launch pricing. One prevented dispute will pay for years of EdilSync.',
        'faq.q6': 'When will EdilSync be available?',
        'faq.a6': 'We\'re launching in early 2026. Join the waitlist to be among the first to get access and lock in special early pricing. We\'re working directly with contractors to make sure EdilSync solves real problems from day one.'
    },
    it: {
        'nav.home': 'Home',
        'nav.benefits': 'Vantaggi',
        'nav.features': 'Funzionalità',
        'nav.faq': 'FAQ',
        'nav.cta': 'Accesso anticipato',
        'hero.badge': 'Progettato per imprese edili residenziali',
        'hero.headline1': 'Stop alle controversie.',
        'hero.headline2': 'Mantieni tutti sincronizzati.',
        'hero.description1': 'EdilSync documenta ogni decisione, attività e modifica per proteggerti dalle controversie - mantenendo proprietari e subappaltatori allineati in un unico posto.',
        'hero.description2': 'Basta con le discussioni "pensavo avessi detto".',
        'hero.cta1': 'Accesso anticipato',
        'hero.cta2': 'Guarda come funziona',
        'hero.survey': 'Aiutaci con un sondaggio di 1 minuto',
        'benefits.title': 'Perché gli impresari si fidano di EdilSync',
        'benefits.subtitle': 'Creato da un impresario che ha perso €2.000 per una controversia. Mai più.',
        'benefits.1.title': 'Ferma le controversie',
        'benefits.1.description': 'Ogni attività, foto e richiesta di modifica è registrata con data e ora. Basta con le discussioni "pensavo avessi detto" che erodono i tuoi margini.',
        'benefits.2.title': 'Risparmia tempo',
        'benefits.2.description': 'Basta con i thread WhatsApp infiniti o le chiamate di aggiornamento. Tutto è in un unico posto - attività, messaggi, appuntamenti e foto.',
        'benefits.3.title': 'Costruisci fiducia',
        'benefits.3.description': 'I proprietari vedono i progressi in tempo reale attraverso le tue foto e aggiornamenti - senza che tu debba fare report extra. L\'auto-protezione crea trasparenza.',
        'features.1.title': 'Una timeline, zero confusione',
        'features.1.description1': 'Ogni aggiornamento, foto, modifica di attività e approvazione appare in un unico feed di attività. Tutti vedono la stessa storia - basta con "lui ha detto, lei ha detto".',
        'features.1.description2': 'Il feed di attività registra automaticamente tutto con data e ora, creando un record indiscutibile di cosa è successo e quando.',
        'features.2.title': 'Documenta per proteggerti',
        'features.2.description1': 'Scatta foto come fai sempre - prima/dopo, progressi del lavoro, problemi trovati. Appaiono automaticamente nella timeline del proprietario e creano prove se sorgono controversie.',
        'features.2.description2': 'La tua auto-protezione diventa la loro tranquillità. Nessuno sforzo extra, basta toccare e caricare dal tuo telefono in cantiere.',
        'features.3.title': 'Basta con lo scope creep',
        'features.3.description1': 'Quando il proprietario chiede "solo una piccola cosa", crea una richiesta di modifica con l\'impatto su costi e tempi. Approvano o discutono - tutto documentato.',
        'features.3.description2': 'Ferma le discussioni da €200 che danneggiano le relazioni ed erodono i tuoi margini del 3-5%. Ogni modifica è chiara, approvata e registrata.',
        'cta.title': 'Smetti di perdere soldi per le controversie',
        'cta.description': 'Iscriviti alla lista d\'attesa e sii tra i primi impresari a proteggere i tuoi margini costruendo fiducia con i proprietari.',
        'cta.button': 'Iscriviti alla Lista d\'Attesa',
        'signup.title': 'Ottieni l\'Accesso Anticipato',
        'signup.description': 'Sii il primo a sapere quando EdilSync sarà lanciato. Niente spam, solo aggiornamenti.',
        'signup.placeholder': 'tua.email@esempio.com',
        'signup.button': 'Iscriviti',
        'signup.submitting': 'Iscrizione...',
        'signup.success': 'Grazie! Sei nella lista d\'attesa. Ti contatteremo presto.',
        'signup.error': 'Qualcosa è andato storto. Riprova.',
        'signup.error.email': 'Inserisci il tuo indirizzo email.',
        'signup.error.connection': 'Errore di connessione. Controlla la tua connessione internet e riprova.',
        'footer.copyright': '© 2025 EdilSync. Progettato per impresari che valorizzano i loro margini.',
        'tagline': 'Creato pensando a costruttori e impresari',
        // Hero cards
        'hero.card1.status.progress': 'In Corso',
        'hero.card1.status.kitchen': 'Cucina',
        'hero.card1.due': 'Scadenza 5 Dic',
        'hero.card1.title': 'Installazione Mobili e Piani Cucina',
        'hero.card1.description': 'Piani in marmo consegnati ieri. Pronti per l\'installazione dopo l\'ispezione idraulica.',
        'hero.card1.assigned': 'Assegnato a Michele',
        'hero.card1.progress': 'Progresso',
        'hero.card1.task1': 'Installazione mobili',
        'hero.card1.task2': 'Montaggio piano',
        'hero.card1.photos': 'foto',
        'hero.card1.messages': 'messaggi',
        'hero.card2.role': 'Idraulico',
        'hero.card2.chat': 'Chat',
        'hero.card2.tasks': 'Attività',
        'hero.card2.thisweek': 'Questa settimana',
        'hero.card2.ontime': 'In orario',
        'hero.card2.recentphotos': 'Foto Recenti',
        'hero.card2.photo1.name': 'Installazione tubature.jpg',
        'hero.card2.photo1.time': 'Oggi, 10:24',
        'hero.card2.photo2.name': 'Montaggio lavello cucina.jpg',
        'hero.card2.photo2.time': 'Ieri, 15:15',
        'hero.card2.project': 'Progetto: Ristrutturazione Villa Rossi',
        'hero.card2.overallprogress': 'Progresso Totale',
        // Activity feed
        'activity.title': 'Attività Progetto',
        'activity.1.action': 'Michele ha aggiornato lo stato',
        'activity.1.detail': '"Mobili cucina" completato',
        'activity.1.time': 'Oggi alle 14:34',
        'activity.2.action': 'Paolo ha caricato 3 foto',
        'activity.2.detail': 'Installazione impianto idraulico bagno',
        'activity.2.time': 'Oggi alle 11:15',
        'activity.3.action': 'Matteo ha approvato richiesta',
        'activity.3.detail': 'Presa elettrica aggiuntiva - €85',
        'activity.3.time': 'Ieri alle 18:20',
        'activity.4.action': 'Michele ha segnalato blocco',
        'activity.4.detail': 'Installazione piastrelle - in attesa consegna',
        'activity.4.time': 'Ieri alle 15:45',
        // Photos section
        'photos.caption': 'Tutte le foto con data e ora, organizzate per attività',
        // Change request
        'changerequest.status': 'In Attesa di Approvazione',
        'changerequest.date': '24 Nov 2025',
        'changerequest.title': 'Presa Elettrica Aggiuntiva',
        'changerequest.description': 'Cliente ha richiesto presa extra dietro TV in soggiorno. Richiede cablaggio aggiuntivo e lavoro su cartongesso.',
        'changerequest.cost': 'Costo aggiuntivo:',
        'changerequest.time': 'Tempo aggiuntivo:',
        'changerequest.hours': 'ore',
        'changerequest.approve': 'Approva',
        'changerequest.discuss': 'Discuti',
        // FAQ
        'faq.title': 'Domande Frequenti',
        'faq.subtitle': 'Tutto quello che devi sapere su EdilSync',
        'faq.q1': 'Come mi protegge EdilSync dalle controversie?',
        'faq.a1': 'EdilSync documenta automaticamente ogni attività, foto, decisione e richiesta di modifica con data e ora. Questo crea un registro chiaro che ti protegge se un cliente afferma "non me l\'hai mai detto" o "non l\'ho approvato". Tutto è registrato e accessibile in un unico posto.',
        'faq.q2': 'I miei subappaltatori lo useranno davvero?',
        'faq.a2': 'Sì. EdilSync è progettato per essere più semplice di WhatsApp. I subappaltatori possono aggiornare attività e caricare foto direttamente dal telefono in pochi secondi. Nessuna funzione complicata, nessuna formazione necessaria. Molti impresari ci dicono che i loro subs preferiscono EdilSync perché sanno sempre esattamente cosa fare.',
        'faq.q3': 'Che differenza c\'è con strumenti di project management come Procore o CoConstruct?',
        'faq.a3': 'Quegli strumenti sono progettati per grandi progetti commerciali e costano €300-500/mese. EdilSync è specificamente progettato per impresari residenziali e piccole imprese di ristrutturazione. È 10 volte più semplice, costa una frazione del prezzo e si concentra sul problema #1: prevenire le controversie mantenendo tutti allineati. Sarai operativo in pochi minuti, non settimane.',
        'faq.q4': 'I proprietari possono vedere tutto nel sistema?',
        'faq.a4': 'Controlli tu cosa vedono i proprietari. Puoi dare loro accesso in sola lettura per seguire i progressi, le foto e le modifiche approvate - il che li mantiene contenti e riduce le chiamate "cosa sta succedendo con il mio progetto?". Ma le tue note interne, i costi e le comunicazioni del team rimangono privati.',
        'faq.q5': 'Quanto costa EdilSync?',
        'faq.a5': 'Stiamo finalizzando i prezzi, ma sarà accessibile per impresari di tutte le dimensioni - significativamente meno degli strumenti enterprise. I membri con accesso anticipato riceveranno prezzi speciali di lancio. Una sola controversia evitata pagherà anni di EdilSync.',
        'faq.q6': 'Quando sarà disponibile EdilSync?',
        'faq.a6': 'Lanceremo all\'inizio del 2026. Iscriviti alla lista d\'attesa per essere tra i primi ad avere accesso e bloccare i prezzi speciali di lancio. Stiamo lavorando direttamente con gli impresari per assicurarci che EdilSync risolva problemi reali fin dal primo giorno.'
    }
};

// Language switching
let currentLanguage = localStorage.getItem('language') || 'en';

function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    const emailInput = document.getElementById('emailInput');
    if (emailInput && translations[lang]['signup.placeholder']) {
        emailInput.placeholder = translations[lang]['signup.placeholder'];
    }
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

// Email capture form handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
        languageSelector.value = currentLanguage;
        updateLanguage(currentLanguage);
        
        languageSelector.addEventListener('change', function() {
            updateLanguage(this.value);
        });
    }
    const form = document.getElementById('emailForm');
    const emailInput = document.getElementById('emailInput');
    const formMessage = document.getElementById('formMessage');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            if (!email) {
                showMessage(translations[currentLanguage]['signup.error.email'], 'error');
                return;
            }

            // Disable form while submitting
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = translations[currentLanguage]['signup.submitting'];

            try {
                const response = await fetch('https://aicofounder.com/api/website/e919c7d1-15a8-4503-a012-10ff84d45f8b/capture-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showMessage(translations[currentLanguage]['signup.success'], 'success');
                    emailInput.value = '';
                } else {
                    showMessage(data.message || translations[currentLanguage]['signup.error'], 'error');
                }
            } catch (error) {
                showMessage(translations[currentLanguage]['signup.error.connection'], 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `mt-4 text-center text-sm ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
        formMessage.classList.remove('hidden');
        
        // Hide message after 5 seconds
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000);
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') {
                return;
            }
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const navHeight = 80; // Height of fixed navigation
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // FAQ Accordion functionality
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('.faq-icon');
            const isOpen = !answer.classList.contains('hidden');
            
            // Close all other FAQs
            document.querySelectorAll('.faq-answer').forEach(otherAnswer => {
                if (otherAnswer !== answer) {
                    otherAnswer.classList.add('hidden');
                }
            });
            
            document.querySelectorAll('.faq-icon').forEach(otherIcon => {
                if (otherIcon !== icon) {
                    otherIcon.classList.remove('rotate-180');
                }
            });
            
            // Toggle current FAQ
            if (isOpen) {
                answer.classList.add('hidden');
                icon.classList.remove('rotate-180');
            } else {
                answer.classList.remove('hidden');
                icon.classList.add('rotate-180');
            }
        });
    });
});
