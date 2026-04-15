'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ShareNetwork as Share2Icon, LinkedinLogo as LinkedinIcon, TwitterLogo as TwitterIcon, FacebookLogo as FacebookIcon, EnvelopeSimple, Link, Check as CheckIcon } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ShareProfileButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile` : ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const handleShareTwitter = () => {
    const text = 'Check out my professional profile and verified credentials!'
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const handleShareEmail = () => {
    const subject = 'Check out my professional achievements'
    const body = `I'd like to share my professional profile and certificates with you: ${profileUrl}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2Icon className="h-4 w-4 mr-2" />
          Share Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Profile</DialogTitle>
          <DialogDescription>
            Share your profile and achievements with your network
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Copy Link */}
          <div>
            <Label htmlFor="profile-url">Profile URL</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="profile-url"
                value={profileUrl}
                readOnly
                className="flex-1"
              />
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div>
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button onClick={handleShareLinkedIn} variant="outline" className="justify-start">
                <LinkedinIcon className="h-4 w-4 mr-2 text-info" />
                LinkedIn
              </Button>
              <Button onClick={handleShareTwitter} variant="outline" className="justify-start">
                <TwitterIcon className="h-4 w-4 mr-2 text-sky-500" />
                Twitter
              </Button>
              <Button onClick={handleShareFacebook} variant="outline" className="justify-start">
                <FacebookIcon className="h-4 w-4 mr-2 text-info" />
                Facebook
              </Button>
              <Button onClick={handleShareEmail} variant="outline" className="justify-start">
                <EnvelopeSimple className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
