/**
 * Import Members Modal Component
 * Modal for importing members from Excel file with drag and drop
 */

import React, { useState, useCallback, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createUser } from '@/lib/users';
import { cn } from '@/lib/utils';
import { AlertCircle, Upload, FileSpreadsheet, X, CheckCircle2, Loader2, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersImported: (userIds: string[]) => void;
  defaultTeamId?: string;
}

interface ParsedMember {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  rowNumber: number;
  selected: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
];

export const ImportMembersModal: React.FC<ImportMembersModalProps> = ({
  open,
  onOpenChange,
  onMembersImported,
  defaultTeamId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setIsDragging(false);
    setParsedMembers([]);
    setError(null);
    setIsProcessing(false);
    setIsImporting(false);
    setSearchQuery('');
  }, []);

  // Reset when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Octets';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileType = (file: File): string => {
    if (file.name.endsWith('.xlsx')) return 'Excel (.xlsx)';
    if (file.name.endsWith('.xls')) return 'Excel (.xls)';
    if (file.name.endsWith('.csv')) return 'CSV (.csv)';
    return file.type || 'Unknown';
  };

  const parseExcelFile = async (file: File): Promise<ParsedMember[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length < 2) {
            reject(new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données'));
            return;
          }

          // Find column indices (case-insensitive, flexible matching)
          // Prioriser les termes français pour une meilleure détection
          const headerRow = jsonData[0].map((cell: any) => String(cell || '').toLowerCase().trim());
          
          // Chercher d'abord "prénom"/"prenom" exactement (priorité haute)
          let firstNameIndex = headerRow.findIndex((h: string) => 
            h === 'prénom' || h === 'prenom'
          );
          // Si pas trouvé, chercher les variantes anglaises exactes
          if (firstNameIndex === -1) {
            firstNameIndex = headerRow.findIndex((h: string) => 
              h === 'firstname' || h === 'first name'
            );
          }
          // Dernier recours : includes mais exclure "nom" pour éviter confusion
          if (firstNameIndex === -1) {
            firstNameIndex = headerRow.findIndex((h: string) => 
              (h.includes('prénom') || h.includes('prenom') || h.includes('first')) 
              && h !== 'nom' && !h.includes('nom')
            );
          }
          
          // Chercher "nom" exactement (PAS "prénom" ou "prenom")
          // IMPORTANT: Chercher "nom" seulement si ce n'est PAS "prénom" ou "prenom"
          let lastNameIndex = -1;
          // D'abord, chercher "nom" exact
          const nomExactIndex = headerRow.findIndex((h: string) => h === 'nom');
          if (nomExactIndex !== -1) {
            // Vérifier que ce n'est pas "prénom" ou "prenom" (ne devrait pas arriver mais sécurité)
            const headerValue = String(jsonData[0][nomExactIndex] || '').toLowerCase().trim();
            if (headerValue === 'nom') {
              lastNameIndex = nomExactIndex;
            }
          }
          
          // Si pas trouvé, chercher les variantes anglaises exactes
          if (lastNameIndex === -1) {
            lastNameIndex = headerRow.findIndex((h: string) => 
              h === 'lastname' || h === 'last name' || h === 'surname'
            );
          }
          
          // Dernier recours : includes mais exclure explicitement "prénom" et "prenom"
          if (lastNameIndex === -1) {
            // Parcourir manuellement pour éviter toute confusion avec "prenom"
            for (let idx = 0; idx < headerRow.length; idx++) {
              const headerValue = headerRow[idx];
              const originalValue = String(jsonData[0][idx] || '').toLowerCase().trim();
              
              // Ne JAMAIS matcher "prénom" ou "prenom"
              if (originalValue === 'prénom' || originalValue === 'prenom') continue;
              
              // Chercher "nom" exact ou "nom" au début/fin (mais pas dans "prenom")
              // Ou chercher "last"/"surname"
              const isNomExact = headerValue === 'nom';
              const isNomAtStart = headerValue.startsWith('nom') && headerValue !== 'prenom';
              const isNomAtEnd = headerValue.endsWith('nom') && !headerValue.includes('prenom');
              const hasLast = headerValue.includes('last') || headerValue.includes('surname');
              
              if ((isNomExact || isNomAtStart || isNomAtEnd || hasLast) 
                && !headerValue.includes('prénom') && !headerValue.includes('prenom') && !headerValue.includes('first')) {
                lastNameIndex = idx;
                break;
              }
            }
          }
          
          // Colonne "name" complète (si pas de séparation prénom/nom)
          const nameIndex = headerRow.findIndex((h: string) => {
            const lowerH = h.toLowerCase();
            return lowerH === 'name' && !lowerH.includes('first') && !lowerH.includes('last') && !lowerH.includes('prénom') && !lowerH.includes('prenom');
          });
          
          const emailIndex = headerRow.findIndex((h: string) => 
            h.includes('email') || h.includes('mail') || h.includes('e-mail')
          );

          if (firstNameIndex === -1 && lastNameIndex === -1 && nameIndex === -1) {
            reject(new Error('Le fichier doit contenir une colonne "Prénom" et/ou "Nom"'));
            return;
          }

          if (emailIndex === -1) {
            reject(new Error('Le fichier doit contenir une colonne "Email"'));
            return;
          }

          // Parse rows
          const members: ParsedMember[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const name = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
            const firstName = firstNameIndex !== -1 ? String(row[firstNameIndex] || '').trim() : '';
            const lastName = lastNameIndex !== -1 ? String(row[lastNameIndex] || '').trim() : '';
            const email = String(row[emailIndex] || '').trim().toLowerCase();

            // Skip empty rows
            if (!name && !firstName && !lastName && !email) {
              continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
              continue; // Skip invalid emails
            }

            // Utiliser directement les valeurs trouvées dans les colonnes
            let finalFirstName = firstName || '';
            let finalLastName = lastName || '';
            
            // Si on a une colonne "name" complète mais pas de prénom/nom séparés, essayer de la diviser
            if (name && !firstName && !lastName) {
              const nameParts = name.split(' ').filter(p => p.trim());
              if (nameParts.length >= 2) {
                finalFirstName = nameParts[0];
                finalLastName = nameParts.slice(1).join(' ');
              } else {
                finalFirstName = nameParts[0] || email.split('@')[0];
                finalLastName = '';
              }
            } 
            // Si on n'a que le prénom ou que le nom, utiliser ce qu'on a
            else if (!firstName && !lastName) {
              finalFirstName = email.split('@')[0];
              finalLastName = '';
            }

            // Construire le nom complet : Prénom + Nom
            const fullName = `${finalFirstName} ${finalLastName}`.trim() || name || email.split('@')[0];

            members.push({
              name: fullName,
              firstName: finalFirstName,
              lastName: finalLastName,
              email,
              rowNumber: i + 1,
              selected: true, // Par défaut, tous les membres sont sélectionnés
            });
          }

          if (members.length === 0) {
            reject(new Error('Aucun membre valide trouvé dans le fichier. Veuillez vérifier le format et vous assurer que les colonnes sont nommées correctement.'));
            return;
          }

          resolve(members);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Échec de l\'analyse du fichier Excel'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Échec de la lecture du fichier'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);

    // Validate file type
    const isValidType = ACCEPTED_FILE_TYPES.includes(selectedFile.type) ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls') ||
      selectedFile.name.endsWith('.csv');

    if (!isValidType) {
      setError('Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV');
      setIsProcessing(false);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`La taille du fichier dépasse la limite maximale de ${formatFileSize(MAX_FILE_SIZE)}`);
      setIsProcessing(false);
      return;
    }

    setFile(selectedFile);

    try {
      const members = await parseExcelFile(selectedFile);
      setParsedMembers(members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'analyse du fichier');
      setFile(null);
      setParsedMembers([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    const selectedMembers = parsedMembers.filter(m => m.selected);
    if (selectedMembers.length === 0) {
      setError('Aucun membre sélectionné pour l\'importation');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const userIds: string[] = [];
      const errors: string[] = [];

      for (const member of selectedMembers) {
        try {
          const newUser = createUser({
            name: member.name,
            email: member.email,
            role: 'user',
            teamId: defaultTeamId || null,
          });
          userIds.push(newUser.id);
        } catch (err) {
          errors.push(`Ligne ${member.rowNumber}: ${err instanceof Error ? err.message : 'Échec de la création de l\'utilisateur'}`);
        }
      }

      if (userIds.length === 0) {
        setError('Échec de l\'importation des membres. ' + (errors[0] || ''));
        setIsImporting(false);
        return;
      }

      if (errors.length > 0) {
        setError(`${userIds.length} membre${userIds.length > 1 ? 's' : ''} importé${userIds.length > 1 ? 's' : ''}. ${errors.length} échec${errors.length > 1 ? 's' : ''}: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`);
      }

      onMembersImported(userIds);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'importation des membres');
    } finally {
      setIsImporting(false);
    }
  };

  const selectedMembersCount = parsedMembers.filter(m => m.selected).length;
  const canImport = selectedMembersCount > 0 && !isProcessing && !isImporting;

  // Filter members based on search query
  const filteredMembers = parsedMembers.filter(member => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  const handleToggleMember = (index: number) => {
    const updatedMembers = [...parsedMembers];
    updatedMembers[index].selected = !updatedMembers[index].selected;
    setParsedMembers(updatedMembers);
  };

  const handleSelectAll = () => {
    const updatedMembers = parsedMembers.map(m => ({ ...m, selected: true }));
    setParsedMembers(updatedMembers);
  };

  const handleDeselectAll = () => {
    const updatedMembers = parsedMembers.map(m => ({ ...m, selected: false }));
    setParsedMembers(updatedMembers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#2063F0]" />
            Importer des membres depuis Excel
          </DialogTitle>
          <DialogDescription>
            Téléversez un fichier Excel (.xlsx, .xls) ou CSV avec les colonnes : Nom, Prénom, Email
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-4 py-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 transition-all',
              isDragging
                ? 'border-[#2063F0] bg-[#2063F0]/5'
                : 'border-border hover:border-[#2063F0]/50 hover:bg-muted/30',
              file && 'border-[#31C7AD] bg-[#31C7AD]/5'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!file ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-[#2063F0]/10 to-[#31C7AD]/10">
                  <FileSpreadsheet className="h-8 w-8 text-[#2063F0]" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Glissez-déposez votre fichier ici, ou{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#2063F0] hover:underline font-semibold"
                    >
                      parcourir
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formats supportés : Excel (.xlsx, .xls) ou CSV
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-8 w-8 text-[#2063F0] animate-spin" />
                    <p className="text-sm font-medium">Traitement du fichier...</p>
                  </>
                ) : parsedMembers.length > 0 ? (
                  <>
                    <div className="p-4 rounded-full bg-gradient-to-br from-[#31C7AD]/10 to-[#2063F0]/10">
                      <CheckCircle2 className="h-8 w-8 text-[#31C7AD]" />
                    </div>
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileSpreadsheet className="h-5 w-5 text-[#2063F0] shrink-0" />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getFileType(file)} • {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setFile(null);
                            setParsedMembers([]);
                            setError(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="ml-2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{parsedMembers.length}</span> membre{parsedMembers.length !== 1 ? 's' : ''} trouvé{parsedMembers.length !== 1 ? 's' : ''} prêt{parsedMembers.length !== 1 ? 's' : ''} à importer
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getFileType(file)} • {formatFileSize(file.size)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
            </div>
          )}

          {/* Members List with Search and Selection */}
          {parsedMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Membres à importer ({selectedMembersCount} sur {parsedMembers.length})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs h-7"
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="text-xs h-7"
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, prénom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {/* Members List */}
              <div className="border border-border rounded-lg">
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Aucun membre trouvé pour "{searchQuery}"
                    </div>
                  ) : (
                    filteredMembers.map((member, index) => {
                      // Find the original index in parsedMembers
                      const originalIndex = parsedMembers.findIndex(m => m.rowNumber === member.rowNumber);
                      return (
                        <div
                          key={member.rowNumber}
                          className="p-3 hover:bg-muted/50 transition-colors flex items-start gap-3"
                        >
                          <Checkbox
                            checked={member.selected}
                            onCheckedChange={() => handleToggleMember(originalIndex)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Nom</p>
                                <p className="font-medium truncate">{member.lastName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Prénom</p>
                                <p className="font-medium truncate">{member.firstName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Email</p>
                                <p className="font-medium truncate">{member.email}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 shrink-0 border-t border-border bg-background">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing || isImporting}
          >
            Annuler
          </Button>
          <Button
            variant="default"
            onClick={handleImport}
            disabled={!canImport}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importation...
              </>
            ) : (
              `Importer ${selectedMembersCount} membre${selectedMembersCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
