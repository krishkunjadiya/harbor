'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Question, FileText, EnvelopeSimple, ChatCircle as MessageSquareIcon, CaretDown, Plus as PlusIcon } from '@phosphor-icons/react'

const faqs = [
  {
    id: '1',
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'To reset your password, go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your email.'
  },
  {
    id: '2',
    category: 'Account',
    question: 'How do I update my profile information?',
    answer: 'Go to your Settings page, click on Profile, and update your information. Save changes when done.'
  },
  {
    id: '3',
    category: 'Academic',
    question: 'How do I submit an assignment?',
    answer: 'Navigate to your course, find the assignment, and click Submit. Upload your files and provide any required information before submission.'
  },
  {
    id: '4',
    category: 'Academic',
    question: 'When can I view my grades?',
    answer: 'Grades are typically posted within a week after evaluation. You can view them in your Grades section.'
  },
  {
    id: '5',
    category: 'Jobs',
    question: 'How do I apply for a job?',
    answer: 'Browse the Jobs section, find a position you are interested in, and click "Apply". Fill in the application form and submit.'
  },
  {
    id: '6',
    category: 'Jobs',
    question: 'How do I track my applications?',
    answer: 'Go to the Applications section to view all your applications and their current status.'
  }
]

const supportChannels = [
  {
    icon: EnvelopeSimple,
    title: 'Email Support',
    description: 'support@harbor.edu',
    action: 'Send Email'
  },
  {
    icon: MessageSquareIcon,
    title: 'Live Chat',
    description: 'Available 9 AM - 5 PM',
    action: 'Start Chat'
  },
  {
    icon: FileText,
    title: 'Documentation',
    description: 'Comprehensive guides and tutorials',
    action: 'View Docs'
  }
]

interface HelpSupportClientProps {
  org: string
}

export function HelpSupportClient({ org }: HelpSupportClientProps) {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: ''
  })

  const categories = ['all', ...new Set(faqs.map(f => f.category))]
  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory)

  const handleSubmitTicket = () => {
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.description) {
      alert('Please fill in all fields')
      return
    }
    alert('Ticket submitted successfully!')
    setTicketForm({ subject: '', category: '', description: '' })
    setIsTicketDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Input
        placeholder="Search help articles and FAQs..."
        className="max-w-2xl"
      />

      {/* Support Channels */}
      <div className="grid gap-4 md:grid-cols-3">
        {supportChannels.map((channel, index) => {
          const Icon = channel.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Icon className="h-8 w-8 text-info mb-2" />
                <CardTitle>{channel.title}</CardTitle>
                <CardDescription>{channel.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">{channel.action}</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Submit Ticket */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Submit Support Ticket
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit a Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and we'll help you as soon as possible</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Brief subject of your issue"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={ticketForm.category}
                onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
              >
                <option value="">Select a category</option>
                <option value="account">Account Issue</option>
                <option value="academic">Academic</option>
                <option value="technical">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTicketDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitTicket}>Submit Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-2">
          {filteredFaqs.map((faq) => (
            <Card key={faq.id} className="overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <div className="flex-1">
                  <h3 className="font-medium leading-tight">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{faq.category}</p>
                </div>
                <CaretDown 
                  className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ml-4 ${
                    expandedFaq === faq.id ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {expandedFaq === faq.id && (
                <div className="px-4 pb-4 border-t">
                  <p className="text-sm text-muted-foreground mt-4">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Guide</CardTitle>
              <CardDescription>Complete guide to using Harbor</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Download PDF</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>Step-by-step video guides</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Watch Videos</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
