/**
 * Create User Modal Component
 * Modal for creating a new user
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
import { createUser } from '@/lib/users';
import { cn } from '@/lib/utils';
import { AlertCircle, UserPlus } from 'lucide-react';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (userId: string) => void;
  defaultTeamId?: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onOpenChange,
  onUserCreated,
  defaultTeamId,
}) => {
  const [firstName, setFirstName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFirstName('');
      setName('');
      setEmail('');
      setError(null);
    }
  }, [open]);

  // Validate form in real-time
  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    if (firstName.trim() && name.trim() && email.trim()) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Veuillez saisir une adresse email valide');
        return;
      }
      setError(null);
    } else {
      setError(null);
    }
  }, [firstName, name, email, open]);

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setError('Le prénom est requis');
      return;
    }

    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (!email.trim()) {
      setError('L\'email est requis');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine firstName and name for the full name
      const fullName = `${firstName.trim()} ${name.trim()}`.trim();
      const newUser = createUser({
        name: fullName,
        email: email.trim(),
        role: 'user',
        teamId: defaultTeamId || null,
      });
      onUserCreated(newUser.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!error && firstName.trim() && name.trim() && email.trim()) {
        handleSubmit();
      }
    }
  };

  const canSubmit = firstName.trim().length > 0 && name.trim().length > 0 && email.trim().length > 0 && !error && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#2063F0]" />
            Créer un nouvel utilisateur
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouvel utilisateur au système. Il sera disponible pour être assigné aux équipes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* First Name (Required) */}
          <div className="space-y-2">
            <Label htmlFor="user-firstname" className="text-sm font-semibold">
              Prénom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-firstname"
              placeholder="Ex: Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(error && 'border-destructive')}
              autoFocus
            />
          </div>

          {/* Name (Required) */}
          <div className="space-y-2">
            <Label htmlFor="user-name" className="text-sm font-semibold">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-name"
              placeholder="Ex: Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(error && 'border-destructive')}
            />
          </div>

          {/* Email (Required) */}
          <div className="space-y-2">
            <Label htmlFor="user-email" className="text-sm font-semibold">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              placeholder="Ex: jean.dupont@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(error && 'border-destructive')}
            />
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
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
            {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
