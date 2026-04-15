'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MagnifyingGlass,
  FunnelSimple as Funnel,
  GraduationCap,
  Medal,
  MapPin,
  CaretRight,
  BookOpen,
  Star,
  SlidersHorizontal as SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

interface SearchClientProps {
  initialStudents: any[]
  org: string
  initialSearchTerm: string
}

export default function SearchClient({ initialStudents, org, initialSearchTerm }: SearchClientProps) {
  const [filteredStudents, setFilteredStudents] = useState(initialStudents)
  const [majorFilter, setMajorFilter] = useState('All')

  // Extract unique majors for the filter, using program as fallback
  const majors = ['All', ...new Set(initialStudents.map(s => s.major || s.program).filter(Boolean))]

  useEffect(() => {
    const results = initialStudents.filter(student => {
      const profile = student.profiles || {}
      const studentMajor = student.major || student.program || ''
      
      const matchesMajor = majorFilter === 'All' || studentMajor === majorFilter
      
      return matchesMajor
    })
    setFilteredStudents(results)
  }, [majorFilter, initialStudents])

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
        <form method="get" action={`/${org}/search`} className="relative w-full md:max-w-md flex gap-2">
          <div className="relative w-full">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search by skills, role, major, university, email, or keywords..."
              className="pl-10 bg-background"
              defaultValue={initialSearchTerm}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <SlidersHorizontalIcon className="h-4 w-4 text-muted-foreground mr-1 shrink-0" />
          {majors.slice(0, 5).map(major => (
            <Button
              key={major}
              variant={majorFilter === major ? "default" : "outline"}
              size="sm"
              onClick={() => setMajorFilter(major)}
              className="rounded-full whitespace-nowrap"
            >
              {major}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {filteredStudents.length} Candidates Found
            {initialSearchTerm && <span className="text-sm font-normal text-muted-foreground">for "{initialSearchTerm}"</span>}
          </h2>
          <div className="text-sm text-muted-foreground">
            Sort by: <span className="font-medium text-foreground cursor-pointer hover:underline">Relevance</span>
          </div>
        </div>
        
        {filteredStudents.length === 0 ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MagnifyingGlass className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No matches found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button 
                variant="link" 
                onClick={() => {setMajorFilter('All')}}
                className="mt-2"
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {filteredStudents.map((student: any) => {
              const profile = student.profiles || {}
              const candidateId = student.profile_id || profile.id

              if (!candidateId) {
                return null
              }
              
              return (
                <Link key={candidateId} href={`/${org}/candidates/${candidateId}`}>
                  <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all group overflow-hidden border-muted-foreground/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                            {profile.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {profile.full_name || 'Anonymous Student'}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-0.5">
                              <GraduationCap className="h-3 w-3" />
                              {student.university || 'University Not Specified'}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/30">
                          {student.gpa ? `GPA: ${student.gpa}` : 'Active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs font-normal">
                            {student.major || 'General'}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-normal">
                            Class of {student.graduation_year || 'Unknown'}
                          </Badge>
                          {student.skills && student.skills.slice(0, 2).map((skill: string) => (
                            <Badge key={skill} variant="outline" className="text-xs font-normal bg-info/5 text-info border-info/25">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 italic">
                          "{student.bio || 'Motivated student seeking opportunities to grow and contribute to innovative projects...'}"
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-muted-foreground/10 mt-auto">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            <span>{student.projects_count ?? 0} Projects</span>
                          </div>
                          <CaretRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

