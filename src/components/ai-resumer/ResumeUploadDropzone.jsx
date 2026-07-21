import React, { useState } from 'react'
import ManualProfileForm from './ManualProfileForm.jsx'
import { aiResumerService } from '../../services/aiResumerService.js'

const ResumeUploadDropzone = ({ userId, onCompleted }) => {
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [rawText, setRawText] = useState('')
  const [loadingParse, setLoadingParse] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const onFileChange = (selected) => {
    if (!selected) return
    const ext = selected.name?.toLowerCase()
    if (!ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
      setError('Please upload a PDF or DOCX file')
      return
    }
    setError('')
    setFile(selected)
  }

  const handleParse = async () => {
    if (!file) return
    setLoadingParse(true)
    setError('')
    try {
      const parsed = await aiResumerService.parseResume(file)
      setParsedData(parsed.parsed)
      setRawText(parsed.raw_text || '')
    } catch (e) {
      setError(e.message || 'Failed to parse resume')
    } finally {
      setLoadingParse(false)
    }
  }

  const handleSubmitProfile = async (profilePayload) => {
    setSaving(true)
    try {
      const filePath = await aiResumerService.uploadResumeFile(userId, file)
      const resume = await aiResumerService.createResume({
        userId,
        source: 'upload',
        fileUrl: filePath,
        rawText,
      })

      const candidateProfile = await aiResumerService.createCandidateProfile({
        userId,
        resumeId: resume.id,
        age: profilePayload.age,
        education: profilePayload.education,
        skills: profilePayload.skills,
        workExperience: profilePayload.workExperience,
        internships: profilePayload.internships,
        achievements: profilePayload.achievements,
        swipyStartupId: profilePayload.swipyStartupId,
      })

      onCompleted(candidateProfile)
    } finally {
      setSaving(false)
    }
  }

  if (parsedData) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-glass-border bg-bg-secondary/40 p-3 text-sm text-text-secondary">
          Resume parsed successfully. Review and edit before continuing.
        </div>
        <ManualProfileForm
          userId={userId}
          initialData={{
            age: parsedData.age_if_mentioned,
            skills: parsedData.skills,
            education: parsedData.education,
            workExperience: parsedData.work_experience,
            internships: parsedData.internships,
            achievements: parsedData.achievements,
          }}
          onSubmit={handleSubmitProfile}
          submitLabel="Save profile and continue"
          submitting={saving}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div
        className="rounded-2xl border-2 border-dashed border-glass-border bg-bg-secondary/30 p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onFileChange(e.dataTransfer.files?.[0])
        }}
      >
        <i className="fas fa-file-upload text-2xl text-accent-primary mb-3"></i>
        <p className="text-text-primary font-medium mb-1">Upload resume</p>
        <p className="text-sm text-text-secondary mb-4">Drag and drop PDF/DOCX or choose a file.</p>

        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => onFileChange(e.target.files?.[0])}
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-accent-primary file:px-3 file:py-2 file:text-white file:cursor-pointer"
        />
      </div>

      {file && (
        <div className="rounded-xl border border-glass-border bg-bg-secondary/40 px-3 py-2 text-sm text-text-secondary">
          Selected: <span className="text-text-primary font-medium">{file.name}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleParse}
        disabled={!file || loadingParse}
        className="w-full rounded-xl bg-accent-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loadingParse ? 'Parsing resume...' : 'Parse resume with AI'}
      </button>
    </div>
  )
}

export default ResumeUploadDropzone
