'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import Modal from '@/components/Modal'
import { format } from 'date-fns'
import { FolderOpen, Upload, Download, Trash2, FileText, Image, Archive, Table, File, Plus, ChevronRight, FolderPlus, ArrowLeft, Folder } from 'lucide-react'

interface FileEntry {
  id: string
  name: string
  storage_path: string
  size: number
  mime_type: string
  description: string
  course_id: string | null
  folder_id: string | null
  created_at: string
}

interface FolderEntry {
  id: string
  name: string
  parent_id: string | null
  created_at: string
}

interface Course {
  id: string
  title: string
  color: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function getFileIcon(mime: string) {
  if (mime?.includes('pdf')) return { icon: FileText, color: '#ef4444' }
  if (mime?.includes('image')) return { icon: Image, color: '#8b5cf6' }
  if (mime?.includes('zip') || mime?.includes('rar') || mime?.includes('archive')) return { icon: Archive, color: '#f59e0b' }
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return { icon: Table, color: '#10b981' }
  return { icon: File, color: 'var(--muted)' }
}

export default function FilesPage() {
  const supabase = createClient()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [folders, setFolders] = useState<FolderEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadForm, setUploadForm] = useState({ description: '', course_id: '' })
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<FolderEntry[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [filesRes, coursesRes, foldersRes] = await Promise.all([
      supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title, color').eq('user_id', user.id),
      supabase.from('folders').select('*').eq('user_id', user.id).order('name', { ascending: true }),
    ])
    setFiles(filesRes.data || [])
    setCourses(coursesRes.data || [])
    setFolders(foldersRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [supabase])

  // Build breadcrumb path
  useEffect(() => {
    if (!currentFolderId) {
      setFolderPath([])
      return
    }
    const buildPath = (folderId: string): FolderEntry[] => {
      const folder = folders.find(f => f.id === folderId)
      if (!folder) return []
      if (folder.parent_id) return [...buildPath(folder.parent_id), folder]
      return [folder]
    }
    setFolderPath(buildPath(currentFolderId))
  }, [currentFolderId, folders])

  const currentFolders = folders.filter(f => f.parent_id === currentFolderId)
  const currentFiles = files.filter(f => f.folder_id === currentFolderId)

  const handleFileSelect = (file: globalThis.File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be under 20MB')
      return
    }
    setSelectedFile(file)
    setShowUploadForm(true)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const filePath = `${user.id}/${Date.now()}_${selectedFile.name}`
    const { error: storageError } = await supabase.storage.from('files').upload(filePath, selectedFile)

    if (storageError) {
      alert('Upload failed: ' + storageError.message)
      setUploading(false)
      return
    }

    await supabase.from('files').insert({
      user_id: user.id,
      name: selectedFile.name,
      storage_path: filePath,
      size: selectedFile.size,
      mime_type: selectedFile.type,
      description: uploadForm.description || null,
      course_id: uploadForm.course_id || null,
      folder_id: currentFolderId,
    })

    setUploading(false)
    setShowUploadForm(false)
    setSelectedFile(null)
    setUploadForm({ description: '', course_id: '' })
    fetchData()
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('folders').insert({
      user_id: user.id,
      name: newFolderName.trim(),
      parent_id: currentFolderId,
    })
    setNewFolderName('')
    setShowNewFolder(false)
    fetchData()
  }

