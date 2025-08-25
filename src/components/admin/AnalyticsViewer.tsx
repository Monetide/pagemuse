import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Activity, RefreshCw } from 'lucide-react'
import { getStoredAnalyticsEvents, clearStoredAnalyticsEvents } from '@/lib/analytics'

interface AnalyticsEvent {
  event: string
  payload: Record<string, any>
  timestamp?: string
}

export const AnalyticsViewer = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadEvents = () => {
    setIsRefreshing(true)
    const storedEvents = getStoredAnalyticsEvents()
    setEvents(storedEvents.reverse()) // Show newest first
    setTimeout(() => setIsRefreshing(false), 300) // Brief loading state
  }

  const handleClearEvents = () => {
    clearStoredAnalyticsEvents()
    setEvents([])
  }

  useEffect(() => {
    loadEvents()

    // Listen for new analytics events
    const handleAnalyticsEvent = (event: CustomEvent) => {
      setEvents(prev => [event.detail, ...prev])
    }

    window.addEventListener('analytics_event', handleAnalyticsEvent as EventListener)
    
    return () => {
      window.removeEventListener('analytics_event', handleAnalyticsEvent as EventListener)
    }
  }, [])

  const getEventColor = (eventName: string) => {
    switch (eventName) {
      case 'template_opened': return 'bg-blue-100 text-blue-800'
      case 'template_selected': return 'bg-green-100 text-green-800'
      case 'template_exported': return 'bg-purple-100 text-purple-800'
      case 'template_retargeted': return 'bg-orange-100 text-orange-800'
      case 'template_published': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const eventStats = events.reduce((acc, event) => {
    acc[event.event] = (acc[event.event] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Analytics Events
            </CardTitle>
            <CardDescription>
              Live view of template interaction events ({events.length} total)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadEvents}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearEvents}
              disabled={events.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Event Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {Object.entries(eventStats).map(([eventName, count]) => (
              <Card key={eventName}>
                <CardContent className="p-3">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">
                    {eventName.replace('template_', '').replace('_', ' ')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Events List */}
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No analytics events yet. Interact with templates to see events appear here.
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-3">
                {events.map((event, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getEventColor(event.event)}>
                        {event.event}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Now'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(event.payload).map(([key, value]) => {
                          if (key === 'timestamp') return null
                          
                          let displayValue = value
                          if (typeof value === 'object' && value !== null) {
                            displayValue = JSON.stringify(value)
                          }
                          
                          return (
                            <div key={key} className="truncate">
                              <span className="font-medium">{key}:</span>{' '}
                              <span className="text-muted-foreground">
                                {String(displayValue)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}