'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Code, Brain as BrainIcon, ChatCircle as MessageSquareIcon, CheckCircle, Clock } from '@phosphor-icons/react'

const practiceCategories = [
  {
    id: 'coding',
    title: 'Coding Challenges',
    icon: Code,
    color: 'bg-info/15 text-info',
    total: 150,
    completed: 45,
    topics: ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming']
  },
  {
    id: 'behavioral',
    title: 'Behavioral Questions',
    icon: MessageSquareIcon,
    color: 'bg-success/15 text-success',
    total: 50,
    completed: 12,
    topics: ['Leadership', 'Teamwork', 'Conflict Resolution', 'Problem Solving']
  },
  {
    id: 'system-design',
    title: 'System Design',
    icon: BrainIcon,
    color: 'bg-primary/15 text-primary',
    total: 30,
    completed: 8,
    topics: ['Scalability', 'Databases', 'Caching', 'Load Balancing']
  }
]

const recentChallenges = [
  {
    id: '1',
    title: 'Two Sum Problem',
    difficulty: 'Easy',
    category: 'Arrays',
    completed: true,
    timeSpent: '15 min'
  },
  {
    id: '2',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Strings',
    completed: true,
    timeSpent: '25 min'
  },
  {
    id: '3',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    category: 'Trees',
    completed: false,
    timeSpent: null
  }
]

const interviewTips = [
  {
    title: 'Practice Active Communication',
    description: 'Talk through your thought process as you solve problems'
  },
  {
    title: 'Ask Clarifying Questions',
    description: 'Make sure you understand the problem before starting'
  },
  {
    title: 'Test Your Code',
    description: 'Walk through test cases to verify your solution'
  },
  {
    title: 'Time Management',
    description: 'Practice solving problems within time constraints'
  }
]

export function InterviewPrepClient() {
  const [selectedCategory, setSelectedCategory] = useState(practiceCategories[0])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-success/15 text-success'
      case 'Medium':
        return 'bg-warning/20 text-warning'
      case 'Hard':
        return 'bg-destructive/15 text-destructive'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const overallProgress = Math.round(
    (practiceCategories.reduce((sum, cat) => sum + cat.completed, 0) /
    practiceCategories.reduce((sum, cat) => sum + cat.total, 0)) * 100
  )

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Track your interview preparation journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-2xl font-bold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Practice Categories */}
      <div className="grid gap-4 md:grid-cols-3">
        {practiceCategories.map((category) => {
          const Icon = category.icon
          const progress = Math.round((category.completed / category.total) * 100)

          return (
            <Card 
              key={category.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              <CardHeader>
                <div className={`p-3 rounded-lg ${category.color} w-fit mb-2`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription>
                  {category.completed} of {category.total} completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="flex flex-wrap gap-1">
                  {category.topics.slice(0, 3).map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {category.topics.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{category.topics.length - 3}
                    </Badge>
                  )}
                </div>
                <Button className="w-full" size="sm">Practice Now</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Challenges */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Challenges</CardTitle>
          <CardDescription>Your latest practice sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {challenge.completed ? (
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{challenge.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getDifficultyColor(challenge.difficulty)} variant="outline">
                        {challenge.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{challenge.category}</span>
                      {challenge.timeSpent && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {challenge.timeSpent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {challenge.completed ? 'Review' : 'Start'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interview Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Tips</CardTitle>
          <CardDescription>Best practices for technical interviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {interviewTips.map((tip, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">{tip.title}</h4>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mock Interviews */}
      <Card>
        <CardHeader>
          <CardTitle>Mock Interview Sessions</CardTitle>
          <CardDescription>Practice with simulated interviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Full-Stack Developer Mock Interview</p>
              <p className="text-sm text-muted-foreground">60 min • Coding + Behavioral</p>
            </div>
            <Button>Schedule</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">System Design Interview</p>
              <p className="text-sm text-muted-foreground">45 min • Design + Discussion</p>
            </div>
            <Button>Schedule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
