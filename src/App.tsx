import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

type Status = 'New Lead' | 'Contacted' | 'Under Review' | 'Under Process' | 'Approved' | 'Disbursed' | 'Rejected'
type LoanLead = {
  id: string
  lead_date: string
  customer_name: string
  contact_no: string
  customer_address: string
  loan_type: string
  loan_amount: number
  advisor_name: string
  lead_owner: string
  file_sent_to: string
  status: Status
  disbursed_amount: number | null
  disbursed_date: string | null
  bank_name: string
  payout_received: number
  payout_to_advisor: number
  net_payout: number
}
type LeadForm = Omit<LoanLead, 'id' | 'net_payout'>

const statuses: Status[] = ['New Lead', 'Contacted', 'Under Review', 'Under Process', 'Approved', 'Disbursed', 'Rejected']
const loanTypes = ['Home Loan', 'Personal Loan', 'Business Loan', 'Loan Against Property', 'Vehicle Loan', 'Education Loan']
const initialForm: LeadForm = {
  lead_date: new Date().toISOString().slice(0, 10), customer_name: '', contact_no: '', customer_address: '', loan_type: 'Home Loan',
  loan_amount: 0, advisor_name: '', lead_owner: '', file_sent_to: '', status: 'New Lead', disbursed_amount: null,
  disbursed_date: null, bank_name: '', payout_received: 0, payout_to_advisor: 0,
}

const currency = (value: number | null | undefined) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0)
const compactCurrency = (value: number) => value >= 10000000 ? `₹${(value / 10000000).toFixed(1)}Cr` : value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : currency(value)
const dateLabel = (value: string) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))

