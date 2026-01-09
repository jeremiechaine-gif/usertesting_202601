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
import { createUser } from '@/lib/users';
import { cn } from '@/lib/utils';
import { AlertCircle, Upload, FileSpreadsheet, X, CheckCircle2, Loader2 } from 'lucide-react';
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
  email: string;
  rowNumber: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setIsDragging(false);
    setParsedMembers([]);
    setError(null);
    setIsProcessing(false);
    setIsImporting(false);
  }, []);

  // Reset when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
            reject(new Error('File must contain at least a header row and one data row'));
            return;
          }

          // Find column indices (case-insensitive, flexible matching)
          const headerRow = jsonData[0].map((cell: any) => String(cell || '').toLowerCase().trim());
          
          const nameIndex = headerRow.findIndex((h: string) => 
            h.includes('name') && !h.includes('first') && !h.includes('last')
          );
          const firstNameIndex = headerRow.findIndex((h: string) => 
            h.includes('first') || h.includes('prénom') || h.includes('prenom')
          );
          const emailIndex = headerRow.findIndex((h: string) => 
            h.includes('email') || h.includes('mail')
          );

          if (nameIndex === -1 && firstNameIndex === -1) {
            reject(new Error('File must contain a "Name" or "First name" column'));
            return;
          }

          if (emailIndex === -1) {
            reject(new Error('File must contain an "Email" column'));
            return;
          }

          // Parse rows
          const members: ParsedMember[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const name = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
            const firstName = firstNameIndex !== -1 ? String(row[firstNameIndex] || '').trim() : '';
            const email = String(row[emailIndex] || '').trim().toLowerCase();

            // Skip empty rows
            if (!name && !firstName && !email) {
              continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
              continue; // Skip invalid emails
            }

            // Combine name and firstName if both exist, otherwise use whichever is available
            const fullName = name || firstName || email.split('@')[0];
            const finalFirstName = firstName || name.split(' ')[0] || email.split('@')[0];

            members.push({
              name: fullName,
              firstName: finalFirstName,
              email,
              rowNumber: i + 1,
            });
          }

          if (members.length === 0) {
            reject(new Error('No valid members found in the file. Please check the format and ensure columns are named correctly.'));
            return;
          }

          resolve(members);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse Excel file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
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
      setError('Please select an Excel file (.xlsx, .xls) or CSV file');
      setIsProcessing(false);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`);
      setIsProcessing(false);
      return;
    }

    setFile(selectedFile);

    try {
      const members = await parseExcelFile(selectedFile);
      setParsedMembers(members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
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
    if (parsedMembers.length === 0) {
      setError('No members to import');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const userIds: string[] = [];
      const errors: string[] = [];

      for (const member of parsedMembers) {
        try {
          const newUser = createUser({
            name: member.name,
            email: member.email,
            role: 'user',
            teamId: defaultTeamId || null,
          });
          userIds.push(newUser.id);
        } catch (err) {
          errors.push(`Row ${member.rowNumber}: ${err instanceof Error ? err.message : 'Failed to create user'}`);
        }
      }

      if (userIds.length === 0) {
        setError('Failed to import any members. ' + (errors[0] || ''));
        setIsImporting(false);
        return;
      }

      if (errors.length > 0) {
        setError(`Imported ${userIds.length} members. ${errors.length} failed: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`);
      }

      onMembersImported(userIds);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import members');
    } finally {
      setIsImporting(false);
    }
  };

  const canImport = parsedMembers.length > 0 && !isProcessing && !isImporting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#2063F0]" />
            Import members from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx, .xls) or CSV file with columns: Name (or First name), Email
          </DialogDescription>
        </DialogHeader>

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
                    Drag and drop your file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#2063F0] hover:underline font-semibold"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: Excel (.xlsx, .xls) or CSV
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-8 w-8 text-[#2063F0] animate-spin" />
                    <p className="text-sm font-medium">Processing file...</p>
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
                        Found <span className="font-semibold text-foreground">{parsedMembers.length}</span> member{parsedMembers.length !== 1 ? 's' : ''} ready to import
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

          {/* File Information */}
          {file && parsedMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File Information
              </p>
              <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File type:</span>
                  <span className="font-medium">{getFileType(file)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File size:</span>
                  <span className="font-medium">{formatFileSize(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members found:</span>
                  <span className="font-medium">{parsedMembers.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
            </div>
          )}

          {/* Preview (first 5 members) */}
          {parsedMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Preview ({Math.min(5, parsedMembers.length)} of {parsedMembers.length})
              </p>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                <div className="divide-y divide-border">
                  {parsedMembers.slice(0, 5).map((member, index) => (
                    <div key={index} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          Row {member.rowNumber}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing || isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport}
            className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${parsedMembers.length} member${parsedMembers.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
