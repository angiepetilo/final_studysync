'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import { format } from 'date-fns'
import { 
  Upload, Trash2, FileText, Image as ImageIcon, Archive, 
  Filter, ChevronDown, List, Download,
  Table, ShieldCheck, PieChart, Search, File as LucideFile
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import UserNav from '@/components/UserNav'

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
  if (mime?.includes('pdf')) return { icon: FileText, bg: 'bg-red-50', text: 'text-red-500' }
  if (mime?.includes('image')) return { icon: ImageIcon, bg: 'bg-indigo-50', text: 'text-indigo-600' }
  if (mime?.includes('zip') || mime?.includes('rar') || mime?.includes('archive')) return { icon: Archive, bg: 'bg-amber-50', text: 'text-amber-500' }
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv')) return { icon: Table, bg: 'bg-emerald-50', text: 'text-emerald-500' }
  if (mime?.includes('word') || mime?.includes('document') || mime?.includes('docx')) return { icon: FileText, bg: 'bg-blue-50', text: 'text-blue-500' }
  return { icon: File, bg: 'bg-slate-50', text: 'text-slate-500' }
}

export default function FilesPage() {
  const supabase = createClient()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ id: string, full_name: string, email: string }>({ id: '', full_name: '', email: '' })
  
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  
  const [uploadForm, setUploadForm] = useState({ title: '', course_id: '' })
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    setUserProfile({ id: user.id, full_name: profile?.full_name || '', email: user.email || '' })

    const [filesRes, coursesRes] = await Promise.all([
      supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title, color').eq('user_id', user.id),
    ])
    setFiles(filesRes.data || [])
    setCourses(coursesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [supabase])

  const handleFileSelect = (file: globalThis.File) => {
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be under 50MB')
      return
    }
    setSelectedFile(file)
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
      description: uploadForm.title || selectedFile.name,
      course_id: uploadForm.course_id || null,
      folder_id: null,
    })

    setUploading(false)
    setSelectedFile(null)
    setUploadForm({ title: '', course_id: '' })
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

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  const displayFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalStorageUsedB = files.reduce((acc, f) => acc + f.size, 0)
  const storageLimitB = 5 * 1024 * 1024 * 1024 // 5GB limit as in mockup
  
  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FAFBFF] p-8 lg:p-12 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 mb-12">
        <h1 className="text-[1.75rem] font-black text-slate-900 tracking-tight shrink-0">File Vault</h1>
        
        <div className="flex items-center gap-4 shrink-0 ml-auto leading-none">
          <NotificationBell userId={userProfile.id} className="w-12 h-12 rounded-2xl bg-white border border-slate-100" iconSize={20} />
          <UserNav user={userProfile} />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col xl:flex-row gap-10 items-start">
        
        {/* Left Column - Upload Form */}
        <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-6">
          
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-slate-50">
            <h2 className="text-[1.5rem] font-black text-slate-900 leading-tight mb-8 pr-12 tracking-tight">
              Upload New<br/>Resource
            </h2>
            
            <div className="space-y-7">
              <div>
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-2.5 block px-1">Resource Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Advanced Calculus"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full bg-[#F5F6FC] border-none rounded-full px-5 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              
              <div>
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-2.5 block px-1">Course Assignment</label>
                <div className="relative">
                  <select 
                    value={uploadForm.course_id}
                    onChange={e => setUploadForm({...uploadForm, course_id: e.target.value})}
                    className="w-full bg-[#F5F6FC] border-none rounded-full px-5 py-3.5 text-sm font-bold text-slate-700 outline-none appearance-none pr-12 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="">Select a course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-2.5 block px-1">File Dropzone</label>
                
                <div 
                  className={`border-2 border-dashed rounded-[2rem] px-6 py-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden
                    ${dragOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-[#FAFBFF] hover:bg-slate-50'}`}
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
                  <div className="w-12 h-12 bg-[#EEF2FF] text-indigo-600 rounded-full flex items-center justify-center mb-5 shrink-0">
                    <Upload size={20} className="stroke-[2.5]" />
                  </div>
                  
                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">{formatSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[0.85rem] font-bold text-slate-900 mb-2.5 leading-snug">
                        Drag & drop or <br/><span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">browse</span>
                      </p>
                      <p className="text-[0.65rem] font-bold text-slate-400 leading-[1.6] max-w-[160px]">
                        Supports PDF, JPG,<br/>DOCX (Max 50MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              <button 
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`w-full py-4 rounded-full flex items-center justify-center gap-2.5 text-sm font-bold transition-all
                  ${!selectedFile || uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-[0_8px_20px_rgb(67,56,202,0.25)] hover:shadow-[0_12px_25px_rgb(67,56,202,0.3)] hover:-translate-y-0.5'}`}
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} className="stroke-[2.5]" />
                    Secure Upload
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Storage Card */}
          <div className="bg-[#F3F4FB] rounded-full px-8 py-5 flex items-center justify-between border border-slate-100">
            <div className="space-y-0.5">
              <h4 className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest">Vault Storage</h4>
              <p className="text-[0.85rem] font-black text-slate-900">
                {formatSize(totalStorageUsedB)} of 5 GB used
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100/50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <PieChart size={18} className="stroke-[2.5]" />
            </div>
          </div>
          
        </div>

        {/* Right Column - File Library */}
        <div className="flex-1 flex flex-col min-w-0 w-full xl:pl-4">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[1.75rem] font-black text-slate-900 tracking-tight">File Library</h2>
            
            <div className="flex items-center gap-2.5">
              <button className="w-10 h-10 bg-slate-100/80 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <List size={18} className="stroke-[2.5]" />
              </button>
              <button className="w-10 h-10 bg-slate-100/80 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <Filter size={18} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-12 items-start auto-rows-max">
            {displayFiles.map((file) => {
              const { icon: FileIcon, bg, text } = getFileIcon(file.mime_type)
              const course = getCourse(file.course_id)
              
              return (
                <div 
                  key={file.id} 
                  onClick={() => handleDownload(file)}
                  className="bg-white rounded-[2rem] p-7 shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-50/50 flex flex-col justify-between h-[180px] group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all relative overflow-hidden"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${text} shrink-0`}>
                    <LucideFile size={20} className="stroke-[2.5]" />
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-900 truncate mt-auto mb-3" title={file.description || file.name}>
                    {file.description || file.name}
                  </h3>
                  
                  <div className="flex items-center justify-between shrink-0">
                    {course ? (
                      <div className="bg-[#F5F6FC] text-slate-600 px-3.5 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest truncate max-w-[65%]">
                        {course.title}
                      </div>
                    ) : (
                      <div className="bg-slate-50 text-slate-400 px-3.5 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest truncate max-w-[65%] border border-slate-100/50">
                        Untagged
                      </div>
                    )}
                    
                    <div className="text-slate-400 text-[0.7rem] font-bold uppercase tracking-wider">
                      {formatSize(file.size)}
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                      className="w-8 h-8 rounded-full bg-slate-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                      title="Download File"
                    >
                      <Download size={14} className="stroke-[2.5]" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(file.id); }}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      title="Delete File"
                    >
                      <Trash2 size={14} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )
            })}

            {displayFiles.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 mb-6 shadow-sm border border-slate-50">
                  <Search size={36} className="stroke-[2]" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No files found</h3>
                <p className="text-sm font-semibold text-slate-400">Upload documents or adjust your search.</p>
              </div>
            )}
          </div>

        </div>
      </div>
      
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete File" message="This file will be permanently deleted from storage." />
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
    </div>
  )
}
