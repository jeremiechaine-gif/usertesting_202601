import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginPageProps {
  onLogin: (userData: { email: string; firstName: string; lastName: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pas de validation requise - permettre la soumission même avec des champs vides
    onLogin({
      email: email.trim() || '',
      firstName: firstName.trim() || '',
      lastName: lastName.trim() || '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2063F0]/5 via-background to-[#31C7AD]/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/images/Pelico-long-logo.svg" 
            alt="Pelico" 
            className="h-12"
          />
        </div>

        {/* Login Form */}
        <div className="bg-background border border-border rounded-2xl shadow-xl p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#2063F0] to-[#31C7AD] bg-clip-text text-transparent mb-2">
              Connexion à Pelico
            </h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre espace de travail
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Nom
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email / Login
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@pelico.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-6 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white font-medium shadow-md transition-all"
            >
              Valider
            </Button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Prototype - Aucune vérification d'authentification
        </p>
      </div>
    </div>
  );
};