  const handleDownload = async (file: FileEntry) => {
    const { data } = await supabase.storage.from('files').createSignedUrl(file.storage_path, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const file = files.find(f => f.id === deleteId)
    if (file) {
      await supabase.storage.from('files').remove([file.storage_path])
      await supabase.from('files').delete().eq('id', deleteId)
    }
    setDeleteId(null)
    fetchData()
  }

  const handleDeleteFolder = async () => {
    if (!deleteFolderId) return
    await supabase.from('folders').delete().eq('id', deleteFolderId)
    setDeleteFolderId(null)
    fetchData()
  }

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">File Vault</h1>
          <p className="page-subtitle">{files.length} file{files.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewFolder(true)}>
          <FolderPlus size={16} /> New Folder
        </button>
      </div>

      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setCurrentFolderId(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: currentFolderId ? 500 : 700, color: currentFolderId ? 'var(--accent)' : 'var(--foreground)', padding: 0 }}
        >
          My Files
        </button>
        {folderPath.map((f) => (
          <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronRight size={14} color="var(--muted)" />
            <button
              onClick={() => setCurrentFolderId(f.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: f.id === currentFolderId ? 700 : 500, color: f.id === currentFolderId ? 'var(--foreground)' : 'var(--accent)', padding: 0 }}
            >
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/* New Folder Form */}
      {showNewFolder && (
        <div className="card animate-slideInUp" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FolderPlus size={20} color="var(--accent)" />
          <input
            className="input"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</button>
          <button className="btn btn-secondary" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>Cancel</button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
        onClick={() => fileInputRef.current?.click()}
        className="card"
        style={{
          textAlign: 'center', padding: '2rem 2rem', marginBottom: '1.5rem', cursor: 'pointer',
          border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
          background: dragOver ? 'var(--accent-bg)' : 'var(--card)',
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
        />
        <Upload size={28} color={dragOver ? 'var(--accent)' : 'var(--muted)'} style={{ margin: '0 auto 0.5rem' }} />
        <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Drag & drop a file here, or click to browse</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Maximum file size: 20MB</p>
      </div>

      {/* Upload Form Panel */}
      {showUploadForm && selectedFile && (
        <div className="card animate-slideInUp" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label">File</label>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{selectedFile.name} ({formatSize(selectedFile.size)})</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label">Description</label>
            <input className="input" placeholder="Add a memo..." value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} />
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="label">Course</label>
            <select className="input" value={uploadForm.course_id} onChange={(e) => setUploadForm({ ...uploadForm, course_id: e.target.value })}>
              <option value="">None</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? <span className="spinner" /> : <><Upload size={16} /> Upload</>}
          </button>
          <button className="btn btn-secondary" onClick={() => { setShowUploadForm(false); setSelectedFile(null) }}>Cancel</button>
        </div>
      )}

      {/* Folders */}
      {currentFolders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }} className="stagger-children">
          {currentFolders.map(folder => (
            <div
              key={folder.id}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', cursor: 'pointer', position: 'relative' }}
              onClick={() => setCurrentFolderId(folder.id)}
            >
              <div style={{ width: 36, height: 36, borderRadius: '0.75rem', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Folder size={18} color="var(--accent)" />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                  {files.filter(f => f.folder_id === folder.id).length} files
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteFolderId(folder.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--muted)', opacity: 0.5 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {currentFiles.length === 0 && currentFolders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <FolderOpen size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{currentFolderId ? 'This folder is empty' : 'No files yet'}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Upload files using the drop zone above{currentFolderId ? '' : ' or create a folder'}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="stagger-children">
          {currentFiles.map(file => {
            const { icon: FileIcon, color: iconColor } = getFileIcon(file.mime_type)
            const course = getCourse(file.course_id)
            return (
              <div key={file.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: `${iconColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileIcon size={20} color={iconColor} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.125rem' }}>
                    <span>{formatSize(file.size)}</span>
                    <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                    {file.description && <span>· {file.description}</span>}
                  </div>
                </div>
                {course && <span className="badge" style={{ background: `${course.color}15`, color: course.color }}>{course.title}</span>}
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button onClick={() => handleDownload(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.5rem', color: 'var(--accent)' }}><Download size={16} /></button>
                  <button onClick={() => setDeleteId(file.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.5rem', color: 'var(--muted)' }}><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete File" message="This file will be permanently deleted from storage." />
      <ConfirmDialog isOpen={!!deleteFolderId} onClose={() => setDeleteFolderId(null)} onConfirm={handleDeleteFolder} title="Delete Folder" message="This folder and all files inside it will be deleted." />
    </div>
  )
}
