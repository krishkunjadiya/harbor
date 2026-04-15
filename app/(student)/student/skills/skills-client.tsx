'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus as PlusIcon, MagnifyingGlass, TrendUp, CheckCircle, Trash, SpinnerGap as Loader2Icon } from "@phosphor-icons/react"
import { createClient } from '@/lib/supabase/client'

// Simple debounce hook for local component usage
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type TaxonomySkill = {
  onet_soc_code: string;
  title: string;
  example?: string;
  commodity_title?: string;
}

type StudentSkill = {
  onet_soc_code: string;
  title: string;
  proficiency_level: number;
}

export default function SkillsPageClient() {
  const supabase = useMemo(() => createClient(), [])
  const [skills, setSkills] = useState<StudentSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Search for your saved skills
  const [searchQuery, setSearchQuery] = useState('')

  // Add new skill dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [taxonomySearch, setTaxonomySearch] = useState('')
  const debouncedTaxonomySearch = useDebounce(taxonomySearch, 500)
  const [searchResults, setSearchResults] = useState<TaxonomySkill[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [selectedSkill, setSelectedSkill] = useState<TaxonomySkill | null>(null)
  const [proficiencyLevel, setProficiencyLevel] = useState(50)

  useEffect(() => {
    async function fetchSkills() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      const { data: skillsData, error } = await supabase
        .from('student_taxonomy_skills')
        .select('onet_soc_code, proficiency_level, skills_taxonomy(title)')
        .eq('student_id', user.id)
        .order('proficiency_level', { ascending: false })

      if (error) {
        console.error('Error loading taxonomy skills:', error)
        setSkills([])
        setLoading(false)
        return
      }

      const transformed: StudentSkill[] = (skillsData || []).map((s: any) => ({
        onet_soc_code: s.onet_soc_code,
        title: (Array.isArray(s.skills_taxonomy) ? s.skills_taxonomy[0]?.title : s.skills_taxonomy?.title) || "Unknown Skill",
        proficiency_level: s.proficiency_level || 50
      }))

      setSkills(transformed)
      setLoading(false)
    }
    fetchSkills()
  }, [supabase])

  useEffect(() => {
    async function performSearch() {
      const normalizedSearch = debouncedTaxonomySearch.trim().replace(/,/g, ' ')

      if (!normalizedSearch) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const { data: results, error } = await supabase
          .from('skills_taxonomy')
          .select('onet_soc_code, title, example, commodity_title')
          .or(`title.ilike.%${normalizedSearch}%,example.ilike.%${normalizedSearch}%,commodity_title.ilike.%${normalizedSearch}%`)
          .limit(50)

        if (error) {
          console.error('Error searching taxonomy skills:', error)
          setSearchResults([])
        } else {
          setSearchResults((results || []) as TaxonomySkill[])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }
    performSearch()
  }, [debouncedTaxonomySearch, supabase])

  const handleAddSkill = async () => {
    if (!userId || !selectedSkill) return

    setSaving(true)
    try {
      const { data: dbSkill, error } = await supabase
        .from('student_taxonomy_skills')
        .upsert({
          student_id: userId,
          onet_soc_code: selectedSkill.onet_soc_code,
          proficiency_level: proficiencyLevel,
        }, { onConflict: 'student_id, onet_soc_code' })
        .select('onet_soc_code')
        .single()

      if (error) {
        console.error('Error adding taxonomy skill:', error)
      }

      if (dbSkill) {
        const newSkill: StudentSkill = {
          onet_soc_code: selectedSkill.onet_soc_code,
          title: selectedSkill.title,
          proficiency_level: proficiencyLevel
        }

        setSkills(prev => {
          const exists = prev.find(s => s.onet_soc_code === newSkill.onet_soc_code)
          if (exists) {
            return prev.map(s => s.onet_soc_code === newSkill.onet_soc_code ? newSkill : s)
          }
          return [...prev, newSkill]
        })

        setSelectedSkill(null)
        setTaxonomySearch('')
        setProficiencyLevel(50)
        setIsAddDialogOpen(false)
      } else {
        alert('Failed to add skill. Please try again.')
      }
    } catch (error) {
      console.error('Error adding skill:', error)
      alert('Failed to add skill.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSkill = async (onet_soc_code: string) => {
    if (!userId || !confirm('Remove this skill from your profile?')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('student_taxonomy_skills')
        .delete()
        .match({ student_id: userId, onet_soc_code })

      const success = !error
      if (error) {
        console.error('Error deleting taxonomy skill:', error)
      }

      if (success) {
        setSkills(skills.filter(s => s.onet_soc_code !== onet_soc_code))
      } else {
        alert('Failed to delete skill.')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to delete skill.')
    } finally {
      setSaving(false)
    }
  }

  const filteredSkills = skills.filter(skill =>
    skill.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: skills.length,
    expert: skills.filter(s => s.proficiency_level >= 80).length,
    learning: skills.filter(s => s.proficiency_level < 50).length,
    score: skills.length ? Math.round(skills.reduce((acc, s) => acc + s.proficiency_level, 0) / skills.length) : 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Standardized Skills</h1>
          <p className="text-muted-foreground">O*NET Industry Taxonomy Mappings</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setTaxonomySearch('')
            setSelectedSkill(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Search Taxonomies</DialogTitle>
              <DialogDescription>Add an industry-standard skill to your profile.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {!selectedSkill ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search-tax">Search over 30,000 O*NET Skills</Label>
                    <div className="relative mt-2">
                      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-tax"
                        placeholder="e.g. Machine Learning, Python, Welding..."
                        className="pl-9"
                        value={taxonomySearch}
                        onChange={(e) => setTaxonomySearch(e.target.value)}
                      />
                      {isSearching && (
                        <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto bg-background">
                      {searchResults.map((result) => (
                        <div
                          key={result.onet_soc_code}
                          className="p-3 hover:bg-muted cursor-pointer flex flex-col"
                          onClick={() => setSelectedSkill(result)}
                        >
                          <span className="font-medium text-sm">{result.title}</span>
                          <span className="text-xs text-muted-foreground">{result.onet_soc_code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {taxonomySearch && !isSearching && searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No skills found matching "{taxonomySearch}"</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h3 className="font-semibold">{selectedSkill.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">O*NET Code: {selectedSkill.onet_soc_code}</p>
                    <Button variant="link" className="px-0 h-auto mt-2 text-xs" onClick={() => setSelectedSkill(null)}>
                      ← Change Skill
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="level" className="flex justify-between">
                      <span>Self-Assessed Proficiency</span>
                      <span className="font-bold text-primary">{proficiencyLevel}%</span>
                    </Label>
                    <Input
                      id="level"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={proficiencyLevel}
                      onChange={(e) => setProficiencyLevel(parseInt(e.target.value))}
                      className="mt-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleAddSkill} disabled={!selectedSkill || saving}>
                {saving ? 'Saving...' : 'Save to Profile'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped Skills</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Standardized abilities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expert Level</CardTitle>
            <TrendUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expert}</div>
            <p className="text-xs text-muted-foreground">&gt;80% Proficiency</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developing</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.learning}</div>
            <p className="text-xs text-muted-foreground">&lt;50% Proficiency</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Mastery</CardTitle>
            <TrendUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.score}%</div>
            <p className="text-xs text-muted-foreground">Overall Confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Your Profile Skills */}
      <div className="relative flex-1">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter your skills..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Skills Database</CardTitle>
          <CardDescription>Mapped directly to the O*NET Federal Jobs Taxonomy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSkills.length > 0 ? (
            filteredSkills.map((skill) => (
              <SkillItem
                key={skill.onet_soc_code}
                skill={skill}
                onDelete={handleDeleteSkill}
              />
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No skills found. Click "Add Skill" to search the taxonomy.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SkillItem({ skill, onDelete }: { skill: StudentSkill, onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {skill.proficiency_level}%
        </div>
        <div className="flex-1">
          <div className="flex flex-col mb-1">
            <span className="font-medium">{skill.title}</span>
            <span className="text-xs text-muted-foreground font-mono">{skill.onet_soc_code}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 max-w-sm">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${skill.proficiency_level}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(skill.onet_soc_code)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


