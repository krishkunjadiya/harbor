'use client'

import { useMemo, useState } from 'react'
import { ArrowClockwise, Cards, Lightbulb } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PrepCardTopicGroup } from '@/lib/types/interview'

type Props = {
  groups: PrepCardTopicGroup[]
}

export function PrepCardsClient({ groups }: Props) {
  const [activeTopic, setActiveTopic] = useState(groups[0]?.topic || '')
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})

  const cards = useMemo(
    () => groups.find((group) => group.topic === activeTopic)?.cards || [],
    [groups, activeTopic]
  )

  const allCount = groups.reduce((sum, group) => sum + group.cards.length, 0)

  function toggleFlip(cardId: string) {
    setFlipped((current) => ({
      ...current,
      [cardId]: !current[cardId],
    }))
  }

  function resetCurrentTopic() {
    setFlipped((current) => {
      const next = { ...current }
      for (const card of cards) {
        delete next[card.id]
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cards className="h-5 w-5" />
            Topic-Based Prep Cards
          </CardTitle>
          <CardDescription>
            Flip each card to reveal a quick response structure you can apply in interviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <Button
                key={group.topic}
                variant={group.topic === activeTopic ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTopic(group.topic)}
              >
                {group.topic}
                <span className="ml-2 text-xs opacity-80">({group.cards.length})</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total cards: {allCount}</span>
            <Button variant="ghost" size="sm" onClick={resetCurrentTopic}>
              <ArrowClockwise className="mr-2 h-4 w-4" />
              Reset topic cards
            </Button>
          </div>
        </CardContent>
      </Card>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No prep cards available yet for this topic.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const isFlipped = Boolean(flipped[card.id])

            return (
              <div key={card.id} style={{ perspective: '1200px' }}>
                <button
                  type="button"
                  onClick={() => toggleFlip(card.id)}
                  className="h-[260px] w-full text-left"
                  aria-label={`Flip prep card for ${card.topic}`}
                >
                  <div
                    className="relative h-full w-full transition-transform duration-500"
                    style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  >
                    <Card className="absolute inset-0 h-full w-full" style={{ backfaceVisibility: 'hidden' }}>
                      <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{card.topic}</Badge>
                          <Badge className="bg-info/15 text-info">{card.difficulty}</Badge>
                        </div>
                        <CardTitle className="text-base">Question</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">{card.question}</p>
                        {card.roleTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {card.roleTags.map((tag) => (
                              <Badge key={`${card.id}-${tag}`} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card
                      className="absolute inset-0 h-full w-full"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Lightbulb className="h-4 w-4" />
                          Quick Structure
                        </CardTitle>
                        <CardDescription>Use this 3-step pattern while answering.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal space-y-2 ps-5 text-sm text-muted-foreground">
                          {card.quickStructure.map((line) => (
                            <li key={`${card.id}-${line}`}>{line}</li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
