'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_STEPS = [
  { key: 'submitted', label: 'Case Submitted' },
  { key: 'under_review', label: 'Paralegal Review' },
  { key: 'notice_sent', label: 'Notice Dispatched' },
  { key: 'mediation', label: 'Mediation Scheduled' },
  { key: 'resolved', label: 'Resolved' },
]

export default function CasePage({ params }: { params: { id: string } }) {
  const [caseData, setCaseData] = useState<any>(null)

  useEffect(() => {
    const fetchCase = async () => {
      const { data } = await supabase
        .from('cases')
        .select('*')
        .eq('id', params.id)
        .single()
      setCaseData(data)
    }
    fetchCase()
  }, [params.id])

  if (!caseData) return (
    <div className="max-w-2xl mx-auto p-6">
      <p>Loading your case...</p>
    </div>
  )

  const currentStepIndex = STATUS_STEPS
    .findIndex(s => s.key === caseData.status)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Your Case</h1>
      <p className="text-gray-400 text-sm mb-8">Case ID: {caseData.id}</p>

      {/* STATUS TRACKER */}
      <div className="mb-8">
        {STATUS_STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center 
              justify-center text-sm font-bold
              ${index <= currentStepIndex 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-400'}`}>
              {index < currentStepIndex ? '✓' : index + 1}
            </div>
            <span className={index <= currentStepIndex 
              ? 'text-gray-900 font-medium' 
              : 'text-gray-400'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* CASE SUMMARY */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h2 className="font-semibold mb-3">Case Summary</h2>
        <p><span className="text-gray-500">Dispute Type:</span> {caseData.dispute_type}</p>
        <p><span className="text-gray-500">Amount:</span> ₹{Number(caseData.dispute_amount).toLocaleString('en-IN')}</p>
        <p><span className="text-gray-500">Opposing Party:</span> {caseData.party_b_name}</p>
        <p><span className="text-gray-500">Filed:</span> {new Date(caseData.created_at).toLocaleDateString('en-IN')}</p>
      </div>

      {/* PARALEGAL NOTE */}
      {caseData.paralegal_notes && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-1">
            Paralegal Note
          </h3>
          <p className="text-blue-700 text-sm">{caseData.paralegal_notes}</p>
        </div>
      )}
    </div>
  )
}