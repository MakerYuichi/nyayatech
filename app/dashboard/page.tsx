'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const [cases, setCases] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    const { data } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })
    setCases(data || [])
  }

  const handleVerify = async (id: string, nextStatus: string) => {
    await supabase
      .from('cases')
      .update({ 
        paralegal_verified: true,
        paralegal_notes: notes,
        status: nextStatus
      })
      .eq('id', id)
    
    setSelected(null)
    setNotes('')
    fetchCases()
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Paralegal Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-6">
        
        {/* CASE LIST */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-600">
            Pending Review ({cases.filter(c => !c.paralegal_verified).length})
          </h2>
          {cases.map(c => (
            <div
              key={c.id}
              onClick={() => { setSelected(c); setNotes('') }}
              className={`p-3 rounded-lg border cursor-pointer hover:border-blue-400
                ${selected?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${c.paralegal_verified ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{c.party_a_name}</p>
                  <p className="text-gray-500 text-xs">vs {c.party_b_name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full
                  ${c.paralegal_verified 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-blue-600 text-sm font-medium mt-1">
                ₹{Number(c.dispute_amount).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>

        {/* CASE DETAIL */}
        {selected && (
          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Case Review</h2>
            
            <div className="text-sm space-y-1">
              <p><b>Claimant:</b> {selected.party_a_name}</p>
              <p><b>Email:</b> {selected.party_a_email}</p>
              <p><b>Phone:</b> {selected.party_a_phone}</p>
              <hr className="my-2"/>
              <p><b>Respondent:</b> {selected.party_b_name}</p>
              <p><b>Email:</b> {selected.party_b_email}</p>
              <p><b>Phone:</b> {selected.party_b_phone}</p>
              <hr className="my-2"/>
              <p><b>Type:</b> {selected.dispute_type}</p>
              <p><b>Amount:</b> ₹{Number(selected.dispute_amount).toLocaleString('en-IN')}</p>
              <p><b>Description:</b> {selected.dispute_description}</p>
            </div>

            <textarea
              className="w-full border rounded p-2 text-sm h-24"
              placeholder="Add paralegal notes, corrections, or flags..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleVerify(selected.id, 'under_review')}
                className="flex-1 bg-yellow-500 text-white py-2 rounded text-sm font-medium"
              >
                Flag for Review
              </button>
              <button
                onClick={() => handleVerify(selected.id, 'notice_sent')}
                className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium"
              >
                Verify & Send Notice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}