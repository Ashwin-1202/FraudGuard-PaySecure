import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react'
import { analyzePayment, getUserTransactions } from './api'
import {
  DEMO_USERS,
  formatDate,
  formatDateOnly,
  formatINR,
  formatTimeOnly,
  getReceiverOptions,
  getScenario,
  getUser,
  recordTransferBalances,
  SCENARIOS,
} from './data'

function formatApiError(error) {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : 'request'
        return `${field}: ${item?.msg || 'Invalid value'}`
      })
      .join(' • ')
  }

  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail)
  }

  return error?.message || 'Security analysis service temporarily unavailable.'
}

function Protected({ children }) {
  const session = localStorage.getItem('paysecure_session')
  return session ? children : <Navigate to="/login" replace />
}

function Shell({ children }) {
  const user = getUser(localStorage.getItem('paysecure_session'))
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem('paysecure_session')
    navigate('/login')
  }

  const links = [
    ['/dashboard', 'Overview', LayoutDashboard],
    ...(user?.role === 'sender' ? [['/send', 'Send money', Send], ['/beneficiaries', 'Beneficiaries', Users]] : []),
    ['/transactions', user?.role === 'receiver' ? 'Received payments' : 'Transactions', Receipt],
    ['/security', 'Security', ShieldCheck],
  ]

  return (
    <div className="app">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">P</div>
          <div className="brand-copy">
            <strong>PaySecure</strong>
            <span>Personal Banking</span>
          </div>
        </div>

        <nav>
          {links.map(([to, label, Icon]) => (
            <Link key={to} className={location.pathname === to ? 'active' : ''} to={to} onClick={() => setOpen(false)}>
              <Icon size={16} className="nav-icon" aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-badge-sidebar">
            <ShieldCheck size={18} className="shield-icon" aria-hidden="true" />
            <div>
              <strong>Protected by FraudGuard</strong>
              <small>Real-time ML fraud scoring & anomaly detection active</small>
            </div>
          </div>
          <button className="ghost full" onClick={logout} aria-label="Sign out">
            <LogOut size={15} style={{ marginRight: '6px' }} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="topbar-title">
            <span>PaySecure Personal Banking</span>
            <small><span className="pulse-dot" /> FraudGuard Security Connected</small>
          </div>
          <div className="user-menu">
            <div className="avatar">{user?.name?.[0] || 'U'}</div>
            <div className="user-copy">
              <strong>{user?.name}</strong>
              <span>{user?.account}</span>
            </div>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}

function Login() {
  const [loginId, setLoginId] = useState('ashwin')
  const [pin, setPin] = useState('1234')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const user = DEMO_USERS.find((u) => u.loginId === loginId.trim().toLowerCase() && u.pin === pin)
    if (!user) return setError('Invalid credentials.')
    localStorage.setItem('paysecure_session', String(user.id))
    navigate('/dashboard')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand centered">
          <div className="brand-mark">P</div>
          <div className="brand-copy">
            <strong>PaySecure</strong>
            <span>Personal Banking</span>
          </div>
        </div>
        <div className="eyebrow">SECURE PERSONAL BANKING</div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to your account. All transfers are screened in real time by the FraudGuard AI engine.</p>
        <form onSubmit={submit}>
          <label>Select account</label>
          <select value={loginId} onChange={(e) => setLoginId(e.target.value)}>
            <option value="ashwin">Ashwin (•••• 1001)</option>
            <option value="rahul">Rahul Kumar (•••• 4821)</option>
            <option value="priya">Priya Sharma (•••• 7316)</option>
          </select>
          <label>Security PIN</label>
          <input type="password" inputMode="numeric" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
          {error && <div className="error-box">{error}</div>}
          <button className="primary full" type="submit" style={{ marginTop: '16px' }}>Sign in</button>
        </form>
        <div className="demo-hint">
          {/* Demo PIN: <strong>1234</strong><br /> */}
          Protected by FraudGuard · Controlled Hackathon Environment
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const user = getUser(localStorage.getItem('paysecure_session'))
  const [transactions, setTransactions] = useState([])
  const [selectedTx, setSelectedTx] = useState(null)
  useEffect(() => {
    if (!user) return
    getUserTransactions(user.id, user.role).then(setTransactions).catch(() => {})
  }, [user?.id, user?.role])

  const stats = useMemo(() => {
    let sent = 0
    let received = 0
    for (const t of transactions) {
      const outgoing = Number(t.user_id || t.sender_user_id) === Number(user?.id)
      const amt = Number(t.amount) || 0
      if (outgoing) sent += amt
      else received += amt
    }
    return { sent, received, count: transactions.length }
  }, [transactions, user?.id])

  const quickActions = [
    ...(user?.role === 'sender' ? [{ to: '/send', label: 'Send Money', icon: Send }] : []),
    { to: '/transactions', label: 'View Transactions', icon: Receipt },
    ...(user?.role === 'sender' ? [{ to: '/beneficiaries', label: 'Beneficiaries', icon: Users }] : []),
    { to: '/security', label: 'Account / Security', icon: ShieldCheck },
  ]

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACCOUNT OVERVIEW</div>
          <h1>Good to see you, {user?.name.split(' ')[0]}.</h1>
          <p className="muted">{user?.role === 'receiver' ? 'Your received payments and account history.' : 'Your personal account balance and real-time security status.'}</p>
        </div>
        {user?.role === 'sender' && <Link className="primary" to="/send">Send money →</Link>}
      </div>

      <section className="balance-grid">
        <div className="balance-card">
          <span>Available balance</span>
          <strong>{formatINR(user?.balance)}</strong>
          <small>{user?.accountType} Account · {user?.account}</small>
        </div>
        <div className="stat-card">
          <span>Security Layer</span>
          <strong><ShieldCheck size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} aria-hidden="true" />Active & Protected</strong>
          <small>Outward payments are analyzed in real time across behavioral, anomaly, and velocity models by FraudGuard.</small>
        </div>
      </section>

      <section className="mini-stat-grid">
        <div className="mini-stat-card">
          <span className="mini-stat-icon outgoing"><ArrowUpRight size={16} aria-hidden="true" /></span>
          <div>
            <span>Money sent</span>
            <strong>{formatINR(stats.sent)}</strong>
          </div>
        </div>
        <div className="mini-stat-card">
          <span className="mini-stat-icon incoming"><ArrowDownLeft size={16} aria-hidden="true" /></span>
          <div>
            <span>Money received</span>
            <strong>{formatINR(stats.received)}</strong>
          </div>
        </div>
        <div className="mini-stat-card">
          <span className="mini-stat-icon neutral"><Receipt size={16} aria-hidden="true" /></span>
          <div>
            <span>Transaction count</span>
            <strong>{stats.count}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Quick actions</h2>
            <p className="muted">Jump straight to what you need.</p>
          </div>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="quick-action">
              <a.icon size={18} aria-hidden="true" />
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Recent activity</h2>
            <p className="muted">Recent payments and screening results.</p>
          </div>
          <Link to="/transactions" className="text-link">View all activity →</Link>
        </div>
        <TransactionList items={transactions.slice(0, 5)} currentUser={user} onView={setSelectedTx} />
      </section>

      <TransactionDetailsModal tx={selectedTx} currentUser={user} onClose={() => setSelectedTx(null)} />
    </>
  )
}

function TransactionList({ items, currentUser, onView }) {
  if (!items.length) {
    return (
      <div className="empty">
        <strong>No recent transactions</strong>
        <span>Payments processed through PaySecure will appear here with their security assessments.</span>
      </div>
    )
  }

  return (
    <div className="transaction-list">
      {items.map((t) => {
        const outgoing = Number(t.user_id || t.sender_user_id) === Number(currentUser?.id)
        const recipientTitle = outgoing
          ? (t.receiver_name ? `Payment to ${t.receiver_name}` : 'Payment sent')
          : (t.sender_name ? `Payment from ${t.sender_name}` : 'Payment received')

        return (
          <div className={`transaction-row ${t.risk_level === 'HIGH' || t.risk_level === 'CRITICAL' ? 'flagged' : ''}`} key={t.transaction_id || t.id}>
            <div className={`transaction-icon ${outgoing ? 'outgoing' : 'incoming'}`}>
              {outgoing ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowDownLeft size={16} aria-hidden="true" />}
            </div>
            <div className="transaction-main">
              <strong>{recipientTitle}</strong>
              <span>{t.transaction_id} · {formatDate(t.created_at || t.timestamp)}</span>
            </div>
            <div className={`transaction-amount ${outgoing ? 'outgoing' : 'incoming'}`}>
              <strong>{outgoing ? '-' : '+'}{formatINR(t.amount)}</strong>
              <RiskPill risk={t.risk_level} />
            </div>
            {onView && (
              <button
                type="button"
                className="view-details-btn"
                onClick={() => onView(t)}
                aria-label={`View details for transaction ${t.transaction_id}`}
              >
                View Details
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RiskPill({ risk }) {
  const r = (risk || 'PENDING').toLowerCase()
  let label = 'VERIFIED'
  if (r === 'low') label = 'LOW / Verified'
  else if (r === 'medium') label = 'MEDIUM / Review'
  else if (r === 'high') label = 'HIGH / Review'
  else if (r === 'critical') label = 'CRITICAL / Flagged'

  return <span className={`risk ${r}`}>{label}</span>
}

function SendMoney() {
  const user = getUser(localStorage.getItem('paysecure_session'))
  if (user?.role !== 'sender') return <Navigate to="/transactions" replace />
  const receivers = getReceiverOptions(user?.id)
  const [receiverId, setReceiverId] = useState(String(receivers[0]?.id || ''))
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [scenario, setScenario] = useState('normal')

  // FraudGuard transaction signals shown in the banking UI.
  // These values are sent to the backend and are also used to demonstrate
  // exactly which signals are responsible for the resulting risk score.
  const [fraudInputs, setFraudInputs] = useState({
    transactions_last_10min: 0,
    failed_attempts_10min: 0,
    new_device: false,
    new_location: false,
    international: false,
    distance_from_home: 5,
    merchant_risk: 0.10,
    account_age_days: 365,
    device_age_days: 180,
    hour: new Date().getHours(),
    day_of_week: (new Date().getDay() + 6) % 7,
    is_weekend: false,
    unusual_hour: false,
  })

  const updateFraudInput = (key, value) => {
    setFraudInputs((current) => ({ ...current, [key]: value }))
  }

  const applyScenario = (scenarioId) => {
    setScenario(scenarioId)
    const config = getScenario(scenarioId)
    const scenarioFeatures = config?.features?.() || {}
    const now = new Date()
    const day = (now.getDay() + 6) % 7
    const hour = scenarioId === 'high_risk' ? 1 : now.getHours()

    setFraudInputs((current) => ({
      ...current,
      ...scenarioFeatures,
      // Scenario configs use the backend's 0–10 merchant scale.
      // Keep the banking UI consistently on the requested 0.00–1.00 scale.
      merchant_risk: scenarioFeatures.merchant_risk != null
        ? Math.min(1, Math.max(0, Number(scenarioFeatures.merchant_risk) / 10))
        : current.merchant_risk,
      hour,
      day_of_week: day,
      is_weekend: day >= 5,
      unusual_hour: Boolean(
        scenarioFeatures.unusual_hour || hour <= 5 || hour >= 23
      ),
    }))
  }

  const [step, setStep] = useState(1)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const receiver = getUser(receiverId)

  const buildFeatures = () => {
    const value = Number(amount) || 0
    const avgUserAmount = 2000
    const merchantRiskUi = Math.min(1, Math.max(0, Number(fraudInputs.merchant_risk) || 0))

    return {
      avg_user_amount: avgUserAmount,
      amount_ratio: Number((value / avgUserAmount).toFixed(2)),
      transactions_last_10min: Math.max(0, Math.trunc(Number(fraudInputs.transactions_last_10min) || 0)),
      new_device: Number(Boolean(fraudInputs.new_device)),
      new_location: Number(Boolean(fraudInputs.new_location)),
      international: Number(Boolean(fraudInputs.international)),
      // The banking UI uses 0.00–1.00; FraudGuard's current backend/model uses 0–10.
      merchant_risk: Math.round(merchantRiskUi * 10),
      account_age_days: Math.max(0, Math.trunc(Number(fraudInputs.account_age_days) || 0)),
      device_age_days: Math.max(0, Math.trunc(Number(fraudInputs.device_age_days) || 0)),
      distance_from_home: Math.max(0, Number(fraudInputs.distance_from_home) || 0),
      failed_attempts_10min: Math.max(0, Math.trunc(Number(fraudInputs.failed_attempts_10min) || 0)),
      hour: Math.min(23, Math.max(0, Math.trunc(Number(fraudInputs.hour) || 0))),
      day_of_week: Math.min(6, Math.max(0, Math.trunc(Number(fraudInputs.day_of_week) || 0))),
      is_weekend: Number(Boolean(fraudInputs.is_weekend)),
      unusual_hour: Number(Boolean(fraudInputs.unusual_hour)),
    }
  }

  const confirm = async () => {
    setError('')
    const value = Number(amount)
    if (!receiver) return setError('Please select a recipient.')
    if (!value || value <= 0) return setError('Please enter a valid transfer amount.')
    if (value > user.balance) return setError('Insufficient available balance.')
    if (receiver.id === user.id) return setError('You cannot transfer money to your own account.')
    setBusy(true)
    setStep(3)
    const features = buildFeatures()
    const payload = {
      transaction_id: `TXN-BANK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      // FastAPI TransactionRequest expects user_id for the active backend.
      user_id: Number(user.id),
      sender_user_id: user.id,
      sender_name: user.name,
      sender_account: user.account,
      receiver_user_id: receiver.id,
      receiver_name: receiver.name,
      receiver_account: receiver.account,
      amount: value,
      ...features,
    }
    try {
      const data = await analyzePayment(payload)

      // IMPORTANT: FraudGuard must approve the payment before balances are
      // changed. HIGH and CRITICAL transactions are recorded for investigation
      // but are NOT settled / credited to the receiver.
      const risk = String(data?.risk_level || '').toUpperCase()
      const blocked = risk === 'HIGH' || risk === 'CRITICAL'

      if (!blocked) {
        recordTransferBalances(user.id, receiver.id, value)
      }

      setResult({
        ...data,
        bank_action: blocked ? 'BLOCKED' : 'COMPLETED',
        balance_settled: !blocked,
      })
      setStep(4)
    } catch (e) {
      console.error('FraudGuard transaction error:', e?.response?.data || e)
      setError(formatApiError(e))
      setStep(2)
    } finally {
      setBusy(false)
    }
  }

  if (step === 4 && result) {
    return (
      <ResultScreen
        result={result}
        receiver={receiver}
        currentUser={user}
        onAgain={() => {
          setResult(null)
          setStep(1)
          setAmount('')
          setNote('')
        }}
      />
    )
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">INSTANT TRANSFERS</div>
          <h1>Send money</h1>
          <p className="muted">Direct UPI & IMPS transfers protected by real-time AI security screening.</p>
        </div>
        <div className="balance-inline" style={{ fontWeight: 700 }}>
          Available balance: {formatINR(user?.balance)}
        </div>
      </div>

      <div className="steps">
        <span className={step >= 1 ? 'done' : ''}>1 Recipient & Amount</span>
        <i />
        <span className={step >= 2 ? 'done' : ''}>2 Review</span>
        <i />
        <span className={step >= 3 ? 'done' : ''}>3 Security Screening</span>
      </div>

      {step === 1 && (
        <div className="form-card narrow">
          <h2>Select recipient & amount</h2>
          <p className="muted">Choose a beneficiary and transfer amount.</p>

          <label>Recipient</label>
          <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)}>
            {receivers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.account}
              </option>
            ))}
          </select>

          <div className="receiver-preview">
            <div className="avatar large">{receiver?.name?.[0]}</div>
            <div>
              <strong>{receiver?.name}</strong>
              <span>{receiver?.account} · {receiver?.accountType} Account</span>
            </div>
          </div>

          <label>Amount (₹)</label>
          <div className="money-input">
            <span>₹</span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0.00"
            />
          </div>

          <label>Payment note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Monthly rent, Invoice, Dinner"
          />

          <div className="scenario-header">
            <label style={{ margin: 0 }}>Transaction scenario</label>
            <span className="scenario-badge">Controlled demonstration scenario</span>
          </div>
          <p className="muted" style={{ marginTop: '-6px', marginBottom: '12px', fontSize: '12.5px' }}>
            Choose a scenario to see how FraudGuard AI screens different transaction patterns. The backend — not the UI — decides the actual risk.
          </p>

          <div className="scenario-grid scenario-grid-wide">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={scenario === s.id ? 'scenario selected' : 'scenario'}
                onClick={() => {
                  applyScenario(s.id)
                  setAmount(String(s.suggestedAmount))
                }}
              >
                <strong>{s.label}</strong>
                <span>{s.description}</span>
              </button>
            ))}
          </div>

          <div
            className="form-card"
            style={{
              marginTop: '18px',
              padding: '18px',
              background: '#fafafa',
              border: '1px solid #e5e7eb',
              boxShadow: 'none',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <div className="eyebrow">FRAUDGUARD SIGNALS</div>
              <h3 style={{ margin: '4px 0 5px' }}>Transaction risk inputs</h3>
              <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                These signals are sent to FraudGuard for the real-time fraud assessment.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '18px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px' }}>Transaction Velocity</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>Transactions in Last 10 Minutes</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={fraudInputs.transactions_last_10min}
                      onChange={(e) => updateFraudInput('transactions_last_10min', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Failed Attempts in Last 10 Minutes</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={fraudInputs.failed_attempts_10min}
                      onChange={(e) => updateFraudInput('failed_attempts_10min', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px' }}>Device & Location</h4>
                <div style={{ display: 'grid', gap: '9px' }}>
                  {[
                    ['new_device', 'New Device'],
                    ['new_location', 'New Location'],
                    ['international', 'International Transaction'],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        margin: 0,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(fraudInputs[key])}
                        onChange={(e) => updateFraudInput(key, e.target.checked)}
                        style={{ width: '16px', height: '16px', margin: 0 }}
                      />
                      <span>{label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6b7280' }}>
                        {fraudInputs[key] ? 'Yes' : 'No'}
                      </span>
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label>Distance From Home (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={fraudInputs.distance_from_home}
                    onChange={(e) => updateFraudInput('distance_from_home', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px' }}>Merchant</h4>
                <label>Merchant Risk (0.00 – 1.00)</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={fraudInputs.merchant_risk}
                  onChange={(e) => updateFraudInput('merchant_risk', e.target.value)}
                />
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px' }}>Account & Device History</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>Account Age (days)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={fraudInputs.account_age_days}
                      onChange={(e) => updateFraudInput('account_age_days', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Device Age (days)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={fraudInputs.device_age_days}
                      onChange={(e) => updateFraudInput('device_age_days', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px' }}>Time</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>Hour (0–23)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      step="1"
                      value={fraudInputs.hour}
                      onChange={(e) => updateFraudInput('hour', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Day of Week (0=Mon)</label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      step="1"
                      value={fraudInputs.day_of_week}
                      onChange={(e) => updateFraudInput('day_of_week', e.target.value)}
                    />
                  </div>

                <div style={{ display: 'grid', gap: '9px', marginTop: '10px' }}>
                  {['is_weekend', 'unusual_hour'].map((key) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        margin: 0,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(fraudInputs[key])}
                        onChange={(e) => updateFraudInput(key, e.target.checked)}
                        style={{ width: '16px', height: '16px', margin: 0 }}
                      />
                      <span>{key === 'is_weekend' ? 'Weekend' : 'Unusual Hour'}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6b7280' }}>
                        {fraudInputs[key] ? 'Yes' : 'No'}
                      </span>
                    </label>
                  ))}
                </div>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          <button className="primary full" onClick={() => setStep(2)}>Continue to review →</button>
        </div>
      )}

      {step === 2 && (
        <div className="form-card narrow">
          <h2>Review payment</h2>
          <p className="muted">Please confirm transfer details before real-time security analysis.</p>

          <div className="review">
            <div>
              <span>Recipient</span>
              <strong>{receiver?.name}</strong>
            </div>
            <div>
              <span>Recipient Account</span>
              <small style={{ fontFamily: 'var(--font-mono)' }}>{receiver?.account}</small>
            </div>
            {note && (
              <div>
                <span>Note</span>
                <strong>{note}</strong>
              </div>
            )}
            <div>
              <span>Transfer amount</span>
              <strong>{formatINR(amount)}</strong>
            </div>
            <div>
              <span>Transfer fee</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>₹0.00 (Instant IMPS)</strong>
            </div>
            <div className="total">
              <span>Total debit</span>
              <strong>{formatINR(amount)}</strong>
            </div>
          </div>

          <div className="secure-callout">
            <strong>🛡️ FraudGuard Real-Time Security Screening</strong>
            <span>
              This transaction will be evaluated in real time across behavioral, anomaly, and velocity models by FraudGuard before returning the payment assessment.
            </span>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="button-row">
            <button className="secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="primary" disabled={busy} onClick={confirm}>Confirm & Pay →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <SecurityProcessing
          amount={amount}
          receiverName={receiver?.name}
        />
      )}
    </>
  )
}

function SecurityProcessing({ amount, receiverName }) {
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(2), 500)
    const t2 = setTimeout(() => setActiveStep(3), 1100)
    const t3 = setTimeout(() => setActiveStep(4), 1800)
    const t4 = setTimeout(() => setActiveStep(5), 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  return (
    <div className="processing-card">
      <div className="transfer-animation-badge">
        <span>Ashwin</span>
        <span>→</span>
        <span>{formatINR(amount)}</span>
        <span>→</span>
        <span>{receiverName || 'Recipient'}</span>
      </div>

      <div className="spinner" />
      <div className="eyebrow">REAL-TIME SECURITY SCREENING</div>
      <h1>Securing your payment</h1>
      <p className="muted">Evaluating transaction signals across the production AI security pipeline.</p>

      <div className="process-list">
        <div>
          <span className={`process-icon ${activeStep > 1 ? 'done' : activeStep === 1 ? 'active' : 'pending'}`}>
            {activeStep > 1 ? '✓' : '•'}
          </span>
          <span style={{ color: activeStep >= 1 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 1 ? 700 : 500 }}>
            Transaction details submitted & validated
          </span>
        </div>

        <div>
          <span className={`process-icon ${activeStep > 2 ? 'done' : activeStep === 2 ? 'active' : 'pending'}`}>
            {activeStep > 2 ? '✓' : '•'}
          </span>
          <span style={{ color: activeStep >= 2 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 2 ? 700 : 500 }}>
            XGBoost behavioral risk scoring & velocity assessment
          </span>
        </div>

        <div>
          <span className={`process-icon ${activeStep > 3 ? 'done' : activeStep === 3 ? 'active' : 'pending'}`}>
            {activeStep > 3 ? '✓' : '•'}
          </span>
          <span style={{ color: activeStep >= 3 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 3 ? 700 : 500 }}>
            Isolation Forest anomaly detection
          </span>
        </div>

        <div>
          <span className={`process-icon ${activeStep > 4 ? 'done' : activeStep === 4 ? 'active' : 'pending'}`}>
            {activeStep > 4 ? '✓' : '•'}
          </span>
          <span style={{ color: activeStep >= 4 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 4 ? 700 : 500 }}>
            SHAP feature explanation & security rule evaluation
          </span>
        </div>

        <div>
          <span className={`process-icon ${activeStep >= 5 ? 'done' : 'pending'}`}>
            {activeStep >= 5 ? '✓' : '•'}
          </span>
          <span style={{ color: activeStep >= 5 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 5 ? 700 : 500 }}>
            Risk assessment & persistence
          </span>
        </div>
      </div>

      <div style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
        🛡️ Protected by FraudGuard · Production ML Risk Engine
      </div>
    </div>
  )
}

function ResultScreen({ result, receiver, currentUser, onAgain }) {
  const [showDetails, setShowDetails] = useState(false)
  const risk = result.risk_level || 'LOW'
  const isLowRisk = risk === 'LOW'
  const isMediumRisk = risk === 'MEDIUM'
  const isHighRisk = risk === 'HIGH' || risk === 'CRITICAL'
  const isBlocked = isHighRisk || result.bank_action === 'BLOCKED'

  const formattedProbability = result.fraud_probability != null
    ? `${(Number(result.fraud_probability) * 100).toFixed(2)}%`
    : result.fraud_score != null
    ? `${Number(result.fraud_score).toFixed(2)}%`
    : '—'

  const finalScore = result.final_risk_score != null
    ? `${Number(result.final_risk_score).toFixed(1)} / 100`
    : '—'

  return (
    <div className="result-wrap">
      <div className={`result-mark ${risk.toLowerCase()}`}>
        {isLowRisk ? '✓' : '!'}
      </div>

      <div className="eyebrow">
        {isLowRisk ? 'PAYMENT VERIFIED' : isMediumRisk ? 'PAYMENT UNDER REVIEW' : 'SECURITY NOTICE'}
      </div>

      <h1>
        {isBlocked
          ? (risk === 'CRITICAL'
            ? 'Transaction blocked'
            : 'Transaction blocked for security review')
          : isLowRisk
            ? 'Payment successful'
            : isCriticalTitle(risk)}
      </h1>

      <p className="muted">
        {isBlocked
          ? 'FraudGuard detected elevated risk signals. The payment was recorded for investigation, but the bank did not settle it and no amount was credited to the recipient.'
          : isLowRisk
            ? 'Your payment was successfully assessed by FraudGuard. No elevated risk signals were detected.'
            : 'FraudGuard detected elevated risk signals on this payment. The transaction has been flagged for security review.'}
      </p>

      <div className="result-card">
        <div>
          <span>Transaction ID</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{result.transaction_id}</strong>
        </div>
        <div>
          <span>Recipient</span>
          <strong>{receiver?.name}</strong>
        </div>
        <div>
          <span>Amount</span>
          <strong>{formatINR(result.amount)}</strong>
        </div>
        <div>
          <span>Risk Assessment</span>
          <RiskPill risk={risk} />
        </div>
        <div>
          <span>Bank Settlement</span>
          <strong style={{ color: isBlocked ? '#b42318' : '#087443' }}>
            {isBlocked ? 'BLOCKED · No credit' : 'COMPLETED · Credited'}
          </strong>
        </div>
        <div>
          <span>Fraud Probability</span>
          <strong>{formattedProbability}</strong>
        </div>
        <div>
          <span>Final Risk Score</span>
          <strong>{finalScore}</strong>
        </div>
      </div>

      {isHighRisk && result.reasons && result.reasons.length > 0 && (
        <div className="reasons">
          <strong>⚠️ Detected Security Signals</strong>
          {result.reasons.map((r, index) => (
            <span key={index}>• {typeof r === 'string' ? r : (r?.msg || JSON.stringify(r))}</span>
          ))}
        </div>
      )}

      {isHighRisk && (
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          ℹ️ This transaction record is preserved in the FraudOps monitoring platform for compliance and investigation.
        </p>
      )}

      <div className="button-row center">
        <Link className="secondary" to="/transactions">View all transactions</Link>
        <button className="secondary" onClick={() => setShowDetails(true)}>View full details</button>
        <button className="primary" onClick={onAgain}>
          {isLowRisk ? 'Send another payment' : 'Back to payments'}
        </button>
      </div>

      <TransactionDetailsModal
        tx={showDetails ? result : null}
        currentUser={currentUser}
        onClose={() => setShowDetails(false)}
      />
    </div>
  )
}

function isCriticalTitle(risk) {
  if (risk === 'CRITICAL') return 'Transaction flagged for security review'
  if (risk === 'HIGH') return 'Security review required'
  return 'Payment requires additional verification'
}

const TRANSACTION_FILTERS = [
  ['all', 'All'],
  ['sent', 'Sent'],
  ['received', 'Received'],
  ['LOW', 'Low Risk'],
  ['MEDIUM', 'Medium Risk'],
  ['HIGH', 'High Risk'],
  ['CRITICAL', 'Critical Risk'],
]

const SORT_OPTIONS = [
  ['newest', 'Newest'],
  ['oldest', 'Oldest'],
  ['highest', 'Highest Amount'],
  ['lowest', 'Lowest Amount'],
]

function Transactions() {
  const user = getUser(localStorage.getItem('paysecure_session'))
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    getUserTransactions(user?.id, user?.role)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user?.id, user?.role])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = items.filter((t) => {
      const outgoing = Number(t.user_id || t.sender_user_id) === Number(user?.id)

      if (filter === 'sent' && !outgoing) return false
      if (filter === 'received' && outgoing) return false
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(filter) && (t.risk_level || '').toUpperCase() !== filter) return false

      if (!q) return true
      const haystack = [
        t.transaction_id,
        t.sender_name,
        t.receiver_name,
        String(t.amount ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })

    list = [...list].sort((a, b) => {
      if (sort === 'highest') return (Number(b.amount) || 0) - (Number(a.amount) || 0)
      if (sort === 'lowest') return (Number(a.amount) || 0) - (Number(b.amount) || 0)
      const dateA = new Date(a.created_at || a.timestamp || 0).getTime()
      const dateB = new Date(b.created_at || b.timestamp || 0).getTime()
      return sort === 'oldest' ? dateA - dateB : dateB - dateA
    })

    return list
  }, [items, query, filter, sort, user?.id])

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACTIVITY & SETTLEMENTS</div>
          <h1>Transaction history</h1>
          <p className="muted">Your transfers and security evaluations from the FraudGuard-backed transaction store.</p>
        </div>
        {user?.role === 'sender' && <Link className="primary" to="/send">Send money →</Link>}
      </div>

      <div className="transactions-toolbar">
        <div className="search-input">
          <Search size={15} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by transaction ID, name, or amount"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search transactions"
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="filter-chip-row" role="group" aria-label="Filter transactions">
          {TRANSACTION_FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort transactions">
          {SORT_OPTIONS.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty">
          <span>Loading transactions…</span>
        </div>
      ) : filtered.length ? (
        <TransactionList items={filtered} currentUser={user} onView={setSelectedTx} />
      ) : (
        <div className="empty">
          <strong>No matching transactions</strong>
          <span>Try adjusting your search or filters.</span>
        </div>
      )}

      <TransactionDetailsModal tx={selectedTx} currentUser={user} onClose={() => setSelectedTx(null)} />
    </>
  )
}

// ==================================================
// TRANSACTION DETAILS — LIGHT THEMED PANEL
//
// This panel intentionally uses its own dedicated,
// self-contained classes (see styles.css) so that it always
// renders with a light background/high-contrast text
// regardless of any other theming in the app.
// ==================================================

function getStatusInfo(risk) {
  const r = (risk || '').toUpperCase()
  if (r === 'LOW') return { label: 'Successful · Verified', className: 'status-success' }
  if (r === 'MEDIUM') return { label: 'Under Review', className: 'status-warning' }
  if (r === 'HIGH' || r === 'CRITICAL') return { label: 'Flagged · Requires Investigation', className: 'status-danger' }
  return { label: 'Processing', className: 'status-warning' }
}

function DetailRow({ label, value, mono, valueClassName, raw }) {
  return (
    <div className="transaction-detail-row">
      <span className="transaction-detail-label">{label}</span>
      {raw ? value : (
        <span className={`transaction-detail-value ${mono ? 'mono' : ''} ${valueClassName || ''}`}>{value}</span>
      )}
    </div>
  )
}

function TransactionDetailsModal({ tx, currentUser, onClose }) {
  useEffect(() => {
    if (!tx) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [tx, onClose])

  if (!tx) return null

  const isNum = (v) => typeof v === 'number' && !Number.isNaN(v)

  const outgoing = Number(tx.user_id || tx.sender_user_id) === Number(currentUser?.id)
  const type = outgoing ? 'Money Sent' : 'Money Received'
  const fromName = tx.sender_name || (outgoing ? currentUser?.name : null) || 'Account holder'
  const toName = tx.receiver_name || (!outgoing ? currentUser?.name : null) || 'Recipient'
  const risk = (tx.risk_level || '').toUpperCase() || null
  const statusInfo = getStatusInfo(risk)
  const createdAt = tx.created_at || tx.timestamp

  const fraudProbability = isNum(tx.fraud_probability)
    ? `${(Number(tx.fraud_probability) * 100).toFixed(2)}%`
    : null
  const finalScore = isNum(tx.final_risk_score) ? `${Number(tx.final_risk_score).toFixed(1)} / 100` : null
  const modelScore = isNum(tx.fraud_score) ? `${Number(tx.fraud_score).toFixed(1)} / 100` : null
  const ruleScore = isNum(tx.rule_score) ? Number(tx.rule_score).toFixed(1) : null
  const anomalyScore = isNum(tx.anomaly_score) ? Number(tx.anomaly_score).toFixed(1) : null
  const reasons = Array.isArray(tx.reasons) ? tx.reasons.filter(Boolean) : []

  const rawExplanation = typeof tx.ai_explanation === 'string' ? tx.ai_explanation.trim() : ''
  const aiExplanation = rawExplanation && !/unavailable/i.test(rawExplanation) ? rawExplanation : null

  return (
    <div className="transaction-detail-overlay" onClick={onClose}>
      <div
        className="transaction-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Transaction details"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="transaction-detail-header">
          <div>
            <span className="transaction-detail-eyebrow">Transaction details</span>
            <h2>{outgoing ? `Payment to ${toName}` : `Payment from ${fromName}`}</h2>
            <div className="transaction-detail-amount">{formatINR(tx.amount)}</div>
          </div>
          <button className="transaction-detail-close" onClick={onClose} aria-label="Close transaction details">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="transaction-detail-body">
          <section className="transaction-detail-section">
            <h3>Transaction Information</h3>
            <DetailRow label="Transaction ID" value={tx.transaction_id || '—'} mono />
            <DetailRow label="Date" value={formatDateOnly(createdAt)} />
            <DetailRow label="Time" value={formatTimeOnly(createdAt)} />
            <DetailRow label="Type" value={type} />
            <DetailRow label="From" value={fromName} />
            <DetailRow label="To" value={toName} />
            <DetailRow label="Status" value={statusInfo.label} valueClassName={statusInfo.className} />
          </section>

          {risk && (
            <section className="transaction-detail-section transaction-risk-card">
              <h3>Fraud Detection</h3>
              <DetailRow label="Risk Level" value={<RiskPill risk={risk} />} raw />
              {fraudProbability && <DetailRow label="Fraud Probability" value={fraudProbability} />}
              {finalScore && <DetailRow label="Final Risk Score" value={finalScore} />}
              {modelScore && <DetailRow label="Model Score (XGBoost)" value={modelScore} />}
              {ruleScore && <DetailRow label="Rule Engine Score" value={ruleScore} />}
              {anomalyScore && <DetailRow label="Anomaly Score" value={anomalyScore} />}

              {reasons.length > 0 && (
                <div className="transaction-detail-reasons">
                  <span className="transaction-detail-label">Fraud Reasons</span>
                  <ul>
                    {reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {aiExplanation && (
            <section className="transaction-detail-section transaction-ai-explanation">
              <h3>AI Investigation</h3>
              <p>{aiExplanation}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Security() {
  const user = getUser(localStorage.getItem('paysecure_session'))

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACCOUNT & SECURITY</div>
          <h1>Security overview</h1>
          <p className="muted">How PaySecure keeps your account and transfers protected.</p>
        </div>
      </div>

      <section className="balance-grid">
        <div className="stat-card">
          <span>Account holder</span>
          <strong>{user?.name}</strong>
          <small>{user?.accountType} Account · {user?.account}</small>
        </div>
        <div className="stat-card">
          <span>Security PIN</span>
          <strong><ShieldCheck size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} aria-hidden="true" />4-digit PIN active</strong>
          <small>Demo environment PIN authentication. Change your PIN periodically for best practice.</small>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Fraud protection</h2>
            <p className="muted">Every outward transfer is screened before it settles.</p>
          </div>
        </div>
        <div className="security-info-grid">
          <div className="security-info-card">
            <ShieldCheck size={18} aria-hidden="true" />
            <strong>Real-time risk scoring</strong>
            <span>Every transfer is scored by FraudGuard's XGBoost model, anomaly detector, and rule engine before it's marked successful.</span>
          </div>
          <div className="security-info-card">
            <Smartphone size={18} aria-hidden="true" />
            <strong>Device awareness</strong>
            <span>Transfers from unrecognized devices or unfamiliar locations receive additional scrutiny automatically.</span>
          </div>
          <div className="security-info-card">
            <Receipt size={18} aria-hidden="true" />
            <strong>Full audit trail</strong>
            <span>Every transaction — normal or flagged — is recorded with its risk assessment for later review.</span>
          </div>
        </div>
      </section>
    </>
  )
}

function Beneficiaries() {
  const user = getUser(localStorage.getItem('paysecure_session'))
  if (user?.role !== 'sender') return <Navigate to="/transactions" replace />
  const receivers = getReceiverOptions(user?.id)

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BENEFICIARY MANAGEMENT</div>
          <h1>Beneficiaries</h1>
          <p className="muted">Saved receivers available for instant transfers.</p>
        </div>
      </div>

      <div className="beneficiary-grid">
        {receivers.map((r) => (
          <div className="beneficiary" key={r.id}>
            <div className="avatar large">{r.name[0]}</div>
            <div>
              <strong>{r.name}</strong>
              <span>{r.account}</span>
              <small>{r.accountType} Account</small>
            </div>
            <Link to="/send" className="primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
              Send money
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <Protected>
            <Shell>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/send" element={<SendMoney />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/beneficiaries" element={<Beneficiaries />} />
                <Route path="/security" element={<Security />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Shell>
          </Protected>
        }
      />
    </Routes>
  )
}

export default App
