'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { 
  Upload, Trash2, FileText, Image as ImageIcon, Archive, 
  Filter, ChevronDown, List, Download,
  Table, ShieldCheck, PieChart, Search, File as LucideFile
} from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { useData } from '@/context/DataContext'

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
  source?: 'vault' | 'collaboration'
  source_name?: string
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
  if (mime?.includes('pdf')) return { icon: FileText, bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-500 dark:text-red-400' }
  if (mime?.includes('image')) return { icon: ImageIcon, bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400' }
  if (mime?.includes('zip') || mime?.includes('rar') || mime?.includes('archive')) return { icon: Archive, bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-500 dark:text-amber-400' }
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return { icon: Table, bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-500 dark:text-emerald-400' }
  if (mime?.includes('word') || mime?.includes('document') || mime?.includes('docx')) return { icon: FileText, bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-500 dark:text-blue-400' }
  return { icon: LucideFile, bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-500 dark:text-slate-400' }
}

export default function FilesPage() {
  const supabase = createClient()
  const { user, courses: globalCourses, refreshData, loading: contextLoading } = useData()
  
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  
  const [uploadForm, setUploadForm] = useState({ title: '', course_id: '' })
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const courses = globalCourses

  const fetchFiles = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    // 1. Fetch from 'files' table
    const { data: vaultFiles } = await supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    
    // 2. Fetch from 'collaboration_messages'
    const { data: collabMessages } = await supabase
      .from('collaboration_messages')
      .select('*, collaborations(title)')
      .or('message_type.eq.file,message_type.eq.image')
      .not('file_url', 'is', null)
    
    const formattedCollabFiles: FileEntry[] = (collabMessages || []).map((m: any) => ({
      id: m.id,
      name: m.file_name || 'Shared File',
      storage_path: m.file_url, // Using URL as path for Collab files
      size: 0, // We might not have size here
      mime_type: m.file_type || (m.message_type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
      description: m.content || m.file_name,
      course_id: null,
      folder_id: null,
      created_at: m.created_at,
      source: 'collaboration',
      source_name: m.collaborations?.title
    }))

    const allFiles = [
      ...(vaultFiles || []).map((f: any) => ({ ...f, source: 'vault' as const })),
      ...formattedCollabFiles
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFiles(allFiles)
    setLoading(false)
  }, [user, supabase, setFiles, setLoading])

  useEffect(() => {
    if (!contextLoading && user) {
      fetchFiles()
    } else if (!contextLoading && !user) {
      setLoading(false)
    }
  }, [user, contextLoading, fetchFiles])

  const handleFileSelect = (file: globalThis.File) => {
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be under 50MB')
      return
    }
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return
    setUploading(true)

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
      description: uploadForm.title || selectedFile.name,
      course_id: uploadForm.course_id || null,
      folder_id: null,
    })

    setUploading(false)
    setSelectedFile(null)
    setUploadForm({ title: '', course_id: '' })
    fetchFiles()
    refreshData()
  }

  const handleDownload = async (file: FileEntry) => {
    if (file.source === 'collaboration') {
       window.open(file.storage_path, '_blank')
       return
    }
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
    fetchFiles()
  }

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  const displayFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalStorageUsedB = files.reduce((acc, f) => acc + f.size, 0)
  
  if (loading || contextLoading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <PageLayout>
      <PageHeader 
        title="File Vault"
        subtitle="Securely store and manage your academic resources."
        action={
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={16} />
            <input 
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
            />
          </div>
        }
      />

      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Upload & Stats */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-8">
            <Card className="p-8 md:p-10">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Upload Resource</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Resource Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. Advanced Calculus"
                    value={uploadForm.title}
                    onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Course Assignment</label>
                  <div className="relative group">
                    <select 
                      value={uploadForm.course_id}
                      onChange={e => setUploadForm({...uploadForm, course_id: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 outline-none appearance-none focus:ring-4 focus:ring-indigo-500/5 cursor-pointer transition-all"
                    >
                      <option value="">Select a course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">File Dropzone</label>
                  
                  <div 
                    className={`border-2 border-dashed rounded-2xl px-6 py-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden
                      ${dragOver ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 shrink-0">
                      <Upload size={20} />
                    </div>
                    
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-[0.65rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{formatSize(selectedFile.size)}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-black text-slate-900 dark:text-white mb-2 leading-snug">
                          Drag & drop or <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-200 dark:decoration-indigo-800 underline-offset-4">browse</span>
                        </p>
                        <p className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-600 leading-[1.6] max-w-[220px]">
                          PDF, JPG, DOCX (Max 50MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] mt-4 tracking-wider uppercase text-[0.7rem] flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={18} strokeWidth={3} />
                      Secure Upload
                    </>
                  )}
                </button>
              </div>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-8 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-[0.6rem] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Vault Storage</h4>
                <p className="text-[0.85rem] font-black text-slate-900 dark:text-white">
                  {formatSize(totalStorageUsedB)} of 5 GB used
                </p>
              </div>
              <div className="w-10 h-10 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <PieChart size={18} />
              </div>
            </Card>
          </div>

          {/* Right Column: File Library */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Resources</h2>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                  <List size={18} />
                </button>
                <button className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                  <Filter size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 pb-12 items-start auto-rows-max">
              {displayFiles.map((file) => {
                const { icon: FileIcon, bg, text } = getFileIcon(file.mime_type)
                const course = getCourse(file.course_id)
                
                return (
                  <Card 
                    key={file.id} 
                    onClick={() => handleDownload(file)}
                    className="p-7 flex flex-col justify-between h-[180px] group cursor-pointer transition-all relative overflow-hidden"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${text} shrink-0 mb-4`}>
                      <FileIcon size={20} strokeWidth={2.5} />
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate mt-auto mb-3 pr-20" title={file.description || file.name}>
                      {file.description || file.name}
                    </h3>
                    
                    <div className="flex items-center justify-between shrink-0">
                      {file.source === 'collaboration' ? (
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest truncate max-w-[65%] border border-indigo-100/50 dark:border-indigo-900/30">
                          {file.source_name || 'Collaboration'}
                        </div>
                      ) : course ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-3.5 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest truncate max-w-[65%]">
                          {course.title}
                        </div>
                      ) : (
                        <div className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600 px-3.5 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest truncate max-w-[65%] border border-slate-100 dark:border-slate-800">
                          Vault
                        </div>
                      )}
                      
                      <div className="text-slate-400 dark:text-slate-600 text-[0.7rem] font-black uppercase tracking-wider">
                        {formatSize(file.size)}
                      </div>
                    </div>

                    <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-lg shadow-indigo-100 dark:shadow-none border border-indigo-100 dark:border-indigo-900/30"
                        title="Download File"
                      >
                        <Download size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(file.id); }}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-100 dark:shadow-none border border-red-100 dark:border-red-900/30"
                        title="Delete File"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </Card>
                )
              })}

              {displayFiles.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/10 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-800 mb-6 shadow-sm">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No files found</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-600">Upload documents or adjust your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDialog 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete File" 
        message="This file will be permanently deleted from storage." 
      />
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
    </PageLayout>
  )
}
