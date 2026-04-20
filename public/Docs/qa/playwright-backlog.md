# Playwright Backlog

Questa lista raccoglie i test browser da implementare contro frontend locale + backend `qa`.

## Obiettivo del layer

- validare i journey reali dell'utente
- verificare routing, contesti, gating, side effects visibili e regressioni cross-domain
- coprire app autenticata, area operativa, public site e web admin

## Smoke pack minimo

1. render schermata auth
2. login con utente QA runtime
3. creazione societa da UI
4. creazione progetto personale da UI
5. navigazione base authenticated app

## Regression pack da implementare

### Auth e contesti

1. login fallito mostra errore corretto
2. logout torna ad auth
3. sessione persistita al reload
4. cambio contesto personale -> societa
5. cambio societa attiva
6. utente personale bloccato in `/app/operativa`

### Company flows

7. create company mostra General channel e stato piano free
8. admin societa vede billing tab
9. member societa non vede billing tab
10. invito membro societa da UI
11. utente invitato vede la societa dopo attivazione

### Project flows

12. create project personale
13. create project societario contractor
14. contractor invita homeowner in creazione progetto
15. participant list aggiornata
16. duplicate homeowner bloccato
17. duplicate participant bloccato

### Pricing e gating

18. company free vede chat limited
19. company free vede documents limited
20. company free non vede time tracking pieno
21. project free non vede finance
22. project free non vede milestone premium
23. paid company vede feature complete
24. sponsor loss blocca superfici premium del progetto
25. sponsor loss limita inviti a company only

### Billing e notifiche

26. CTA upgrade apre checkout
27. billing portal apre sessione corretta
28. manual sync aggiorna stato billing
29. notifica `company_plan_*` naviga a Company Detail
30. notifica `project_sponsorship_*` naviga a Project Detail
31. notifica `message_mention` naviga alla chat di progetto
32. notifica `event_*` naviga al contesto corretto

### Task, milestone, dispute, calendar

33. create task con assignee user
34. create task con assignee company
35. change task status
36. block task con motivo
37. milestone create se entitled
38. link/unlink task a milestone
39. create event con partecipanti
40. update event
41. cancel event
42. dispute create da progetto
43. dispute create da task bloccato
44. dispute comment e change status

### Messaging, documenti, BIM

45. create project channel
46. create company channel
47. send message
48. mention user e artefatti
49. upload document
50. preview documento
51. comment documento
52. apertura viewer BIM o visualizzazione gate premium

### Finance, time tracking, operativa

53. homeowner vede finance in sola lettura dove consentito
54. admin societa vede finance completa
55. member societa con permessi insufficienti vede blocco corretto
56. clock in/out o creazione work session
57. day summary mostra task ed eventi del giorno
58. company workspace operativo carica correttamente
59. project workspace operativo carica correttamente

### Settings, public, admin

60. update profilo
61. toggle notification preferences
62. switch lingua
63. pricing page IT coerente con modello reale
64. pricing page EN coerente con modello reale
65. contact form valida e invia
66. demo request valida e invia
67. web admin access per admin
68. web admin denial per utente normale

## Regole di implementazione

1. Separare `smoke` da `regression` per criticita e durata.
2. Usare page objects per auth, navigation, company, project, billing, notifications e public site.
3. Le attese devono basarsi su segnali di stato reali, non su timeout arbitrari.
4. Ogni spec deve dichiarare gli `Scenario ID` coperti.