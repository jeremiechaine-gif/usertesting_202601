/**
 * Custom Role Profiles Management
 * Handles storage, validation, and retrieval of user-created Role profiles
 */

export interface CustomPersona {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const CUSTOM_PERSONAS_STORAGE_KEY = 'pelico-custom-personas';

// Validation rules
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;
const NAME_PATTERN = /^[a-zA-ZÀ-ÿ0-9\s\-']+$/; // Letters, numbers, spaces, hyphens, apostrophes

/**
 * Validate Role profile name
 */
export function validatePersonaName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (trimmed.length < MIN_NAME_LENGTH) {
    return { valid: false, error: `Le nom doit contenir au moins ${MIN_NAME_LENGTH} caractères` };
  }
  
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères` };
  }
  
  if (!NAME_PATTERN.test(trimmed)) {
    return { valid: false, error: 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets et apostrophes' };
  }
  
  return { valid: true };
}

/**
 * Check if a Role profile name already exists (case-insensitive)
 */
export function personaNameExists(name: string, excludeId?: string): boolean {
  const customPersonas = getCustomPersonas();
  const normalizedName = name.trim().toLowerCase();
  
  return customPersonas.some(
    persona => persona.id !== excludeId && persona.name.toLowerCase() === normalizedName
  );
}

/**
 * Get all custom Role profiles
 */
export function getCustomPersonas(): CustomPersona[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CUSTOM_PERSONAS_STORAGE_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored) as CustomPersona[];
  } catch (error) {
    console.error('Error reading custom personas:', error);
    return [];
  }
}

/**
 * Create a new custom Role profile
 */
export function createCustomPersona(name: string, description?: string): CustomPersona {
  const validation = validatePersonaName(name);
  if (!validation.valid) {
    throw new Error(validation.error || 'Nom invalide');
  }
  
  const trimmedName = name.trim();
  
  if (personaNameExists(trimmedName)) {
    throw new Error('Un Role profile avec ce nom existe déjà');
  }
  
  const customPersonas = getCustomPersonas();
  const newPersona: CustomPersona = {
    id: `custom-persona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: trimmedName,
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  customPersonas.push(newPersona);
  localStorage.setItem(CUSTOM_PERSONAS_STORAGE_KEY, JSON.stringify(customPersonas));
  
  return newPersona;
}

/**
 * Update an existing custom persona
 */
export function updateCustomPersona(id: string, name: string, description?: string): CustomPersona {
  const validation = validatePersonaName(name);
  if (!validation.valid) {
    throw new Error(validation.error || 'Nom invalide');
  }
  
  const trimmedName = name.trim();
  
  if (personaNameExists(trimmedName, id)) {
    throw new Error('Un Role profile avec ce nom existe déjà');
  }
  
  const customPersonas = getCustomPersonas();
  const index = customPersonas.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('Role profile introuvable');
  }
  
  customPersonas[index] = {
    ...customPersonas[index],
    name: trimmedName,
    description: description?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(CUSTOM_PERSONAS_STORAGE_KEY, JSON.stringify(customPersonas));
  
  return customPersonas[index];
}

/**
 * Delete a custom Role profile
 */
export function deleteCustomPersona(id: string): void {
  const customPersonas = getCustomPersonas();
  const filtered = customPersonas.filter(p => p.id !== id);
  localStorage.setItem(CUSTOM_PERSONAS_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get all available Role profiles (predefined + custom)
 * Returns Role profile names as strings (for UI display)
 */
export function getAllAvailablePersonas(): string[] {
  // Predefined Role profiles (French names as used in UI)
  const predefinedPersonas = [
    'Approvisionneur',
    'Acheteur',
    'Manager Appro',
    'Ordonnanceur Assemblage',
    'Ordonnanceur',
    'Master Planner',
    'Support Logistique',
    'Recette',
    'Responsable Supply Chain',
    'Directeur Supply Chain',
    'Responsable Ordo & Support log',
    'Autre / Mixte',
  ];
  
  const customPersonas = getCustomPersonas();
  const customPersonaNames = customPersonas.map(p => p.name);
  
  return [...predefinedPersonas, ...customPersonaNames];
}

/**
 * Clear all custom Role profiles (used in reset)
 */
export function clearCustomPersonas(): void {
  localStorage.removeItem(CUSTOM_PERSONAS_STORAGE_KEY);
}
