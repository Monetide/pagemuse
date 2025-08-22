import { useState, useEffect, useCallback } from 'react'

const ONBOARDING_STORAGE_KEY = 'pagemusefusion-onboarding-completed'
const ONBOARDING_DISMISSED_KEY = 'pagemusefusion-onboarding-dismissed'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  hasDismissedOnboarding: boolean
  showCoachMarks: boolean
}

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    hasDismissedOnboarding: false,
    showCoachMarks: false
  })

  // Load onboarding state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true'
    
    setState({
      hasCompletedOnboarding: completed,
      hasDismissedOnboarding: dismissed,
      showCoachMarks: false // Always start hidden, will be shown programmatically
    })
  }, [])

  // Show coach marks for new users
  const triggerCoachMarks = useCallback(() => {
    if (!state.hasCompletedOnboarding && !state.hasDismissedOnboarding) {
      setState(prev => ({ ...prev, showCoachMarks: true }))
    }
  }, [state.hasCompletedOnboarding, state.hasDismissedOnboarding])

  // Hide coach marks without marking as completed
  const hideCoachMarks = useCallback(() => {
    setState(prev => ({ ...prev, showCoachMarks: false }))
  }, [])

  // Complete onboarding (user went through all steps)
  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      showCoachMarks: false
    }))
  }, [])

  // Dismiss onboarding (user skipped/closed)
  const dismissOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
    setState(prev => ({
      ...prev,
      hasDismissedOnboarding: true,
      showCoachMarks: false
    }))
  }, [])

  // Reset onboarding (for settings/re-enable)
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY)
    setState({
      hasCompletedOnboarding: false,
      hasDismissedOnboarding: false,
      showCoachMarks: false
    })
  }, [])

  // Check if user is eligible for onboarding
  const isEligibleForOnboarding = !state.hasCompletedOnboarding && !state.hasDismissedOnboarding

  return {
    ...state,
    showCoachMarks: triggerCoachMarks,
    hideCoachMarks,
    completeOnboarding,
    dismissOnboarding,
    resetOnboarding,
    isEligibleForOnboarding
  }
}