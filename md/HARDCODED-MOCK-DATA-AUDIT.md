# Hardcoded Mock Data Audit - Faculty Dashboard Pages

## Summary
This document identifies all hardcoded mock data found in the faculty dashboard pages that are not using database data. These should be replaced with real database queries.

---

## 1. **Faculty Dashboard Page** 
**File:** `app/(university)/[org]/faculty/dashboard/page.tsx`

### 1.1 Weekly Schedule (Lines 234-273)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded schedule for Monday through Friday with static courses and times:
```tsx
{[
  { day: "Monday", sessions: [
    { time: "10:00 AM - 11:30 AM", course: "CS401 - Artificial Intelligence", room: "Room 301" },
    { time: "2:00 PM - 3:00 PM", course: "Office Hours", room: "Office 205" },
  ]},
  { day: "Tuesday", sessions: [
    { time: "9:00 AM - 10:30 AM", course: "CS101 - Programming Fundamentals", room: "Room 105" },
    { time: "2:00 PM - 3:30 PM", course: "CS305 - Machine Learning", room: "Room 302" },
  ]},
  // ... more days
]}
```

**Data that should be from database:**
- Faculty member's schedule
- Course times and rooms
- Office hours
- Department meetings

**Required Database Query:** Need to fetch faculty schedule table with course_id, time, room, day_of_week

---

### 1.2 Student Performance Analytics (Lines 285-310)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded course performance data:
```tsx
{[
  { course: "CS401 - AI", average: 87, students: 35 },
  { course: "CS305 - ML", average: 84, students: 42 },
  { course: "CS201 - DS", average: 91, students: 38 },
  { course: "CS101 - Prog", average: 88, students: 45 },
]}
```

**Data that should be from database:**
- Actual course grades and their averages
- Number of students per course
- Grade statistics and calculations

**Required Database Query:** Need to aggregate grades by course from grades/submissions table

---

### 1.3 Assignment Completion Rates (Lines 318-339)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded submission completion rates:
```tsx
{[
  { course: "CS401 - AI", rate: 94 },
  { course: "CS305 - ML", rate: 88 },
  { course: "CS201 - DS", rate: 97 },
  { course: "CS101 - Prog", rate: 92 },
]}
```

**Data that should be from database:**
- Actual assignment submission counts
- Actual completion rates per course
- On-time vs late submissions

**Required Database Query:** Need to calculate submission rates from assignment_submissions table GROUP BY course_id

---

### 1.4 Credential Distribution (Lines 347-376)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded Credential statistics:
```tsx
{[
  { type: "AI Excellence", count: 12, color: "bg-blue-500" },
  { type: "ML Mastery", count: 18, color: "bg-green-500" },
  { type: "Project Champion", count: 8, color: "bg-purple-500" },
  { type: "Code Quality", count: 15, color: "bg-orange-500" },
]}
```

**Data that should be from database:**
- Credential types from Credentials table
- Credential issued counts per faculty member
- Credential metadata (colors, descriptions)

**Required Database Query:** Need to query user_credentials table with Credential details GROUP BY Credential_id WHERE user_type='faculty'

---

### 1.5 Engagement Trends (Lines 384-408)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded weekly participation percentages:
```tsx
{[
  { week: "Week 1", participation: 95 },
  { week: "Week 2", participation: 92 },
  { week: "Week 3", participation: 94 },
  { week: "Week 4", participation: 91 },
  { week: "Week 5", participation: 93 },
]}
```

**Data that should be from database:**
- Actual student participation rates
- Forum/discussion engagement metrics
- Lab attendance
- Assignment submission rates

**Required Database Query:** Need historical engagement data from activities or participation tables

---

## 2. **Courses Page**
**File:** `app/(university)/[org]/faculty/courses/page.tsx`

### 2.1 Sample Students List (Lines 365-378)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded student sample data within each course:
```tsx
{[
  { name: "Alice Johnson", id: "ST2024001", grade: 92, attendance: 95 },
  { name: "Bob Smith", id: "ST2024002", grade: 88, attendance: 92 },
  { name: "Carol Davis", id: "ST2024003", grade: 85, attendance: 88 },
  { name: "David Wilson", id: "ST2024004", grade: 90, attendance: 98 },
]}
```

**Data that should be from database:**
- Actual enrolled students in the course
- Student grades
- Student attendance records
- Student profile information

**Required Database Query:** Need course_enrollments table with student_id, grade, attendance JOIN users table

**Issue:** Only 4 sample students displayed while actual course has `course.students` count

---

### 2.2 Sample Assignments List (Lines 401-413)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded sample assignments:
```tsx
{[
  { title: "AI Project - Neural Networks", due: "Jan 20, 2026", submissions: 28, total: 35 },
  { title: "Midterm Exam", due: "Jan 15, 2026", submissions: 35, total: 35 },
  { title: "Lab Assignment 5", due: "Jan 12, 2026", submissions: 33, total: 35 },
]}
```

