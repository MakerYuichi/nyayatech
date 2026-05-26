import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import fs from 'fs'
import path from 'path'

const capitalize = (s: string) =>
  s ? s.replace(/\b\w/g, l => l.toUpperCase()) : ''

const DISPUTE_LABELS: Record<string, string> = {
  property: 'Property / Tenancy',
  payment:  'Payment Default',
  contract: 'Contract Breach',
  society:  'Society Dispute',
}

function loadImage(filename: string): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', filename)).toString('base64')
  } catch { return null }
}

function writeParagraph(
  doc: jsPDF, text: string,
  x: number, y: number,
  maxWidth: number, lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

export async function POST(req: NextRequest) {
  const { caseId } = await req.json()

  const { data: c } = await supabase
    .from('cases').select('*').eq('id', caseId).single()

  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const doc       = new jsPDF({ unit: 'mm', format: 'a4' })
  const today     = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const shortId   = 'NYT-' + c.id.slice(0, 8).toUpperCase()
  const amount    = `Rs. ${Number(c.dispute_amount).toLocaleString('en-IN')}`
  const dispLabel = DISPUTE_LABELS[c.dispute_type] || capitalize(c.dispute_type)

  // Layout
  const L   = 18    // left margin
  const R   = 192   // right edge
  const TW  = 174   // text width
  const LHP = 5.0   // tight paragraph line height
  const LH  = 5.5   // standard line height

  const watermark = loadImage('watermark.jpg')
  const symbol    = loadImage('symbol.png')

  // ── Watermark — correct aspect ratio: 3456×1992 = 1.735 wide ────────────
  // Place centered: width=174mm, height=174/1.735≈100mm, top at y=100 (vertical center)
  if (watermark) {
    const wmW = 174
    const wmH = Math.round(wmW / 1.735)   // ≈ 100mm — preserves original ratio
    const wmX = (210 - wmW) / 2           // centered horizontally on A4 (210mm wide)
    const wmY = (297 - wmH) / 2           // centered vertically on A4 (297mm tall)
    doc.addImage(watermark, 'JPEG', wmX, wmY, wmW, wmH)
  }

  // ── Borders ───────────────────────────────────────────────────────────────
  doc.setDrawColor(180, 150, 80)
  doc.setLineWidth(0.8)
  doc.rect(8, 8, 194, 281)
  doc.setLineWidth(0.3)
  doc.rect(11, 11, 188, 275)

  // ── Letterhead ────────────────────────────────────────────────────────────
  // Symbol top-left — correct aspect ratio 1.735 (landscape): 20mm wide × 11.5mm tall
  if (symbol) doc.addImage(symbol, 'PNG', L, 15, 20, 11.5)

  doc.setFontSize(12.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('NYAYATECH INFRASTRUCTURE PRIVATE LIMITED', 105, 20, { align: 'center' })

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text('Technology Infrastructure & Administrative Services  |  Mediation Act, 2023', 105, 25.5, { align: 'center' })
  doc.text('nyayatech.in  |  support@nyayatech.in', 105, 29.5, { align: 'center' })

  doc.setDrawColor(180, 150, 80)
  doc.setLineWidth(0.5); doc.line(L, 33, R, 33)
  doc.setLineWidth(0.2); doc.line(L, 34.2, R, 34.2)

  // ── Document title ────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30)
  doc.text('NOTICE OF DISPUTE AND OFFER FOR AMICABLE SETTLEMENT', 105, 41, { align: 'center' })
  doc.setDrawColor(180, 150, 80)
  doc.setLineWidth(0.2)
  doc.line(38, 43, 172, 43)

  // ── Ref + Date (right) ────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60)
  doc.text(`Ref: ${shortId}`, R, 49, { align: 'right' })
  doc.text(`Date: ${today}`,  R, 54, { align: 'right' })

  // ── Subject ───────────────────────────────────────────────────────────────
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text('Re:', L, 49)
  doc.setFont('helvetica', 'normal')
  const subjectLines = doc.splitTextToSize(
    `Pre-Litigation Dispute Notice — ${dispLabel} | ${amount} | Case Ref: ${shortId}`,
    TW - 10
  )
  doc.text(subjectLines, L + 8, 49)

  let y = 49 + subjectLines.length * LH + 2

  // ── TO block ──────────────────────────────────────────────────────────────
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text('TO,', L, y); y += LH
  doc.text(capitalize(c.party_b_name), L, y); y += LH

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60)
  if (c.party_b_address) {
    const al = doc.splitTextToSize(c.party_b_address, 120)
    doc.text(al, L, y); y += al.length * LH
  }
  if (c.party_b_phone) { doc.text(`Mobile: ${c.party_b_phone}`, L, y); y += LH }
  if (c.party_b_email) { doc.text(`Email: ${c.party_b_email}`,  L, y); y += LH }

  y += 3

  // ── Salutation ────────────────────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text(`Dear ${capitalize(c.party_b_name)},`, L, y)
  y += LH + 1

  doc.setDrawColor(180, 150, 80)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 4

  // ── Body — 4 paragraphs, font 9, tight spacing ────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(25)

  const paragraphs = [
    `We write on behalf of our client, ${capitalize(c.party_a_name)}, hereinafter referred to as "the Claimant," who has formally engaged NyayaTech Infrastructure Private Limited — a registered technology infrastructure and administrative services provider operating under the Mediation Act, 2023 — to seek structured, time-bound resolution of a ${dispLabel.toLowerCase()} matter involving a sum of ${amount}. The Claimant submits that this dispute has remained wholly unresolved despite prior communication and reasonable opportunity extended to you. Comprehensive evidentiary documentation, including all relevant agreements, correspondence, payment records, and transaction history, has been compiled and verified under Case Reference ${shortId}, filed on ${today}.`,

    `A formal Civil Plaint, drafted in strict accordance with the procedural requirements of the relevant District Court, stands in complete readiness for direct electronic submission via the Government of India's e-Courts portal, with all annexures, cause of action statements, and relief particulars duly verified. Notwithstanding this, and acting in good faith under the Mediation Act, 2023, the Claimant extends to you a voluntary 14-day window from the date of this notice to resolve this matter amicably through a structured online mediation session conducted by an independent certified neutral mediator empanelled on NyayaTech's platform. This offer is made entirely without prejudice to the Claimant's full legal rights and remedies, all of which are expressly reserved.`,

    `You are hereby put on formal notice that should you decline this invitation, ignore this communication, or fail to engage within the stipulated 14-day period, the Claimant shall immediately institute formal civil proceedings before the court of competent jurisdiction. This notice, the documentary record of your non-participation, and all verified case materials shall be produced before the presiding judge as grounds to seek exemplary costs, penal interest, and damages under Section 35-A of the Code of Civil Procedure, 1908, for the deliberate escalation of avoidable litigation.`,

    `To acknowledge receipt of this notice, contest any stated facts on record, or register your participation in the mediation process, you are required to access the NyayaTech respondent portal within 14 days at: nyayatech.in/respond/${c.id}. Failure to respond within this period will be treated as a deliberate refusal and recorded accordingly.`,
  ]

  for (const para of paragraphs) {
    y = writeParagraph(doc, para, L, y, TW, LHP)
    y += 3   // tight inter-paragraph gap
  }

  // ── Closing ───────────────────────────────────────────────────────────────
  y += 1
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(25)
  doc.text('Yours faithfully,', L, y)
  y += LH

  // ── Signature block ───────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(20)
  doc.text('NyayaTech Infrastructure Private Limited', L, y + 4.5)
  y += 9

  doc.setDrawColor(100)
  doc.setLineWidth(0.3)
  doc.line(L, y, L + 52, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(40)
  doc.text('Authorized Signatory', L, y);                               y += LH
  doc.text(`Issued on behalf of: ${capitalize(c.party_a_name)}`, L, y); y += LH
  doc.text(`Date of Issue: ${today}`, L, y)

  // ── Gold divider + footer ─────────────────────────────────────────────────
  doc.setDrawColor(180, 150, 80)
  doc.setLineWidth(0.4)
  doc.line(L, 268, R, 268)

  doc.setFontSize(6.2)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140)
  doc.text(
    doc.splitTextToSize(
      'NyayaTech Infrastructure Pvt Ltd is a technology infrastructure and administrative service provider registered under Indian law. It does not operate as a law firm, does not provide independent legal advice, and does not practice law under the Advocates Act, 1961. All dispute resolution services are facilitated through independent certified neutral professionals empanelled under the Mediation Act, 2023.',
      TW
    ),
    L, 272
  )

  return new NextResponse(Buffer.from(doc.output('arraybuffer')), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${shortId}-notice.pdf"`,
    },
  })
}
