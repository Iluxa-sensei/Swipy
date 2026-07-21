import React, { useMemo, useState } from 'react'
import SwipyStartupPicker from './SwipyStartupPicker.jsx'
import { aiResumerService } from '../../services/aiResumerService.js'

const createEducationItem = () => ({ school: '', degree: '', field: '', start: '', end: '' })
const createExperienceItem = () => ({ title: '', company: '', start: '', end: '', description: '', source: 'manual' })
const createInternshipItem = () => ({ title: '', company: '', start: '', end: '', description: '' })
const createAchievementItem = () => ({ title: '', organization: '', date: '', description: '' })

const normalizeInitialData = (initialData = {}) => ({
  age: initialData.age || '',
  skillsText: Array.isArray(initialData.skills) ? initialData.skills.join(', ') : '',
  education: Array.isArray(initialData.education) && initialData.education.length > 0 ? initialData.education : [createEducationItem()],
  workExperience: Array.isArray(initialData.workExperience) && initialData.workExperience.length > 0 ? initialData.workExperience : [createExperienceItem()],
  internships: Array.isArray(initialData.internships) && initialData.internships.length > 0 ? initialData.internships : [createInternshipItem()],
  achievements: Array.isArray(initialData.achievements) && initialData.achievements.length > 0 ? initialData.achievements : [createAchievementItem()],
  swipyStartupId: initialData.swipyStartupId || null,
})

