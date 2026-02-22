import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, CheckCircle2, Camera, FileEdit, Zap } from 'lucide-react';

const QUICK_ACTIONS = [
  {
    key: 'message',
    label: 'Nuovo messaggio',
    description: 'Apri la chat del progetto',
    section: 'messaggi',
    icon: MessageSquare,
  },
  {
    key: 'task',
    label: 'Aggiungi attività',
    description: 'Inserisci una nuova attività',
    section: 'attivita',
    icon: CheckCircle2,
  },
  {
    key: 'photo',
    label: 'Carica foto',
    description: 'Apri documenti e carica una foto',
    section: 'documenti',
    icon: Camera,
  },
  {
    key: 'change',
    label: 'Nuova richiesta',
    description: 'Aggiungi una richiesta di modifica',
    section: 'richieste',
    icon: FileEdit,
  },
];

export default function EssentialQuickActions({ projects = [], currentProjectId = null }) {
  const navigate = useNavigate();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects],
  );

  if (!projects.length) return null;

  const openActionOnProject = (projectId, action) => {
    if (!projectId || !action) return;
    navigate(`/essenziale/progetti/${projectId}/${action.section}`);
  };

  const handleActionClick = (action) => {
    setActionsOpen(false);

    if (currentProjectId) {
      openActionOnProject(currentProjectId, action);
      return;
    }

    if (projects.length === 1) {
      openActionOnProject(projects[0].id, action);
      return;
    }

    setPendingAction(action);
    setProjectSelectOpen(true);
  };

  const handleProjectSelect = (projectId) => {
    setProjectSelectOpen(false);
    openActionOnProject(projectId, pendingAction);
    setPendingAction(null);
  };

  return (
    <>
      <Button
        onClick={() => setActionsOpen(true)}
        className="fixed bottom-6 right-5 h-14 w-14 rounded-full bg-[#ef6144] hover:bg-[#d9553a] text-white shadow-lg z-50"
        title="Operazioni rapide"
      >
        <Zap className="h-6 w-6" />
      </Button>

      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Operazioni rapide</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleActionClick(action)}
                  className="w-full rounded-xl border border-[#ef6144]/20 bg-white p-4 text-left shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#ef6144]/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#ef6144]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{action.label}</p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={projectSelectOpen}
        onOpenChange={(open) => {
          setProjectSelectOpen(open);
          if (!open) setPendingAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleziona progetto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleProjectSelect(project.id)}
                className="w-full rounded-xl border border-[#ef6144]/20 bg-white p-4 text-left shadow-sm"
              >
                <p className="font-semibold text-gray-900">{project.name}</p>
                <p className="text-sm text-gray-600 mt-1">{project.address}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
