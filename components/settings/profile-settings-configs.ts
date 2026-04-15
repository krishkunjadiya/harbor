import type { ProfileSection } from "@/components/settings/profile-settings-page"

const studentSections: ProfileSection[] = [
  {
    title: "Basic Information",
    description: "Keep your student profile up to date.",
    columns: 2,
    fields: [
      { key: "full_name", label: "Full Name" },
      { key: "phone", label: "Phone" },
      { key: "university", label: "University" },
      { key: "major", label: "Major" },
      { key: "graduation_year", label: "Graduation Year" },
      { key: "gpa", label: "GPA" },
    ] },
  {
    title: "About",
    description: "Add a short summary to help others understand your background.",
    fields: [{ key: "bio", label: "Bio", type: "textarea", rows: 4 }] },
  {
    title: "Public Links",
    description: "Links shown on your profile.",
    fields: [
      { key: "linkedin_url", label: "LinkedIn URL" },
      { key: "github_url", label: "GitHub URL" },
      { key: "portfolio_url", label: "Portfolio URL" },
    ] },
]

const recruiterSections: ProfileSection[] = [
  {
    title: "Personal Details",
    description: "Contact information for your recruiter account.",
    columns: 2,
    fields: [
      { key: "full_name", label: "Full Name" },
      { key: "phone", label: "Phone" },
    ] },
  {
    title: "Company Details",
    description: "Information shown across recruiter-facing modules.",
    columns: 2,
    fields: [
      { key: "company", label: "Company" },
      { key: "job_title", label: "Job Title" },
      { key: "company_size", label: "Company Size" },
      { key: "industry", label: "Industry" },
      { key: "company_website", label: "Company Website" },
      { key: "location", label: "Location" },
    ] },
]

const adminSections: ProfileSection[] = [
  {
    title: "Account Information",
    description: "Basic profile information for your admin account.",
    columns: 2,
    fields: [
      { key: "full_name", label: "Full Name" },
      { key: "phone", label: "Phone" },
    ] },
]

export { adminSections, recruiterSections, studentSections }