const ManualProfileForm = ({
  userId,
  initialData,
  onSubmit,
  submitLabel = 'Save profile',
  submitting = false,
}) => {
  const initial = useMemo(() => normalizeInitialData(initialData), [initialData])
  const [age, setAge] = useState(initial.age)
  const [skillsText, setSkillsText] = useState(initial.skillsText)
  const [education, setEducation] = useState(initial.education)
  const [workExperience, setWorkExperience] = useState(initial.workExperience)
  const [internships, setInternships] = useState(initial.internships)
  const [achievements, setAchievements] = useState(initial.achievements)
  const [swipyStartupId, setSwipyStartupId] = useState(initial.swipyStartupId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState('')
  const [attachingStartup, setAttachingStartup] = useState(false)

  const updateListItem = (setter, list, index, field, value) => {
    const next = [...list]
    next[index] = { ...next[index], [field]: value }
    setter(next)
  }

  const removeListItem = (setter, list, index, fallbackFactory) => {
    const next = list.filter((_, idx) => idx !== index)
    setter(next.length ? next : [fallbackFactory()])
  }

  const cleanItems = (items) =>
    items
      .map((item) => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])))
      .filter((item) => Object.values(item).some((value) => value))

  const handleAttachStartup = async (startup) => {
    setAttachingStartup(true)
    setError('')
    try {
      const payload = await aiResumerService.attachStartupAsExperience(userId, startup.id)
      const startupExperience = payload?.work_experience
      if (!startupExperience) {
        throw new Error('Failed to build startup experience')
      }
      setWorkExperience((prev) => [...prev, startupExperience])
      setSwipyStartupId(startup.id)
      setPickerOpen(false)
    } catch (e) {
      setError(e.message || 'Failed to attach startup')
    } finally {
      setAttachingStartup(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanedEducation = cleanItems(education)
    const cleanedWorkExperience = cleanItems(workExperience).map((item) => ({
      ...item,
      source: item.source || 'manual',
    }))
    const cleanedInternships = cleanItems(internships)
    const cleanedAchievements = cleanItems(achievements)
    const skills = skillsText
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    try {
      await onSubmit({
        age: age ? Number(age) : null,
        skills,
        education: cleanedEducation,
        workExperience: cleanedWorkExperience,
        internships: cleanedInternships,
        achievements: cleanedAchievements,
        swipyStartupId,
      })
    } catch (submitError) {
      setError(submitError.message || 'Failed to save profile')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Age</label>
        <input
          type="number"
          min="0"
          max="100"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full rounded-xl border border-glass-border bg-bg-secondary px-3 py-2.5 text-text-primary"
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Skills</label>
        <textarea
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          className="w-full rounded-xl border border-glass-border bg-bg-secondary px-3 py-2.5 text-text-primary min-h-[84px]"
          placeholder="Comma-separated: React, Node.js, Product strategy..."
        />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Education</h3>
        {education.map((item, index) => (
          <div key={`edu-${index}`} className="rounded-xl border border-glass-border bg-bg-secondary/50 p-3 space-y-2">
            <input className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="School" value={item.school || ''} onChange={(e) => updateListItem(setEducation, education, index, 'school', e.target.value)} />
            <input className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Degree" value={item.degree || ''} onChange={(e) => updateListItem(setEducation, education, index, 'degree', e.target.value)} />
            <input className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Field" value={item.field || ''} onChange={(e) => updateListItem(setEducation, education, index, 'field', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Start" value={item.start || ''} onChange={(e) => updateListItem(setEducation, education, index, 'start', e.target.value)} />
              <input className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="End" value={item.end || ''} onChange={(e) => updateListItem(setEducation, education, index, 'end', e.target.value)} />
            </div>
            <button type="button" onClick={() => removeListItem(setEducation, education, index, createEducationItem)} className="text-xs text-red-400">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setEducation((prev) => [...prev, createEducationItem()])} className="text-sm text-accent-primary">+ Add education</button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Work experience</h3>
            <p className="text-xs text-text-secondary mt-0.5">{workExperience.length} {workExperience.length === 1 ? 'entry' : 'entries'} — add as many as needed</p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={attachingStartup}
            className="text-xs rounded-full border border-accent-primary/40 text-accent-primary px-2.5 py-1 hover:bg-accent-primary/10 disabled:opacity-60"
          >
            + Add my Swipy startup
          </button>
        </div>
        {workExperience.map((item, index) => (
          <div key={`exp-${index}`} className="rounded-xl border border-glass-border bg-bg-secondary/50 p-3 space-y-2">
            <input className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Title" value={item.title || ''} onChange={(e) => updateListItem(setWorkExperience, workExperience, index, 'title', e.target.value)} />
            <input className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Company" value={item.company || ''} onChange={(e) => updateListItem(setWorkExperience, workExperience, index, 'company', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Start" value={item.start || ''} onChange={(e) => updateListItem(setWorkExperience, workExperience, index, 'start', e.target.value)} />
              <input className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="End" value={item.end || ''} onChange={(e) => updateListItem(setWorkExperience, workExperience, index, 'end', e.target.value)} />
            </div>
            <textarea className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary min-h-[70px]" placeholder="Description" value={item.description || ''} onChange={(e) => updateListItem(setWorkExperience, workExperience, index, 'description', e.target.value)} />
            <button type="button" onClick={() => removeListItem(setWorkExperience, workExperience, index, createExperienceItem)} className="text-xs text-red-400">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setWorkExperience((prev) => [...prev, createExperienceItem()])} className="w-full rounded-xl border border-dashed border-accent-primary/50 py-2.5 text-sm font-medium text-accent-primary hover:bg-accent-primary/10">+ Add another work experience</button>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Internships</h3>
          <p className="text-xs text-text-secondary mt-0.5">{internships.length} {internships.length === 1 ? 'entry' : 'entries'} — add as many as needed</p>
        </div>
        {internships.map((item, index) => (
          <div key={`intern-${index}`} className="rounded-xl border border-glass-border bg-bg-secondary/50 p-3 space-y-2">
            <input className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Title" value={item.title || ''} onChange={(e) => updateListItem(setInternships, internships, index, 'title', e.target.value)} />
            <input className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Company" value={item.company || ''} onChange={(e) => updateListItem(setInternships, internships, index, 'company', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="Start" value={item.start || ''} onChange={(e) => updateListItem(setInternships, internships, index, 'start', e.target.value)} />
              <input className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary" placeholder="End" value={item.end || ''} onChange={(e) => updateListItem(setInternships, internships, index, 'end', e.target.value)} />
            </div>
            <textarea className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary min-h-[70px]" placeholder="Description" value={item.description || ''} onChange={(e) => updateListItem(setInternships, internships, index, 'description', e.target.value)} />
            <button type="button" onClick={() => removeListItem(setInternships, internships, index, createInternshipItem)} className="text-xs text-red-400">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setInternships((prev) => [...prev, createInternshipItem()])} className="w-full rounded-xl border border-dashed border-accent-primary/50 py-2.5 text-sm font-medium text-accent-primary hover:bg-accent-primary/10">+ Add another internship</button>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Achievements</h3>
          <p className="text-xs text-text-secondary mt-0.5">Awards, medals, competition placements, hackathons, and notable projects.</p>
        </div>
        {achievements.map((item, index) => (
          <div key={`achievement-${index}`} className="rounded-xl border border-glass-border bg-bg-secondary/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Achievement {index + 1}</span>
              <button type="button" onClick={() => removeListItem(setAchievements, achievements, index, createAchievementItem)} className="text-xs text-red-400">Remove</button>
            </div>
            <input
              className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary"
              placeholder="e.g. Won an award, led a successful project, or placed in a competition"
              value={item.title || ''}
              onChange={(e) => updateListItem(setAchievements, achievements, index, 'title', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary"
                placeholder="Organization, school, or company"
                value={item.organization || ''}
                onChange={(e) => updateListItem(setAchievements, achievements, index, 'organization', e.target.value)}
              />
              <input
                className="rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary"
                placeholder="Date / year"
                value={item.date || ''}
                onChange={(e) => updateListItem(setAchievements, achievements, index, 'date', e.target.value)}
              />
            </div>
            <textarea
              className="w-full rounded-lg border border-glass-border bg-bg-primary/50 px-2.5 py-2 text-sm text-text-primary min-h-[80px]"
              placeholder="Describe what you achieved, your contribution, and the outcome"
              value={item.description || ''}
              onChange={(e) => updateListItem(setAchievements, achievements, index, 'description', e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={() => setAchievements((prev) => [...prev, createAchievementItem()])} className="w-full rounded-xl border border-dashed border-accent-primary/50 py-2.5 text-sm font-medium text-accent-primary hover:bg-accent-primary/10">+ Add another achievement</button>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-accent-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>

      <SwipyStartupPicker
        userId={userId}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAttachStartup}
      />
    </form>
  )
}

export default ManualProfileForm
