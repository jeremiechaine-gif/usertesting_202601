/**
 * Create Role Profile Modal Component
 * Modal for creating a new custom Role profile
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCustomPersona, validatePersonaName, personaNameExists } from '@/lib/personas';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface CreatePersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonaCreated: (personaName: string) => void;
}

export const CreatePersonaModal: React.FC<CreatePersonaModalProps> = ({
  open,
  onOpenChange,
  onPersonaCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setError(null);
    }
  }, [open]);

  // Validate name in real-time
  useEffect(() => {
    if (!open || !name.trim()) {
      setError(null);
      return;
    }

    const validation = validatePersonaName(name);
    if (!validation.valid) {
      setError(validation.error || 'Nom invalide');
      return;
    }

    if (personaNameExists(name)) {
      setError('Un Role profile avec ce nom existe déjà');
      return;
    }

    setError(null);
  }, [name, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    const validation = validatePersonaName(name);
    if (!validation.valid) {
      setError(validation.error || 'Nom invalide');
      return;
    }

    if (personaNameExists(name)) {
      setError('Un Role profile avec ce nom existe déjà');
      return;
    }

    setIsSubmitting(true);
    try {
      createCustomPersona(name.trim(), description.trim() || undefined);
      onPersonaCreated(name.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du Role profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!error && name.trim()) {
        handleSubmit();
      }
    }
  };

  const canSubmit = name.trim().length > 0 && !error && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau Role profile</DialogTitle>
          <DialogDescription>
            Créez un Role profile personnalisé pour mieux organiser vos équipes et routines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name (Required) */}
          <div className="space-y-2">
            <Label htmlFor="role-profile-name" className="text-sm font-semibold">
              Nom du Role profile <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-profile-name"
              placeholder="Ex: Gestionnaire de stock"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(error && 'border-destructive')}
              autoFocus
            />
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="role-profile-description" className="text-sm font-semibold">
              Description <span className="text-muted-foreground font-normal">(optionnelle)</span>
            </Label>
            <Textarea
              id="role-profile-description"
              placeholder="Décrivez le rôle et les responsabilités de ce Role profile..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Création...' : 'Créer le Role profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
