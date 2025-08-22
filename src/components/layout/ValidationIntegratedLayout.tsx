import { ValidationProvider } from '@/contexts/ValidationContext'
import { ValidationPanel } from '@/components/document/ValidationPanel'
import { useAutoValidation } from '@/hooks/useAutoValidation'

interface ValidationIntegratedLayoutProps {
  children: React.ReactNode
}

const AutoValidationSetup = () => {
  // Set up auto-validation with reasonable defaults
  useAutoValidation({
    enabled: true,
    debounceMs: 1500,
    triggerOnMount: true
  })
  
  return null
}

export const ValidationIntegratedLayout = ({ children }: ValidationIntegratedLayoutProps) => {
  return (
    <ValidationProvider>
      <AutoValidationSetup />
      {children}
      <ValidationPanel />
    </ValidationProvider>
  )
}