function App() {
  const [leads, setLeads] = useState<LoanLead[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All statuses' | Status>('All statuses')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<LeadForm>(initialForm)
  const [activeView, setActiveView] = useState<'overview' | 'leads'>('overview')
  const [mobileNav, setMobileNav] = useState(false)

  const loadLeads = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase.from('loan_leads').select('*').order('lead_date', { ascending: false })
    if (fetchError) setError('We could not load the lead register. Please refresh and try again.')
    else setLeads((data || []) as LoanLead[])
    setLoading(false)
  }

  useEffect(() => { void loadLeads() }, [])

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const text = `${lead.customer_name} ${lead.contact_no} ${lead.loan_type} ${lead.advisor_name} ${lead.bank_name}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (statusFilter === 'All statuses' || lead.status === statusFilter)
  }), [leads, query, statusFilter])

  const stats = useMemo(() => ({
    total: leads.length,
    pipeline: leads.filter((lead) => !['Rejected', 'Disbursed'].includes(lead.status)).reduce((sum, lead) => sum + Number(lead.loan_amount), 0),
    disbursed: leads.filter((lead) => lead.status === 'Disbursed').reduce((sum, lead) => sum + Number(lead.disbursed_amount || 0), 0),
    netPayout: leads.reduce((sum, lead) => sum + Number(lead.net_payout || 0), 0),
  }), [leads])

  const updateForm = <K extends keyof LeadForm>(key: K, value: LeadForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const openNewLead = () => { setForm(initialForm); setError(''); setShowForm(true) }

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true); setError('')
    const payload = { ...form, loan_amount: Number(form.loan_amount), disbursed_amount: form.status === 'Disbursed' ? Number(form.disbursed_amount || 0) : null, payout_received: form.status === 'Disbursed' ? Number(form.payout_received || 0) : 0, payout_to_advisor: form.status === 'Disbursed' ? Number(form.payout_to_advisor || 0) : 0 }
    const { data, error: saveError } = await supabase.from('loan_leads').insert(payload).select().maybeSingle()
    if (saveError || !data) { setError('We could not save this lead. Please check the details and try again.'); setSaving(false); return }
    setLeads((current) => [data as LoanLead, ...current]); setShowForm(false); setForm(initialForm); setSaving(false)
  }

  const statusClass = (status: Status) => status.toLowerCase().replaceAll(' ', '-')

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup"><img src="/LOGO.png" alt="APEX Financial Solutions" /><div><strong>APEX</strong><span>Financial Solutions</span></div></div>
        <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20} /></button>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <button className={activeView === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('overview'); setMobileNav(false) }}><LayoutDashboard size={18} /> Overview</button>
          <button className={activeView === 'leads' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveView('leads'); setMobileNav(false) }}><ClipboardList size={18} /> Lead register <span className="nav-count">{leads.length}</span></button>
        </nav>
        <div className="sidebar-bottom"><div className="advisor-badge">AF</div><div><strong>APEX Desk</strong><span>Guwahati branch</span></div><ChevronDown size={16} /></div>
      </aside>
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={22} /></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{activeView === 'overview' ? 'Overview' : 'Lead register'}</strong></div><div className="topbar-right"><span className="live-dot" /> <span>Workspace synced</span><div className="top-avatar">AF</div></div></header>
        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow">GOOD MORNING, APEX DESK</p><h1>{activeView === 'overview' ? 'Loan desk overview' : 'Lead register'}</h1><p className="heading-sub">Manage your loan pipeline and payout performance from one place.</p></div><button className="primary-button" onClick={openNewLead}><Plus size={18} /> Add new lead</button></div>
          {error && <div className="alert"><span>{error}</span><button onClick={() => setError('')}><X size={16} /></button></div>}
          {activeView === 'overview' && <><section className="stats-grid"><StatCard icon={<Users size={20} />} label="Total leads" value={String(stats.total)} note="All time entries" color="blue" /><StatCard icon={<TrendingUp size={20} />} label="Active pipeline" value={compactCurrency(stats.pipeline)} note="Excluding disbursed" color="gold" /><StatCard icon={<CircleDollarSign size={20} />} label="Total disbursed" value={compactCurrency(stats.disbursed)} note="Across all banks" color="green" /><StatCard icon={<ArrowUpRight size={20} />} label="Net payout" value={compactCurrency(stats.netPayout)} note="Received less advisor payout" color="navy" /></section><section className="content-grid"><div className="panel lead-panel"><PanelHeader title="Recent leads" action={<button className="text-button" onClick={() => setActiveView('leads')}>View all <ArrowUpRight size={15} /></button>} /><LeadTable leads={filteredLeads.slice(0, 5)} loading={loading} statusClass={statusClass} emptyAction={openNewLead} /></div><div className="panel pipeline-panel"><PanelHeader title="Pipeline snapshot" /><div className="pipeline-list">{statuses.slice(0, 6).map((status) => { const count = leads.filter((lead) => lead.status === status).length; const percent = leads.length ? Math.round((count / leads.length) * 100) : 0; return <div className="pipeline-row" key={status}><div><span className={`mini-dot ${statusClass(status)}`} /><span>{status}</span><strong>{count}</strong></div><div className="progress-track"><div className={`progress-fill ${statusClass(status)}`} style={{ width: `${Math.max(percent, count ? 7 : 0)}%` }} /></div></div> })}</div><div className="address-card"><div className="address-icon"><BriefcaseBusiness size={17} /></div><div><strong>APEX Financial Solutions</strong><span>29, MG Path, Christianbasti<br />Guwahati — 781005</span></div></div></div></section></>}
          {activeView === 'leads' && <section className="panel register-panel"><div className="register-toolbar"><div className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by customer, advisor or bank" /></div><div className="filter-select"><Filter size={16} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All statuses' | Status)}><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div></div><LeadTable leads={filteredLeads} loading={loading} statusClass={statusClass} emptyAction={openNewLead} /></section>}
        </div>
      </main>
      {showForm && <div className="modal-backdrop"><div className="modal"><div className="modal-header"><div><p className="eyebrow">NEW ENTRY</p><h2>Add a new lead</h2><p>Capture the customer details to begin tracking this file.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close form"><X size={20} /></button></div><form onSubmit={submitLead}><div className="form-section"><div className="section-title"><span>01</span><div><strong>Lead details</strong><small>Basic information about this opportunity</small></div></div><div className="form-grid"><Field label="Lead date"><input required type="date" value={form.lead_date} onChange={(event) => updateForm('lead_date', event.target.value)} /></Field><Field label="Customer name"><input required placeholder="e.g. Rahul Sharma" value={form.customer_name} onChange={(event) => updateForm('customer_name', event.target.value)} /></Field><Field label="Contact number"><input required type="tel" placeholder="+91 98765 43210" value={form.contact_no} onChange={(event) => updateForm('contact_no', event.target.value)} /></Field><Field label="Loan type"><select value={form.loan_type} onChange={(event) => updateForm('loan_type', event.target.value)}>{loanTypes.map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Loan amount"><div className="input-prefix"><span>₹</span><input required type="number" min="0" value={form.loan_amount || ''} onChange={(event) => updateForm('loan_amount', Number(event.target.value))} placeholder="0" /></div></Field><Field label="Address" wide><textarea required rows={2} placeholder="Customer correspondence address" value={form.customer_address} onChange={(event) => updateForm('customer_address', event.target.value)} /></Field></div></div><div className="form-section"><div className="section-title"><span>02</span><div><strong>Assignment & status</strong><small>Route the file to the right people</small></div></div><div className="form-grid"><Field label="Advisor name"><input placeholder="Advisor handling the file" value={form.advisor_name} onChange={(event) => updateForm('advisor_name', event.target.value)} /></Field><Field label="Lead owner"><input placeholder="Internal owner" value={form.lead_owner} onChange={(event) => updateForm('lead_owner', event.target.value)} /></Field><Field label="File sent to"><input placeholder="Bank or channel partner" value={form.file_sent_to} onChange={(event) => updateForm('file_sent_to', event.target.value)} /></Field><Field label="Current status"><select value={form.status} onChange={(event) => updateForm('status', event.target.value as Status)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></Field></div></div>{form.status === 'Disbursed' && <div className="form-section disbursed-section"><div className="section-title"><span>03</span><div><strong>Disbursement & payout</strong><small>Visible because this file is marked disbursed</small></div></div><div className="form-grid"><Field label="Disbursed amount"><div className="input-prefix"><span>₹</span><input required type="number" min="0" value={form.disbursed_amount || ''} onChange={(event) => updateForm('disbursed_amount', Number(event.target.value))} placeholder="0" /></div></Field><Field label="Disbursed date"><input required type="date" value={form.disbursed_date || ''} onChange={(event) => updateForm('disbursed_date', event.target.value)} /></Field><Field label="Bank name"><input required placeholder="e.g. HDFC Bank" value={form.bank_name} onChange={(event) => updateForm('bank_name', event.target.value)} /></Field><Field label="Payout received from bank"><div className="input-prefix"><span>₹</span><input type="number" min="0" value={form.payout_received || ''} onChange={(event) => updateForm('payout_received', Number(event.target.value))} placeholder="0" /></div></Field><Field label="Payout to advisor"><div className="input-prefix"><span>₹</span><input type="number" min="0" value={form.payout_to_advisor || ''} onChange={(event) => updateForm('payout_to_advisor', Number(event.target.value))} placeholder="0" /></div></Field><div className="net-preview"><span>Estimated net payout</span><strong>{currency(Number(form.payout_received || 0) - Number(form.payout_to_advisor || 0))}</strong></div></div></div>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving lead…' : <><Check size={17} /> Save lead</>}</button></div></form></div></div>}
    </div>
  )
}

function StatCard({ icon, label, value, note, color }: { icon: ReactNode; label: string; value: string; note: string; color: string }) { return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div> }
function PanelHeader({ title, action }: { title: string; action?: ReactNode }) { return <div className="panel-header"><h2>{title}</h2>{action}</div> }
function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? 'field wide' : 'field'}><span>{label}</span>{children}</label> }
function LeadTable({ leads, loading, statusClass, emptyAction }: { leads: LoanLead[]; loading: boolean; statusClass: (status: Status) => string; emptyAction: () => void }) { return <div className="table-wrap">{loading ? <div className="loading-state"><Clock3 size={18} /> Loading your lead register…</div> : leads.length === 0 ? <div className="empty-state"><div className="empty-icon"><FileText size={22} /></div><strong>No leads found</strong><span>Start building your pipeline by adding your first customer lead.</span><button className="text-button" onClick={emptyAction}>Add first lead <Plus size={15} /></button></div> : <table><thead><tr><th>Customer</th><th>Loan type</th><th>Amount</th><th>Advisor</th><th>Status</th><th>Date</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><div className="customer-cell"><div className="customer-avatar">{lead.customer_name.slice(0, 2).toUpperCase()}</div><div><strong>{lead.customer_name}</strong><span>{lead.contact_no}</span></div></div></td><td>{lead.loan_type}</td><td><strong>{currency(Number(lead.loan_amount))}</strong></td><td>{lead.advisor_name || '—'}</td><td><span className={`status-pill ${statusClass(lead.status)}`}><span />{lead.status}</span></td><td className="date-cell">{dateLabel(lead.lead_date)}</td></tr>)}</tbody></table>}</div> }

export default App
