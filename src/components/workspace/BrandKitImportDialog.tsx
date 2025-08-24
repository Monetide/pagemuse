import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Loader2, 
  Palette, 
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
  Image
} from 'lucide-react';
import { parseImportFile, importBrandKit, checkBrandKitNameExists } from '@/lib/brand-kit-import';
import { validateBrandKitImport } from '@/lib/brand-kit-export';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceActivity } from '@/hooks/useWorkspaceActivity';
import { toast } from 'sonner';
import type { BrandKitExport, ImportValidationResult, AccessibilityIssue } from '@/lib/brand-kit-export';

interface BrandKitImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export const BrandKitImportDialog = ({
  open,
  onOpenChange,
  onImportSuccess
}: BrandKitImportDialogProps) => {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuth();
  const { logActivity } = useWorkspaceActivity();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'validate' | 'configure' | 'importing'>('upload');
  const [importData, setImportData] = useState<BrandKitExport | null>(null);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [customName, setCustomName] = useState('');
  const [importLogos, setImportLogos] = useState(true);
  const [overrideAccessibility, setOverrideAccessibility] = useState(false);
  const [nameExists, setNameExists] = useState(false);

  const resetDialog = () => {
    setStep('upload');
    setImportData(null);
    setValidation(null);
    setCustomName('');
    setImportLogos(true);
    setOverrideAccessibility(false);
    setNameExists(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    try {
      const { data, error } = await parseImportFile(file);
      
      if (error || !data) {
        toast.error(error || 'Failed to parse import file');
        return;
      }

      setImportData(data);
      setCustomName(data.brand_kit.name);
      
      // Validate the import
      const validationResult = validateBrandKitImport(data);
      setValidation(validationResult);
      
      setStep('validate');
    } catch (error) {
      toast.error('Failed to process import file');
    }
  };

  const handleNameChange = async (newName: string) => {
    setCustomName(newName);
    
    if (newName && currentWorkspace) {
      const exists = await checkBrandKitNameExists(newName, currentWorkspace.id);
      setNameExists(exists);
    } else {
      setNameExists(false);
    }
  };

  const proceedToConfiguration = () => {
    if (!validation?.valid) {
      const hasAccessibilityErrors = validation?.accessibility_issues.some(issue => issue.severity === 'error');
      if (hasAccessibilityErrors && !overrideAccessibility) {
        return; // Block if there are AA failures and user hasn't confirmed override
      }
    }
    
    setStep('configure');
  };

  const handleImport = async () => {
    if (!importData || !currentWorkspace || !user) return;

    setStep('importing');

    try {
      const finalName = customName || importData.brand_kit.name;
      
      const result = await importBrandKit(importData, currentWorkspace.id, user.id, {
        overrideAccessibilityWarnings: overrideAccessibility,
        newName: finalName,
        importLogos,
      });

      if (result.success) {
        // Log import activity
        await logActivity(
          'brand_kit_imported',
          `Imported brand kit "${finalName}" from external source`,
          {
            brand_kit_id: result.brandKitId,
            brand_kit_name: finalName,
            source_workspace: importData.metadata.exported_from_workspace,
            import_options: {
              imported_logos: importLogos,
              overrode_accessibility: overrideAccessibility,
            },
            original_export_date: importData.metadata.created_at,
            accessibility_warnings_count: validation?.accessibility_issues.length || 0,
          }
        );

        toast.success('Brand kit imported successfully');
        onImportSuccess();
        onOpenChange(false);
        resetDialog();
      } else {
        toast.error(result.errors.join(', ') || 'Import failed');
        setStep('configure');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed');
      setStep('configure');
    }
  };

  const renderAccessibilityIssue = (issue: AccessibilityIssue) => (
    <div key={`${issue.type}-${issue.message}`} className="flex items-start gap-2 p-2 rounded bg-muted/50">
      {issue.severity === 'error' ? (
        <XCircle className="w-4 h-4 text-destructive mt-0.5" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">
          {issue.message}
        </p>
        {issue.colors && (
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-3 h-3 rounded border"
              style={{ backgroundColor: issue.colors.foreground }}
              title={`Foreground: ${issue.colors.foreground}`}
            />
            <span className="text-xs text-muted-foreground">on</span>
            <div 
              className="w-3 h-3 rounded border"
              style={{ backgroundColor: issue.colors.background }}
              title={`Background: ${issue.colors.background}`}
            />
            <Badge variant="outline" className="text-xs">
              {issue.colors.contrast_ratio.toFixed(2)}:1
            </Badge>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetDialog(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Brand Kit
          </DialogTitle>
          <DialogDescription>
            Import a brand kit from another workspace or external source
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Select Import File</CardTitle>
                <CardDescription className="text-xs">
                  Choose a brand kit export file (.json)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Drop your brand kit file here</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse for a .json file
                  </p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Validation */}
        {step === 'validate' && importData && validation && (
          <div className="space-y-4">
            {/* Brand Kit Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  {importData.brand_kit.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Exported from {importData.metadata.exported_from_workspace} • {new Date(importData.exported_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {Object.entries({...importData.brand_kit.palette, ...importData.brand_kit.neutrals}).map(([key, color]) => (
                    <div key={key} className="text-center">
                      <div 
                        className="w-6 h-6 rounded border shadow-sm"
                        style={{ backgroundColor: color as string }}
                        title={`${key}: ${color}`}
                      />
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {key}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Validation */}
                <div className="flex items-center gap-2">
                  {validation.valid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-sm font-medium">
                    {validation.valid ? 'Valid brand kit format' : 'Invalid brand kit format'}
                  </span>
                </div>

                {/* Errors */}
                {validation.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-destructive">Errors</Label>
                    {validation.errors.map((error, index) => (
                      <Alert key={index} className="border-destructive/20">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Accessibility Issues */}
                {validation.accessibility_issues.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-warning">
                        Accessibility Issues ({validation.accessibility_issues.length})
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        WCAG AA
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {validation.accessibility_issues.map(renderAccessibilityIssue)}
                    </div>

                    {validation.accessibility_issues.some(issue => issue.severity === 'error') && (
                      <div className="space-y-2">
                        <Alert className="border-destructive/20">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            This brand kit has colors that fail WCAG AA accessibility standards. 
                            Importing may create accessibility issues in your documents.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="override-accessibility"
                            checked={overrideAccessibility}
                            onCheckedChange={(checked) => setOverrideAccessibility(checked === true)}
                          />
                          <Label htmlFor="override-accessibility" className="text-sm">
                            I understand the accessibility risks and want to proceed anyway
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-warning">Warnings</Label>
                    {validation.warnings.map((warning, index) => (
                      <Alert key={index} className="border-warning/20">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Configuration */}
        {step === 'configure' && importData && (
          <div className="space-y-4">
            {/* Name Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Import Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-kit-name">Brand Kit Name</Label>
                  <Input
                    id="brand-kit-name"
                    value={customName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter brand kit name"
                  />
                  {nameExists && (
                    <p className="text-sm text-destructive">
                      A brand kit with this name already exists in this workspace
                    </p>
                  )}
                </div>

                {(importData.logos.primary || importData.logos.alt) && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="import-logos"
                        checked={importLogos}
                        onCheckedChange={(checked) => setImportLogos(checked === true)}
                      />
                      <Label htmlFor="import-logos" className="text-sm">
                        Import logo files
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {importData.logos.primary && 'Primary logo'}
                      {importData.logos.primary && importData.logos.alt && ' and '}
                      {importData.logos.alt && 'Alt logo'} will be uploaded to your workspace
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="font-medium mb-2">Importing Brand Kit</h3>
            <p className="text-sm text-muted-foreground">
              Creating brand kit and uploading assets...
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          
          {step === 'validate' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={proceedToConfiguration}
                disabled={!validation?.valid || (validation.accessibility_issues.some(issue => issue.severity === 'error') && !overrideAccessibility)}
              >
                Continue
              </Button>
            </>
          )}
          
          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={() => setStep('validate')}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!customName || nameExists}
              >
                Import Brand Kit
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};