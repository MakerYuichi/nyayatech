import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { caseId } = await req.json()

  const { data: c } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const doc = new jsPDF()
  const today = new Date().toLocaleDateString('en-IN')

  // Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('NOTICE OF DISPUTE AND OFFER FOR AMICABLE SETTLEMENT', 20, 20, { maxWidth: 170 })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${today}`, 20, 35)
  doc.text(`Case Reference: NYT-${c.id.slice(0,8).toUpperCase()}`, 20, 42)

  // To
  doc.setFont('helvetica', 'bold')
  doc.text('TO:', 20, 55)
  doc.setFont('helvetica', 'normal')
  doc.text(`${c.party_b_name}`, 20, 62)
  doc.text(`${c.party_b_email}`, 20, 69)
  doc.text(`${c.party_b_phone}`, 20, 76)

  // Body
  doc.setFont('helvetica', 'normal')
  const body = `
Take notice that our client, ${c.party_a_name}, has approached NyayaTech Infrastructure 
regarding a dispute of ₹${Number(c.dispute_amount).toLocaleString('en-IN')} arising from 
a ${c.dispute_type} matter.

Our client has compiled full evidentiary documentation regarding this matter. A formal 
Civil Plaint has been structured according to the relevant District Court formatting 
requirements, ready for direct e-filing.

Under the Mediation Act, 2023, we hereby extend a voluntary 14-day window to resolve 
this matter online via certified mediators empanelled on our platform.

Please note: If you decline this invitation and force this matter into open litigation, 
this notice and your refusal to mediate will be produced before the presiding judge 
to claim exemplary costs and damages under Section 35-A of the CPC for deliberately 
escalating avoidable litigation.

To respond to this notice, log in at: nyayatech.in/respond/${c.id}

This notice is issued on behalf of ${c.party_a_name} by NyayaTech Infrastructure 
Private Limited, operating as a technology infrastructure and administrative service 
provider under the Mediation Act, 2023.
  `.trim()

  doc.text(body, 20, 90, { maxWidth: 170 })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    'NyayaTech Infrastructure Pvt Ltd | Not a law firm | Does not provide legal advice',
    20, 275
  )

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="notice-${caseId}.pdf"`
    }
  })
}