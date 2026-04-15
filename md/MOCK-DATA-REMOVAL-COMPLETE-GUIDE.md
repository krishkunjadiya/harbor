# Mock Data Removal - Complete Implementation Guide

## COMPLETED âœ…

### 1. Database Schema Extensions Created
**File**: `database-schema-extended.sql`

Added 9 new tables:
- `departments` - University departments with metadata
- `faculty` - Faculty members with profiles
- `admin_staff` - Administrative staff members
- `courses` - Course catalog
- `student_projects` - Capstone/project submissions
- `academic_records` - Individual course grades
- `student_full_records` - Complete transcript records
- `user_skills` - Detailed skill proficiency tracking
- `career_insights` - AI-generated career recommendations

All tables include:
- Proper foreign keys
- RLS policies
- Indexes for performance
- Timestamps for auditing

### 2. Database Functions Added
**File**: `lib/actions/database.ts` (Extended)

Added 50+ new server actions:
- **Departments**: getDepartments, create, update, delete
- **Faculty**: getFaculty, getByDepartment, create, update, delete
- **Admin Staff**: getAdminStaff, create, update, delete
- **Courses**: getCourses, create, update, delete
- **Projects**: create, update, delete (read already existed)
- **Student Records**: getStudentFullRecords, create, update
- **Skills**: createUserSkill, updateUserSkill, deleteUserSkill
- **Career Insights**: getCareerInsights, createCareerInsights
- **Profile Updates**: updateStudentProfile, updateUserProfile

---

## FILES REQUIRING CONVERSION

### Critical Priority (Heavy Mock Data)

#### 1. Student Profile Edit (`app/(student)/profile/edit/page.tsx`)
**Current State**: 544 lines, extensive mock data
**Mock Data**:
- Hardcoded skills: `["JavaScript", "React", "Python", "Node.js"]`
- Hardcoded links: GitHub, LinkedIn, Portfolio URLs
- Hardcoded form values: "John Doe", "MIT", "Computer Science", GPA "3.8/4.0"
- Hardcoded certifications: AWS Developer Associate
- Hardcoded preferences: job roles, industries

**Required Changes**:
1. Convert to server component OR fetch data on mount
2. Load profile data from `getCurrentUserProfile()` and `getStudentProfile()`
3. Load skills from `getUserSkills()`
4. Create form submission handler that calls `updateStudentProfile()` and `updateUserProfile()`
5. Add skill management via `createUserSkill()`, `deleteUserSkill()`
6. Store links in `students.linkedin_url`, `students.github_url`, `students.portfolio_url`

**Database Actions Needed**:
```typescript
// On load:
const profile = await getCurrentUserProfile()
const student = await getStudentProfile(profile.id)
const skills = await getUserSkills(profile.id)

// On save:
await updateUserProfile(profile.id, { full_name, phone, avatar_url })
await updateStudentProfile(profile.id, { 
  university, major, gpa, graduation_year, bio,
  linkedin_url, github_url, portfolio_url, skills: [] 
})
```

---

#### 2. Departments Page (`app/(university)/[org]/admin/departments/departments-client.tsx`)
**Current State**: 432 lines, ~6 hardcoded departments
**Mock Data**:
```typescript
{ id: 1, name: "Computer Science", code: "CS", students: 486, faculty: 38... }
{ id: 2, name: "Engineering", code: "ENG", students: 412, faculty: 42... }
...5 more departments
```

**Required Changes**:
1. Replace `useState` mock array with database fetch in `useEffect`
2. Call `getDepartments(universityId)` on load
3. Replace add handler to call `createDepartment()`
4. Replace edit handler to call `updateDepartment()`
5. Replace delete handler to call `deleteDepartment()`

**Code Pattern**:
```typescript
useEffect(() => {
  async function fetchDepartments() {
    const profile = await getCurrentUserProfile()
    const depts = await getDepartments(profile.id)
    setDepartments(depts)
  }
  fetchDepartments()
}, [])
```

---

#### 3. Faculty Members Page (`app/(university)/[org]/admin/members/members-client.tsx`)
**Current State**: 618 lines, ~5 hardcoded faculty + admin staff
**Mock Data**:
```typescript
facultyMembers: [
  { id: 1, name: "Dr. Sarah Johnson", email: "sarah.johnson@university.edu"... },
  { id: 2, name: "Dr. Michael Chen"... },
  { id: 3, name: "Prof. Emily Rodriguez"... }
]
adminStaff: [
  { id: 1, name: "Robert Williams"... },
  { id: 2, name: "Jennifer Martinez"... }
]
```

**Required Changes**:
1. Replace faculty `useState` with `getFaculty(universityId)`
2. Replace admin `useState` with `getAdminStaff(universityId)`
3. Update add handlers to call `createFaculty()` and `createAdminStaff()`
4. Update edit handlers to call `updateFaculty()` and `updateAdminStaff()`
5. Update delete handlers to call `deleteFaculty()` and `deleteAdminStaff()`

---

### Medium Priority

#### 4. Faculty Courses Page (`app/(university)/[org]/faculty/courses/page.tsx`)
**Mock Data**: Empty array initialization
**Required**: Call `getCourses()` on mount

#### 5. Faculty Academic Records (`app/(university)/[org]/faculty/academic-records/page.tsx`)
**Mock Data**: Empty array, but has TODO comment
**Required**: Already partially implemented, needs completion

#### 6. Student Projects (`app/(university)/[org]/student/projects/page.tsx`)
**Mock Data**: Empty array initialization
**Required**: Already calls `getStudentProjects()`, verify working

