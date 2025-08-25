import { TemplateGeneratorHealthCheck } from '@/components/admin/TemplateGeneratorHealthCheck'
import { SeedValidator } from '@/components/admin/SeedValidator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TemplateGeneratorSimple() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Generator</h1>
          <p className="text-muted-foreground mt-2">
            Administrative tools for template generation system
          </p>
        </div>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="seeds">Seeds</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <TemplateGeneratorHealthCheck />
        </TabsContent>

        <TabsContent value="seeds">
          <SeedValidator />
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Template Generation</CardTitle>
              <CardDescription>
                Generate templates using various document types, style packs, and industry settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Template generation tools will be available here once the system is fully configured.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}