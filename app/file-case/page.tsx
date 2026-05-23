'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FileCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    party_a_name: '',
    party_a_email: '',
    party_a_phone: '',
    party_b_name: '',
    party_b_email: '',
    party_b_phone: '',
    dispute_type: 'property',
    dispute_amount: '',
    dispute_description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('cases')
      .insert([form])
      .select()

    if (error) {
      alert('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push(`/case/${data[0].id}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">File Your Dispute</h1>
      <p className="text-gray-500 mb-8">
        Fill in the details below. A trained paralegal will review 
        your case within 24 hours.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* YOUR DETAILS */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h2 className="font-semibold text-gray-700">Your Details</h2>
          <input
            className="w-full border rounded p-2"
            placeholder="Your Full Name"
            required
            value={form.party_a_name}
            onChange={e => setForm({...form, party_a_name: e.target.value})}
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Your Email"
            type="email"
            required
            value={form.party_a_email}
            onChange={e => setForm({...form, party_a_email: e.target.value})}
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Your Phone Number"
            required
            value={form.party_a_phone}
            onChange={e => setForm({...form, party_a_phone: e.target.value})}
          />
        </div>

        {/* OPPOSING PARTY */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h2 className="font-semibold text-gray-700">Opposing Party Details</h2>
          <input
            className="w-full border rounded p-2"
            placeholder="Their Full Name"
            required
            value={form.party_b_name}
            onChange={e => setForm({...form, party_b_name: e.target.value})}
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Their Email (if known)"
            type="email"
            value={form.party_b_email}
            onChange={e => setForm({...form, party_b_email: e.target.value})}
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Their Phone Number (if known)"
            value={form.party_b_phone}
            onChange={e => setForm({...form, party_b_phone: e.target.value})}
          />
        </div>

        {/* DISPUTE DETAILS */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h2 className="font-semibold text-gray-700">Dispute Details</h2>
          <select
            className="w-full border rounded p-2"
            value={form.dispute_type}
            onChange={e => setForm({...form, dispute_type: e.target.value})}
          >
            <option value="property">Property / Tenancy</option>
            <option value="payment">Payment Default</option>
            <option value="contract">Contract Breach</option>
            <option value="society">Society Dispute</option>
          </select>
          <input
            className="w-full border rounded p-2"
            placeholder="Amount in Dispute (₹)"
            type="number"
            required
            value={form.dispute_amount}
            onChange={e => setForm({...form, dispute_amount: e.target.value})}
          />
          <textarea
            className="w-full border rounded p-2 h-32"
            placeholder="Describe your dispute clearly. Include dates, amounts, and what you want resolved."
            required
            value={form.dispute_description}
            onChange={e => setForm({...form, dispute_description: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg 
                     font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit My Case →'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By submitting, you agree to our Terms of Service. 
          NyayaTech does not provide legal advice.
        </p>
      </form>
    </div>
  )
}