#### 7. Student Records (`app/(university)/[org]/student/records/page.tsx`)
**Mock Data**: Has transformation logic but needs data source
**Required**: Call `getStudentFullRecords()`

#### 8. Faculty Capstones (`app/(university)/[org]/faculty/capstones/page.tsx`)
**Mock Data**: Empty array initialization
**Required**: Call `getStudentProjects()` (capstones are projects)

---

### Lower Priority

#### 9. Student Skills Page (`app/(student)/skills/skills-client.tsx`)
**Current State**: Partially implemented with database
**Issue**: Hardcoded `userId = 'current-user-id'`
**Fix**: Get userId from auth context

#### 10. Career Insights Page (`app/(student)/career-insights/page.tsx`)
**Current State**: Heavy mock data for AI recommendations
**Mock Data**: Hardcoded scores, job matches, salary data, trends
**Required**: 
- Generate or fetch from `career_insights` table
- If table empty, generate default insights
- Long-term: Build AI service

---

## IMPLEMENTATION STRATEGY

### Phase 1: Database Setup (Complete âœ…)
1. âœ… Create extended schema SQL file
2. âœ… Add all database functions to database.ts
3. â­ï¸ Run SQL migrations in Supabase

### Phase 2: Critical Updates (Next Steps)
**Order of execution**:
1. Student Profile Edit (most visible to students)
2. Departments Page (foundational data)
3. Faculty Members Page (depends on departments)
4. Courses Pages (depends on faculty)
5. Projects/Records Pages (depends on courses)

### Phase 3: Testing & Validation
1. Test each CRUD operation
2. Verify RLS policies work correctly
3. Check for performance issues
4. Verify no mock data remains

---

## QUICK REFERENCE: Mock Data Patterns to Find

### Search Patterns
```typescript
// Array initializations
const [items, setItems] = useState([...])
const items = [...]

// Hardcoded values
defaultValue="John Doe"
defaultValue="MIT"
placeholder="john.doe@university.edu"

// Mock IDs
userId = 'current-user-id'
studentId = 'demo-student-id'

// TODO comments
// TODO: Get actual user ID
// TODO: Get records for all students
```

### Files to Search
```bash
app/(student)/**/*.tsx
app/(university)/**/*.tsx
app/(recruiter)/**/*.tsx
app/(dashboard)/**/*.tsx
```

---

## DATABASE CONNECTION SETUP

### Environment Variables Required
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase Client
Already configured in:
- `lib/supabase/client.ts` (client-side)
- `lib/supabase/server.ts` (server-side)
- `lib/supabase/middleware.ts` (auth middleware)

---

## TESTING CHECKLIST

### Per Feature
- [ ] Data loads from database on page load
- [ ] Create operation works and persists
- [ ] Update operation works and persists
- [ ] Delete operation works and removes from DB
- [ ] No console errors
- [ ] Loading states work correctly
- [ ] Empty states display when no data
- [ ] Form validation works
- [ ] Success/error messages display

### Global Checks
- [ ] No mock data in production code
- [ ] All `useState([...])` with mock arrays removed
- [ ] All hardcoded user IDs replaced with auth
- [ ] All placeholder emails/names removed from defaults
- [ ] RLS policies prevent unauthorized access
- [ ] Database indexes improve query performance
- [ ] Realtime subscriptions work (if implemented)

---

## MIGRATION STEPS

### 1. Run Database Migrations
```sql
-- In Supabase SQL Editor:
-- 1. Run database-schema.sql (if not already run)
-- 2. Run database-schema-extended.sql (new tables)
```

### 2. Update Each Component
For each file with mock data:

**Pattern A: Server Component**
```typescript
// Before
"use client"
const [data, setData] = useState([mock...])

// After
// Remove "use client"
export default async function Page() {
  const data = await getData()
  return <ClientComponent data={data} />
}
```

**Pattern B: Client Component with useEffect**
```typescript
// Before
const [data, setData] = useState([mock...])

// After
const [data, setData] = useState([])
useEffect(() => {
  async function fetch() {
    const result = await getData()
    setData(result)
  }
  fetch()
}, [])
```

### 3. Update Form Handlers
```typescript
// Before
const handleAdd = () => {
  setData([...data, newItem])
}

// After
const handleAdd = async () => {
  const created = await createItem(newItem)
  if (created) {
    setData([...data, created])
  }
}
```

---

## NEXT IMMEDIATE STEPS

1. **Run SQL Migrations**
   - Copy `database-schema-extended.sql` to Supabase SQL Editor
   - Execute to create new tables
   - Verify tables created successfully

2. **Update Student Profile Edit**
   - Highest user impact
   - Creates foundation for profile management
   - Tests database update functions

3. **Update Departments Page**
   - Foundation for university structure
   - Tests all CRUD operations
   - Other pages depend on department data

4. **Verify Each Update**
   - Test thoroughly before moving to next
   - Check browser console for errors
   - Verify Supabase logs for RLS issues

---

## ESTIMATED EFFORT

- **Database Setup**: âœ… Complete (2 hours)
- **Critical Files (4)**: ~8-12 hours
- **Medium Priority (5)**: ~6-8 hours
- **Testing & Debugging**: ~4-6 hours
- **Total**: 20-30 hours

---

## SUPPORT RESOURCES

### Database Functions Available
Check `lib/actions/database.ts` for:
- All CRUD operations
- Query examples
- Error handling patterns

### Types Available
Check `lib/types/database.ts` for:
- TypeScript interfaces
- Type definitions

### Examples
Look at these working pages:
- `app/(student)/dashboard/page.tsx` - Server component with DB
- `app/(student)/jobs/page.tsx` - Job listings from DB
- `app/(student)/credentials/page.tsx` - Credentials from DB

