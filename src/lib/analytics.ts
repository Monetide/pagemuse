// Analytics event tracking utility

interface AnalyticsEvent {
  event: string
  payload: Record<string, any>
  timestamp?: string
}

// In a production app, you would integrate with your analytics service here
// (e.g., Mixpanel, Segment, Google Analytics, etc.)
export const emitAnalyticsEvent = (eventName: string, payload: Record<string, any>) => {
  const event: AnalyticsEvent = {
    event: eventName,
    payload: {
      ...payload,
      timestamp: new Date().toISOString()
    }
  }

  // Console logging for development
  console.log(`📊 Analytics Event: ${eventName}`, event.payload)

  // In production, replace this with your actual analytics service
  // Examples:
  
  // Mixpanel
  // mixpanel.track(eventName, event.payload)
  
  // Segment
  // analytics.track(eventName, event.payload)
  
  // Google Analytics 4
  // gtag('event', eventName, event.payload)
  
  // PostHog
  // posthog.capture(eventName, event.payload)
  
  // For now, we'll simulate sending to an analytics service
  if (typeof window !== 'undefined') {
    // Store events in localStorage for demo purposes
    const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]')
    existingEvents.push(event)
    
    // Keep only the last 100 events
    if (existingEvents.length > 100) {
      existingEvents.splice(0, existingEvents.length - 100)
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(existingEvents))
    
    // Dispatch custom event for any listeners
    window.dispatchEvent(new CustomEvent('analytics_event', { detail: event }))
  }

  return true
}

// Utility to get stored analytics events (for demo/debugging)
export const getStoredAnalyticsEvents = (): AnalyticsEvent[] => {
  if (typeof window === 'undefined') return []
  
  try {
    return JSON.parse(localStorage.getItem('analytics_events') || '[]')
  } catch {
    return []
  }
}

// Clear stored analytics events 
export const clearStoredAnalyticsEvents = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('analytics_events')
}

// Template-specific analytics events
export const trackTemplateOpened = (templateId: string, facets: any, workspaceId: string) => {
  emitAnalyticsEvent('template_opened', {
    templateId,
    facets,
    workspaceId
  })
}

export const trackTemplateSelected = (templateId: string, facets: any, workspaceId: string, docId?: string) => {
  emitAnalyticsEvent('template_selected', {
    templateId,
    facets,
    workspaceId,
    docId
  })
}

export const trackTemplateExported = (templateId: string, facets: any, workspaceId: string, format: string) => {
  emitAnalyticsEvent('template_exported', {
    templateId,
    facets,
    workspaceId,
    format
  })
}

export const trackTemplateRetargeted = (fromTemplateId: string, toTemplateId: string, workspaceId: string) => {
  emitAnalyticsEvent('template_retargeted', {
    fromTemplateId,
    toTemplateId,
    workspaceId
  })
}
