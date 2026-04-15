import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { InterviewResourceSection } from '@/lib/types/interview'

type Props = {
  sections: InterviewResourceSection[]
}

export function ResourcesClient({ sections }: Props) {
  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No resource content available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{section.title}</CardTitle>
              <Badge variant="outline">{section.items.length} tips</Badge>
            </div>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">
              {section.items.map((item) => (
                <li key={`${section.id}-${item}`}>{item}</li>
              ))}
            </ul>

            {section.links.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Resources</p>
                <div className="flex flex-col gap-2">
                  {section.links.map((linkItem) => (
                    <Link
                      key={`${section.id}-${linkItem.url}`}
                      href={linkItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {linkItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