**Data that should be from database:**
- Actual assignments for each course
- Due dates
- Submission counts
- Total students who should submit

**Required Database Query:** Need assignments table with course_id, due_date, and COUNT submission records

---

### 2.3 Grade Distribution (Lines 456-472)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded grade range distributions:
```tsx
{[
  { range: "90-100%", count: 12 },
  { range: "80-89%", count: 15 },
  { range: "70-79%", count: 6 },
  { range: "Below 70%", count: 2 },
]}
```

**Data that should be from database:**
- Actual grade distribution for the course
- Bucket counts based on real student grades

**Required Database Query:** Need to COUNT grades from grades/submissions table WHERE course_id=? GROUP BY grade ranges

---

### 2.4 Engagement Metrics (Lines 480-487)
**Status:** âŒ HARDCODED MOCK DATA

Hardcoded engagement statistics:
```tsx
{[
  { metric: "Attendance Rate", value: 93 },
  { metric: "Assignment Completion", value: 94 },
  { metric: "Forum Participation", value: 78 },
  { metric: "Office Hours Visits", value: 45 },
]}
```

**Data that should be from database:**
- Actual attendance percentages per course
- Actual completion rates
- Forum activity metrics
- Office hours visit counts

**Required Database Query:** Multiple queries needed:
- Attendance from attendance table
- Completion from assignments/submissions
- Forum data from discussions/posts
- Office hours from calendar/visits tables

---

## 3. **Impact Summary**

| Page | Location | Hardcoded Items | Status |
|------|----------|-----------------|--------|
| Dashboard | Weekly Schedule | 10+ schedule entries | ðŸ”´ Critical |
| Dashboard | Student Performance | 4 courses with grades | ðŸ”´ Critical |
| Dashboard | Assignment Completion | 4 courses with rates | ðŸ”´ Critical |
| Dashboard | Credential Distribution | 4 Credential types | ðŸŸ¡ Medium |
| Dashboard | Engagement Trends | 5 weeks of data | ðŸ”´ Critical |
| Courses | Student List | 4 sample students per course | ðŸ”´ Critical |
| Courses | Assignments List | 3 sample assignments per course | ðŸ”´ Critical |
| Courses | Grade Distribution | 4 hardcoded buckets | ðŸ”´ Critical |
| Courses | Engagement Metrics | 4 hardcoded metrics | ðŸ”´ Critical |

**Total Hardcoded Data Points:** 40+ individual mock entries

---

## 4. **Required Database Tables/Functions**

Based on the audit, you'll need to:

### Tables to Query:
1. `faculty_schedule` - Faculty weekly schedule
2. `course_enrollments` - Student enrollments with grades
3. `assignments` - Course assignments
4. `assignment_submissions` - Submission records
5. `grades` - Student grades
6. `user_credentials` - Credentials issued to users
7. `activities` or `participation` - Engagement tracking
8. `attendance_records` - Class attendance
9. `forum_posts` - Discussion engagement
10. `office_hours_visits` - Office hours tracking

### Functions to Create/Update:
1. `getFacultyWeeklySchedule(facultyId)` - Weekly schedule
2. `getAverageGradesByFaculty(facultyId)` - Course performance
3. `getAssignmentCompletionRates(facultyId)` - Assignment stats
4. `getCredentialDistribution(facultyId)` - Credential counts
5. `getEngagementTrends(facultyId, weeks)` - Weekly participation
6. `getCourseStudentsWithGrades(courseId)` - Student list with grades
7. `getCourseGradeDistribution(courseId)` - Grade bucketing
8. `getCourseEngagementMetrics(courseId)` - Course-level metrics

---

## 5. **Recommendations**

### Priority 1 (Critical - Fix Immediately):
- [ ] Replace dashboard weekly schedule with real faculty schedule data
- [ ] Replace student performance analytics with real grade calculations
- [ ] Replace assignment completion rates with actual submission data
- [ ] Replace course student list with actual enrolled students

### Priority 2 (High):
- [ ] Replace engagement trends with real participation data
- [ ] Replace grade distribution with actual student grades
- [ ] Replace engagement metrics with real data sources

### Priority 3 (Medium):
- [ ] Replace Credential distribution with actual issued Credentials
- [ ] Add data validation and error handling for empty data states
- [ ] Implement fallback UI states when no data is available

---

## 6. **Notes**

- The `dashboard/page.tsx` is a **server-side component** (uses `getFacultyDashboard`) but still has hardcoded mock data in visualization sections
- The `courses/page.tsx` is a **client-side component** that fetches from database but displays hardcoded sample data below actual course data
- Many components have **TODO comments** indicating where database calls should be added
- Some pages properly use database functions (`getCoursesByFaculty`, `getAcademicRecordsByFaculty`) but still inject hardcoded data



