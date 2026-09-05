// // import { useEffect, useState } from 'react'
// // import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
// // import { analyzePayment, getUserTransactions } from './api'
// // import { DEMO_USERS, formatDate, formatINR, getReceiverOptions, getUser, recordTransferBalances } from './data'

// // function Protected({ children }) {
// //   const session = localStorage.getItem('paysecure_session')
// //   return session ? children : <Navigate to="/login" replace />
// // }

// // function Shell({ children }) {
// //   const user = getUser(localStorage.getItem('paysecure_session'))
// //   const navigate = useNavigate()
// //   const location = useLocation()
// //   const [open, setOpen] = useState(false)

// //   const logout = () => {
// //     localStorage.removeItem('paysecure_session')
// //     navigate('/login')
// //   }

// //   const links = [
// //     ['/dashboard', 'Overview'],
// //     ...(user?.role === 'sender' ? [['/send', 'Send money'], ['/beneficiaries', 'Beneficiaries']] : []),
// //     ['/transactions', user?.role === 'receiver' ? 'Received payments' : 'Transactions'],
// //   ]

// //   return (
// //     <div className="app">
// //       {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
// //       <aside className={`sidebar ${open ? 'open' : ''}`}>
// //         <div className="brand">
// //           <div className="brand-mark">P</div>
// //           <div className="brand-copy">
// //             <strong>PaySecure</strong>
// //             <span>Personal Banking</span>
// //           </div>
// //         </div>

// //         <nav>
// //           {links.map(([to, label]) => (
// //             <Link key={to} className={location.pathname === to ? 'active' : ''} to={to} onClick={() => setOpen(false)}>
// //               <span className="nav-dot" /> {label}
// //             </Link>
// //           ))}
// //         </nav>

// //         <div className="sidebar-bottom">
// //           <div className="security-badge-sidebar">
// //             <span className="shield-icon">🛡️</span>
// //             <div>
// //               <strong>Protected by FraudGuard</strong>
// //               <small>Real-time ML fraud scoring & anomaly detection active</small>
// //             </div>
// //           </div>
// //           <button className="ghost full" onClick={logout}>Sign out</button>
// //         </div>
// //       </aside>

// //       <main className="main">
// //         <header className="topbar">
// //           <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
// //           <div className="topbar-title">
// //             <span>PaySecure Personal Banking</span>
// //             <small><span className="pulse-dot" /> FraudGuard Security Connected</small>
// //           </div>
// //           <div className="user-menu">
// //             <div className="avatar">{user?.name?.[0] || 'U'}</div>
// //             <div className="user-copy">
// //               <strong>{user?.name}</strong>
// //               <span>{user?.account}</span>
// //             </div>
// //           </div>
// //         </header>
// //         <div className="content">{children}</div>
// //       </main>
// //     </div>
// //   )
// // }

// // function Login() {
// //   const [loginId, setLoginId] = useState('ashwin')
// //   const [pin, setPin] = useState('1234')
// //   const [error, setError] = useState('')
// //   const navigate = useNavigate()

// //   const submit = (e) => {
// //     e.preventDefault()
// //     const user = DEMO_USERS.find((u) => u.loginId === loginId.trim().toLowerCase() && u.pin === pin)
// //     if (!user) return setError('Invalid credentials. Use demo PIN 1234.')
// //     localStorage.setItem('paysecure_session', String(user.id))
// //     navigate('/dashboard')
// //   }

// //   return (
// //     <div className="login-page">
// //       <div className="login-card">
// //         <div className="brand centered">
// //           <div className="brand-mark">P</div>
// //           <div className="brand-copy">
// //             <strong>PaySecure</strong>
// //             <span>Personal Banking</span>
// //           </div>
// //         </div>
// //         <div className="eyebrow">SECURE PERSONAL BANKING</div>
// //         <h1>Welcome back</h1>
// //         <p className="muted">Sign in to your account. All transfers are screened in real time by the FraudGuard AI engine.</p>
// //         <form onSubmit={submit}>
// //           <label>Select account</label>
// //           <select value={loginId} onChange={(e) => setLoginId(e.target.value)}>
// //             <option value="ashwin">Ashwin — Primary Sender (•••• 1001)</option>
// //             <option value="rahul">Rahul Kumar — Beneficiary (•••• 4821)</option>
// //             <option value="priya">Priya Sharma — Beneficiary (•••• 7316)</option>
// //           </select>
// //           <label>Security PIN</label>
// //           <input type="password" inputMode="numeric" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
// //           {error && <div className="error-box">{error}</div>}
// //           <button className="primary full" type="submit" style={{ marginTop: '16px' }}>Sign in</button>
// //         </form>
// //         <div className="demo-hint">
// //           Demo PIN: <strong>1234</strong><br />
// //           Protected by FraudGuard · Controlled Hackathon Environment
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // function Dashboard() {
// //   const user = getUser(localStorage.getItem('paysecure_session'))
// //   const [transactions, setTransactions] = useState([])
// //   useEffect(() => {
// //     if (!user) return
// //     getUserTransactions(user.id, user.role).then(setTransactions).catch(() => {})
// //   }, [user?.id, user?.role])

// //   return (
// //     <>
// //       <div className="page-heading">
// //         <div>
// //           <div className="eyebrow">ACCOUNT OVERVIEW</div>
// //           <h1>Good to see you, {user?.name.split(' ')[0]}.</h1>
// //           <p className="muted">{user?.role === 'receiver' ? 'Your received payments and account history.' : 'Your personal account balance and real-time security status.'}</p>
// //         </div>
// //         {user?.role === 'sender' && <Link className="primary" to="/send">Send money →</Link>}
// //       </div>

// //       <section className="balance-grid">
// //         <div className="balance-card">
// //           <span>Available balance</span>
// //           <strong>{formatINR(user?.balance)}</strong>
// //           <small>{user?.accountType} Account · {user?.account}</small>
// //         </div>
// //         <div className="stat-card">
// //           <span>Security Layer</span>
// //           <strong>🛡️ Active & Protected</strong>
// //           <small>Outward payments are analyzed in real time across behavioral, anomaly, and velocity models by FraudGuard.</small>
// //         </div>
// //       </section>

// //       <section className="section">
// //         <div className="section-head">
// //           <div>
// //             <h2>Recent activity</h2>
// //             <p className="muted">Recent payments and screening results.</p>
// //           </div>
// //           <Link to="/transactions" className="text-link">View all activity →</Link>
// //         </div>
// //         <TransactionList items={transactions.slice(0, 5)} currentUser={user} />
// //       </section>
// //     </>
// //   )
// // }

// // function TransactionList({ items, currentUser }) {
// //   if (!items.length) {
// //     return (
// //       <div className="empty">
// //         <strong>No recent transactions</strong>
// //         <span>Payments processed through PaySecure will appear here with their security assessments.</span>
// //       </div>
// //     )
// //   }

// //   return (
// //     <div className="transaction-list">
// //       {items.map((t) => {
// //         const outgoing = Number(t.user_id || t.sender_user_id) === Number(currentUser?.id)
// //         const recipientTitle = outgoing
// //           ? (t.receiver_name || 'Payment sent')
// //           : (t.sender_name || 'Payment received')

// //         return (
// //           <div className="transaction-row" key={t.transaction_id || t.id}>
// //             <div className={`transaction-icon ${outgoing ? 'outgoing' : 'incoming'}`}>
// //               {outgoing ? '↑' : '↓'}
// //             </div>
// //             <div className="transaction-main">
// //               <strong>{recipientTitle}</strong>
// //               <span>{t.transaction_id} · {formatDate(t.created_at || t.timestamp)}</span>
// //             </div>
// //             <div className={`transaction-amount ${outgoing ? 'outgoing' : 'incoming'}`}>
// //               <strong>{outgoing ? '-' : '+'}{formatINR(t.amount)}</strong>
// //               <RiskPill risk={t.risk_level} />
// //             </div>
// //           </div>
// //         )
// //       })}
// //     </div>
// //   )
// // }

// // function RiskPill({ risk }) {
// //   const r = (risk || 'PENDING').toLowerCase()
// //   let label = 'VERIFIED'
// //   if (r === 'low') label = 'LOW / Verified'
// //   else if (r === 'medium') label = 'MEDIUM / Review'
// //   else if (r === 'high') label = 'HIGH / Review'
// //   else if (r === 'critical') label = 'CRITICAL / Flagged'

// //   return <span className={`risk ${r}`}>{label}</span>
// // }

// // function SendMoney() {
// //   const user = getUser(localStorage.getItem('paysecure_session'))
// //   if (user?.role !== 'sender') return <Navigate to="/transactions" replace />
// //   const receivers = getReceiverOptions(user?.id)
// //   const [receiverId, setReceiverId] = useState(String(receivers[0]?.id || ''))
// //   const [amount, setAmount] = useState('')
// //   const [note, setNote] = useState('')
// //   const [scenario, setScenario] = useState('normal')
// //   const [step, setStep] = useState(1)
// //   const [result, setResult] = useState(null)
// //   const [busy, setBusy] = useState(false)
// //   const [error, setError] = useState('')

// //   const receiver = getUser(receiverId)

// //   const buildFeatures = () => {
// //     const now = new Date()
// //     const hour = scenario === 'suspicious' ? 1 : now.getHours()
// //     const day = now.getDay()
// //     if (scenario === 'suspicious') {
// //       return {
// //         avg_user_amount: 2000,
// //         transactions_last_10min: 8,
// //         new_device: 1,
// //         new_location: 1,
// //         international: 1,
// //         merchant_risk: 8,
// //         account_age_days: 90,
// //         device_age_days: 5,
// //         distance_from_home: 800,
// //         failed_attempts_10min: 4,
// //         hour,
// //         day_of_week: day,
// //         is_weekend: Number(day >= 5),
// //         unusual_hour: 1,
// //       }
// //     }
// //     return {
// //       avg_user_amount: 2000,
// //       transactions_last_10min: 1,
// //       new_device: 0,
// //       new_location: 0,
// //       international: 0,
// //       merchant_risk: 2,
// //       account_age_days: 1200,
// //       device_age_days: 300,
// //       distance_from_home: 5,
// //       failed_attempts_10min: 0,
// //       hour,
// //       day_of_week: day,
// //       is_weekend: Number(day >= 5),
// //       unusual_hour: Number(hour <= 5 || hour >= 23),
// //     }
// //   }

// //   const confirm = async () => {
// //     setError('')
// //     const value = Number(amount)
// //     if (!receiver) return setError('Please select a recipient.')
// //     if (!value || value <= 0) return setError('Please enter a valid transfer amount.')
// //     if (value > user.balance) return setError('Insufficient available balance.')
// //     if (receiver.id === user.id) return setError('You cannot transfer money to your own account.')
// //     setBusy(true)
// //     setStep(3)
// //     const features = buildFeatures()
// //     const payload = {
// //       transaction_id: `TXN-BANK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
// //       sender_user_id: user.id,
// //       sender_name: user.name,
// //       sender_account: user.account,
// //       receiver_user_id: receiver.id,
// //       receiver_name: receiver.name,
// //       receiver_account: receiver.account,
// //       amount: value,
// //       ...features,
// //     }
// //     try {
// //       const data = await analyzePayment(payload)
// //       recordTransferBalances(user.id, receiver.id, value)
// //       setResult(data)
// //       setStep(4)
// //     } catch (e) {
// //       setError(e.response?.data?.detail || e.message || 'Security analysis service temporarily unavailable.')
// //       setStep(2)
// //     } finally {
// //       setBusy(false)
// //     }
// //   }

// //   if (step === 4 && result) {
// //     return (
// //       <ResultScreen
// //         result={result}
// //         receiver={receiver}
// //         onAgain={() => {
// //           setResult(null)
// //           setStep(1)
// //           setAmount('')
// //           setNote('')
// //         }}
// //       />
// //     )
// //   }

// //   return (
// //     <>
// //       <div className="page-heading">
// //         <div>
// //           <div className="eyebrow">INSTANT TRANSFERS</div>
// //           <h1>Send money</h1>
// //           <p className="muted">Direct UPI & IMPS transfers protected by real-time AI security screening.</p>
// //         </div>
// //         <div className="balance-inline" style={{ fontWeight: 700 }}>
// //           Available balance: {formatINR(user?.balance)}
// //         </div>
// //       </div>

// //       <div className="steps">
// //         <span className={step >= 1 ? 'done' : ''}>1 Recipient & Amount</span>
// //         <i />
// //         <span className={step >= 2 ? 'done' : ''}>2 Review</span>
// //         <i />
// //         <span className={step >= 3 ? 'done' : ''}>3 Security Screening</span>
// //       </div>

// //       {step === 1 && (
// //         <div className="form-card narrow">
// //           <h2>Select recipient & amount</h2>
// //           <p className="muted">Choose a beneficiary and transfer amount.</p>

// //           <label>Recipient</label>
// //           <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)}>
// //             {receivers.map((r) => (
// //               <option key={r.id} value={r.id}>
// //                 {r.name} · {r.account}
// //               </option>
// //             ))}
// //           </select>

// //           <div className="receiver-preview">
// //             <div className="avatar large">{receiver?.name?.[0]}</div>
// //             <div>
// //               <strong>{receiver?.name}</strong>
// //               <span>{receiver?.account} · {receiver?.accountType} Account</span>
// //             </div>
// //           </div>

// //           <label>Amount (₹)</label>
// //           <div className="money-input">
// //             <span>₹</span>
// //             <input
// //               autoFocus
// //               type="text"
// //               inputMode="decimal"
// //               value={amount}
// //               onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
// //               placeholder="0.00"
// //             />
// //           </div>

// //           <label>Payment note (optional)</label>
// //           <input
// //             type="text"
// //             value={note}
// //             onChange={(e) => setNote(e.target.value)}
// //             placeholder="e.g. Monthly rent, Invoice, Dinner"
// //           />

// //           <div className="scenario-header">
// //             <label style={{ margin: 0 }}>Demonstration profile</label>
// //             <span className="scenario-badge">Controlled demonstration scenario</span>
// //           </div>

// //           <div className="scenario-grid">
// //             <button
// //               type="button"
// //               className={scenario === 'normal' ? 'scenario selected' : 'scenario'}
// //               onClick={() => {
// //                 setScenario('normal')
// //                 if (!amount || amount === '8500') setAmount('500')
// //               }}
// //             >
// //               <strong>Standard transfer</strong>
// //               <span>Familiar payment activity</span>
// //             </button>
// //             <button
// //               type="button"
// //               className={scenario === 'suspicious' ? 'scenario selected' : 'scenario'}
// //               onClick={() => {
// //                 setScenario('suspicious')
// //                 if (!amount || amount === '500') setAmount('8500')
// //               }}
// //             >
// //               <strong>Protected transfer</strong>
// //               <span>Enhanced security screening</span>
// //             </button>
// //           </div>

// //           <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
// //             <button
// //               type="button"
// //               className="secondary"
// //               style={{ flex: 1, fontSize: '12px', padding: '8px' }}
// //               onClick={() => {
// //                 setScenario('normal')
// //                 setAmount('500')
// //               }}
// //             >
// //               Use ₹500 standard amount
// //             </button>
// //             <button
// //               type="button"
// //               className="secondary"
// //               style={{ flex: 1, fontSize: '12px', padding: '8px' }}
// //               onClick={() => {
// //                 setScenario('suspicious')
// //                 setAmount('8500')
// //               }}
// //             >
// //               Use ₹8,500 demo amount
// //             </button>
// //           </div>

// //           {error && <div className="error-box">{error}</div>}
// //           <button className="primary full" onClick={() => setStep(2)}>Continue to review →</button>
// //         </div>
// //       )}

// //       {step === 2 && (
// //         <div className="form-card narrow">
// //           <h2>Review payment</h2>
// //           <p className="muted">Please confirm transfer details before real-time security analysis.</p>

// //           <div className="review">
// //             <div>
// //               <span>Recipient</span>
// //               <strong>{receiver?.name}</strong>
// //             </div>
// //             <div>
// //               <span>Recipient Account</span>
// //               <small style={{ fontFamily: 'var(--font-mono)' }}>{receiver?.account}</small>
// //             </div>
// //             {note && (
// //               <div>
// //                 <span>Note</span>
// //                 <strong>{note}</strong>
// //               </div>
// //             )}
// //             <div>
// //               <span>Transfer amount</span>
// //               <strong>{formatINR(amount)}</strong>
// //             </div>
// //             <div>
// //               <span>Transfer fee</span>
// //               <strong style={{ color: 'var(--accent-emerald)' }}>₹0.00 (Instant IMPS)</strong>
// //             </div>
// //             <div className="total">
// //               <span>Total debit</span>
// //               <strong>{formatINR(amount)}</strong>
// //             </div>
// //           </div>

// //           <div className="secure-callout">
// //             <strong>🛡️ FraudGuard Real-Time Security Screening</strong>
// //             <span>
// //               This transaction will be evaluated in real time across behavioral, anomaly, and velocity models by FraudGuard before returning the payment assessment.
// //             </span>
// //           </div>

// //           {error && <div className="error-box">{error}</div>}

// //           <div className="button-row">
// //             <button className="secondary" onClick={() => setStep(1)}>← Back</button>
// //             <button className="primary" disabled={busy} onClick={confirm}>Confirm & Pay →</button>
// //           </div>
// //         </div>
// //       )}

// //       {step === 3 && (
// //         <SecurityProcessing
// //           amount={amount}
// //           receiverName={receiver?.name}
// //         />
// //       )}
// //     </>
// //   )
// // }

// // function SecurityProcessing({ amount, receiverName }) {
// //   const [activeStep, setActiveStep] = useState(1)

// //   useEffect(() => {
// //     const t1 = setTimeout(() => setActiveStep(2), 500)
// //     const t2 = setTimeout(() => setActiveStep(3), 1100)
// //     const t3 = setTimeout(() => setActiveStep(4), 1800)
// //     const t4 = setTimeout(() => setActiveStep(5), 2400)
// //     return () => {
// //       clearTimeout(t1)
// //       clearTimeout(t2)
// //       clearTimeout(t3)
// //       clearTimeout(t4)
// //     }
// //   }, [])

// //   return (
// //     <div className="processing-card">
// //       <div className="transfer-animation-badge">
// //         <span>Ashwin</span>
// //         <span>→</span>
// //         <span>{formatINR(amount)}</span>
// //         <span>→</span>
// //         <span>{receiverName || 'Recipient'}</span>
// //       </div>

// //       <div className="spinner" />
// //       <div className="eyebrow">REAL-TIME SECURITY SCREENING</div>
// //       <h1>Securing your payment</h1>
// //       <p className="muted">Evaluating transaction signals across the production AI security pipeline.</p>

// //       <div className="process-list">
// //         <div>
// //           <span className={`process-icon ${activeStep > 1 ? 'done' : activeStep === 1 ? 'active' : 'pending'}`}>
// //             {activeStep > 1 ? '✓' : '•'}
// //           </span>
// //           <span style={{ color: activeStep >= 1 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 1 ? 700 : 500 }}>
// //             Transaction details submitted & validated
// //           </span>
// //         </div>

// //         <div>
// //           <span className={`process-icon ${activeStep > 2 ? 'done' : activeStep === 2 ? 'active' : 'pending'}`}>
// //             {activeStep > 2 ? '✓' : '•'}
// //           </span>
// //           <span style={{ color: activeStep >= 2 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 2 ? 700 : 500 }}>
// //             LightGBM behavioral risk scoring & velocity assessment
// //           </span>
// //         </div>

// //         <div>
// //           <span className={`process-icon ${activeStep > 3 ? 'done' : activeStep === 3 ? 'active' : 'pending'}`}>
// //             {activeStep > 3 ? '✓' : '•'}
// //           </span>
// //           <span style={{ color: activeStep >= 3 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 3 ? 700 : 500 }}>
// //             Isolation Forest anomaly detection
// //           </span>
// //         </div>

// //         <div>
// //           <span className={`process-icon ${activeStep > 4 ? 'done' : activeStep === 4 ? 'active' : 'pending'}`}>
// //             {activeStep > 4 ? '✓' : '•'}
// //           </span>
// //           <span style={{ color: activeStep >= 4 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 4 ? 700 : 500 }}>
// //             SHAP feature explanation & security rule evaluation
// //           </span>
// //         </div>

// //         <div>
// //           <span className={`process-icon ${activeStep >= 5 ? 'done' : 'pending'}`}>
// //             {activeStep >= 5 ? '✓' : '•'}
// //           </span>
// //           <span style={{ color: activeStep >= 5 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: activeStep === 5 ? 700 : 500 }}>
// //             Risk assessment & persistence
// //           </span>
// //         </div>
// //       </div>

// //       <div style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
// //         🛡️ Protected by FraudGuard · Production ML Risk Engine
// //       </div>
// //     </div>
// //   )
// // }

// // function ResultScreen({ result, receiver, onAgain }) {
// //   const risk = result.risk_level || 'LOW'
// //   const isLowRisk = risk === 'LOW'
// //   const isMediumRisk = risk === 'MEDIUM'
// //   const isHighRisk = risk === 'HIGH' || risk === 'CRITICAL'

// //   const formattedProbability = result.fraud_probability != null
// //     ? `${(Number(result.fraud_probability) * 100).toFixed(2)}%`
// //     : result.fraud_score != null
// //     ? `${Number(result.fraud_score).toFixed(2)}%`
// //     : '—'

// //   const finalScore = result.final_risk_score != null
// //     ? `${Number(result.final_risk_score).toFixed(1)} / 100`
// //     : '—'

// //   return (
// //     <div className="result-wrap">
// //       <div className={`result-mark ${risk.toLowerCase()}`}>
// //         {isLowRisk ? '✓' : '!'}
// //       </div>

// //       <div className="eyebrow">
// //         {isLowRisk ? 'PAYMENT VERIFIED' : isMediumRisk ? 'PAYMENT UNDER REVIEW' : 'SECURITY NOTICE'}
// //       </div>

// //       <h1>
// //         {isLowRisk
// //           ? 'Payment successful'
// //           : isCriticalTitle(risk)}
// //       </h1>

// //       <p className="muted">
// //         {isLowRisk
// //           ? 'Your payment was successfully assessed by FraudGuard. No elevated risk signals were detected.'
// //           : 'FraudGuard detected elevated risk signals on this payment. The transaction has been flagged for security review.'}
// //       </p>

// //       <div className="result-card">
// //         <div>
// //           <span>Transaction ID</span>
// //           <strong style={{ fontFamily: 'var(--font-mono)' }}>{result.transaction_id}</strong>
// //         </div>
// //         <div>
// //           <span>Recipient</span>
// //           <strong>{receiver?.name}</strong>
// //         </div>
// //         <div>
// //           <span>Amount</span>
// //           <strong>{formatINR(result.amount)}</strong>
// //         </div>
// //         <div>
// //           <span>Risk Assessment</span>
// //           <RiskPill risk={risk} />
// //         </div>
// //         <div>
// //           <span>Fraud Probability</span>
// //           <strong>{formattedProbability}</strong>
// //         </div>
// //         <div>
// //           <span>Final Risk Score</span>
// //           <strong>{finalScore}</strong>
// //         </div>
// //       </div>

// //       {isHighRisk && result.reasons && result.reasons.length > 0 && (
// //         <div className="reasons">
// //           <strong>⚠️ Detected Security Signals</strong>
// //           {result.reasons.map((r) => (
// //             <span key={r}>• {r}</span>
// //           ))}
// //         </div>
// //       )}

// //       {isHighRisk && (
// //         <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
// //           ℹ️ This transaction record is preserved in the FraudOps monitoring platform for compliance and investigation.
// //         </p>
// //       )}

// //       <div className="button-row center">
// //         <Link className="secondary" to="/transactions">View all transactions</Link>
// //         <button className="primary" onClick={onAgain}>
// //           {isLowRisk ? 'Send another payment' : 'Back to payments'}
// //         </button>
// //       </div>
// //     </div>
// //   )
// // }

// // function isCriticalTitle(risk) {
// //   if (risk === 'CRITICAL') return 'Transaction flagged for security review'
// //   if (risk === 'HIGH') return 'Security review required'
// //   return 'Payment requires additional verification'
// // }

// // function Transactions() {
// //   const user = getUser(localStorage.getItem('paysecure_session'))
// //   const [items, setItems] = useState([])
// //   const [loading, setLoading] = useState(true)

// //   useEffect(() => {
// //     getUserTransactions(user?.id, user?.role)
// //       .then(setItems)
// //       .catch(() => setItems([]))
// //       .finally(() => setLoading(false))
// //   }, [user?.id, user?.role])

// //   return (
// //     <>
// //       <div className="page-heading">
// //         <div>
// //           <div className="eyebrow">ACTIVITY & SETTLEMENTS</div>
// //           <h1>Transaction history</h1>
// //           <p className="muted">Your transfers and security evaluations from the FraudGuard-backed transaction store.</p>
// //         </div>
// //         {user?.role === 'sender' && <Link className="primary" to="/send">Send money →</Link>}
// //       </div>

// //       {loading ? (
// //         <div className="empty">
// //           <span>Loading transactions…</span>
// //         </div>
// //       ) : (
// //         <TransactionList items={items} currentUser={user} />
// //       )}
// //     </>
// //   )
// // }

// // function Beneficiaries() {
// //   const user = getUser(localStorage.getItem('paysecure_session'))
// //   if (user?.role !== 'sender') return <Navigate to="/transactions" replace />
// //   const receivers = getReceiverOptions(user?.id)

// //   return (
// //     <>
// //       <div className="page-heading">
// //         <div>
// //           <div className="eyebrow">BENEFICIARY MANAGEMENT</div>
// //           <h1>Beneficiaries</h1>
// //           <p className="muted">Saved receivers available for instant transfers.</p>
// //         </div>
// //       </div>

// //       <div className="beneficiary-grid">
// //         {receivers.map((r) => (
// //           <div className="beneficiary" key={r.id}>
// //             <div className="avatar large">{r.name[0]}</div>
// //             <div>
// //               <strong>{r.name}</strong>
// //               <span>{r.account}</span>
// //               <small>{r.accountType} Account</small>
// //             </div>
// //             <Link to="/send" className="primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
// //               Send money
// //             </Link>
// //           </div>
// //         ))}
// //       </div>
// //     </>
// //   )
// // }

// // function App() {
// //   return (
// //     <Routes>
// //       <Route path="/login" element={<Login />} />
// //       <Route
// //         path="*"
// //         element={
// //           <Protected>
// //             <Shell>
// //               <Routes>
// //                 <Route path="/dashboard" element={<Dashboard />} />
// //                 <Route path="/send" element={<SendMoney />} />
// //                 <Route path="/transactions" element={<Transactions />} />
// //                 <Route path="/beneficiaries" element={<Beneficiaries />} />
// //                 <Route path="*" element={<Navigate to="/dashboard" replace />} />
// //               </Routes>
// //             </Shell>
// //           </Protected>
// //         }
// //       />
// //     </Routes>
// //   )
// // }

// // export default App


// import { useEffect, useState } from 'react'
// import {
//   Link,
//   Navigate,
//   Route,
//   Routes,
//   useLocation,
//   useNavigate,
// } from 'react-router-dom'

// import { analyzePayment, getUserTransactions } from './api'

// import {
//   DEMO_USERS,
//   formatDate,
//   formatINR,
//   getReceiverOptions,
//   getUser,
//   recordTransferBalances,
// } from './data'


// // ============================================================
// // AUTHENTICATION
// // ============================================================

// function Protected({ children }) {
//   const session = localStorage.getItem('paysecure_session')

//   return session
//     ? children
//     : <Navigate to="/login" replace />
// }


// // ============================================================
// // APPLICATION SHELL
// // ============================================================

// function Shell({ children }) {
//   const user = getUser(
//     localStorage.getItem('paysecure_session')
//   )

//   const navigate = useNavigate()
//   const location = useLocation()

//   const [open, setOpen] = useState(false)

//   const logout = () => {
//     localStorage.removeItem('paysecure_session')
//     navigate('/login')
//   }

//   const links = [
//     ['/dashboard', 'Overview'],

//     ...(user?.role === 'sender'
//       ? [
//           ['/send', 'Send money'],
//           ['/beneficiaries', 'Beneficiaries'],
//         ]
//       : []),

//     [
//       '/transactions',
//       user?.role === 'receiver'
//         ? 'Received payments'
//         : 'Transactions',
//     ],
//   ]

//   return (
//     <div className="app">

//       {open && (
//         <div
//           className="sidebar-backdrop"
//           onClick={() => setOpen(false)}
//         />
//       )}

//       <aside className={`sidebar ${open ? 'open' : ''}`}>

//         <div className="brand">
//           <div className="brand-mark">
//             P
//           </div>

//           <div className="brand-copy">
//             <strong>PaySecure</strong>
//             <span>Personal Banking</span>
//           </div>
//         </div>

//         <nav>
//           {links.map(([to, label]) => (
//             <Link
//               key={to}
//               className={
//                 location.pathname === to
//                   ? 'active'
//                   : ''
//               }
//               to={to}
//               onClick={() => setOpen(false)}
//             >
//               <span className="nav-dot" />
//               {label}
//             </Link>
//           ))}
//         </nav>

//         <div className="sidebar-bottom">

//           <div className="security-badge-sidebar">
//             <span className="shield-icon">
//               🛡️
//             </span>

//             <div>
//               <strong>
//                 Protected by FraudGuard
//               </strong>

//               <small>
//                 Real-time ML fraud scoring &
//                 anomaly detection active
//               </small>
//             </div>
//           </div>

//           <button
//             className="ghost full"
//             onClick={logout}
//           >
//             Sign out
//           </button>

//         </div>

//       </aside>

//       <main className="main">

//         <header className="topbar">

//           <button
//             className="menu-button"
//             onClick={() => setOpen(!open)}
//             aria-label="Toggle navigation"
//           >
//             ☰
//           </button>

//           <div className="topbar-title">
//             <span>
//               PaySecure Personal Banking
//             </span>

//             <small>
//               <span className="pulse-dot" />
//               FraudGuard Security Connected
//             </small>
//           </div>

//           <div className="user-menu">

//             <div className="avatar">
//               {user?.name?.[0] || 'U'}
//             </div>

//             <div className="user-copy">
//               <strong>
//                 {user?.name}
//               </strong>

//               <span>
//                 {user?.account}
//               </span>
//             </div>

//           </div>

//         </header>

//         <div className="content">
//           {children}
//         </div>

//       </main>

//     </div>
//   )
// }


// // ============================================================
// // LOGIN
// // ============================================================

// function Login() {
//   const [loginId, setLoginId] =
//     useState('ashwin')

//   const [pin, setPin] =
//     useState('1234')

//   const [error, setError] =
//     useState('')

//   const navigate = useNavigate()

//   const submit = (e) => {
//     e.preventDefault()

//     const user = DEMO_USERS.find(
//       (u) =>
//         u.loginId ===
//           loginId.trim().toLowerCase() &&
//         u.pin === pin
//     )

//     if (!user) {
//       setError(
//         'Invalid credentials. Use demo PIN 1234.'
//       )

//       return
//     }

//     localStorage.setItem(
//       'paysecure_session',
//       String(user.id)
//     )

//     navigate('/dashboard')
//   }

//   return (
//     <div className="login-page">

//       <div className="login-card">

//         <div className="brand centered">

//           <div className="brand-mark">
//             P
//           </div>

//           <div className="brand-copy">
//             <strong>
//               PaySecure
//             </strong>

//             <span>
//               Personal Banking
//             </span>
//           </div>

//         </div>

//         <div className="eyebrow">
//           SECURE PERSONAL BANKING
//         </div>

//         <h1>
//           Welcome back
//         </h1>

//         <p className="muted">
//           Sign in to your account. All
//           transfers are screened in real
//           time by the FraudGuard AI engine.
//         </p>

//         <form onSubmit={submit}>

//           <label>
//             Select account
//           </label>

//           <select
//             value={loginId}
//             onChange={(e) =>
//               setLoginId(e.target.value)
//             }
//           >
//             <option value="ashwin">
//               Ashwin — Primary Sender
//               (•••• 1001)
//             </option>

//             <option value="rahul">
//               Rahul Kumar — Beneficiary
//               (•••• 4821)
//             </option>

//             <option value="priya">
//               Priya Sharma — Beneficiary
//               (•••• 7316)
//             </option>
//           </select>

//           <label>
//             Security PIN
//           </label>

//           <input
//             type="password"
//             inputMode="numeric"
//             maxLength="4"
//             value={pin}
//             onChange={(e) =>
//               setPin(e.target.value)
//             }
//             placeholder="••••"
//           />

//           {error && (
//             <div className="error-box">
//               {error}
//             </div>
//           )}

//           <button
//             className="primary full"
//             type="submit"
//             style={{ marginTop: '16px' }}
//           >
//             Sign in
//           </button>

//         </form>

//         <div className="demo-hint">
//           Demo PIN: <strong>1234</strong>
//           <br />
//           Protected by FraudGuard ·
//           Controlled Hackathon Environment
//         </div>

//       </div>

//     </div>
//   )
// }


// // ============================================================
// // DASHBOARD
// // ============================================================

// function Dashboard() {
//   const user = getUser(
//     localStorage.getItem('paysecure_session')
//   )

//   const [transactions, setTransactions] =
//     useState([])

//   useEffect(() => {
//     if (!user) return

//     getUserTransactions(
//       user.id,
//       user.role
//     )
//       .then(setTransactions)
//       .catch(() => {})
//   }, [user?.id, user?.role])

//   return (
//     <>
//       <div className="page-heading">

//         <div>

//           <div className="eyebrow">
//             ACCOUNT OVERVIEW
//           </div>

//           <h1>
//             Good to see you,{' '}
//             {user?.name.split(' ')[0]}.
//           </h1>

//           <p className="muted">
//             {user?.role === 'receiver'
//               ? 'Your received payments and account history.'
//               : 'Your personal account balance and real-time security status.'}
//           </p>

//         </div>

//         {user?.role === 'sender' && (
//           <Link
//             className="primary"
//             to="/send"
//           >
//             Send money →
//           </Link>
//         )}

//       </div>


//       <section className="balance-grid">

//         <div className="balance-card">

//           <span>
//             Available balance
//           </span>

//           <strong>
//             {formatINR(user?.balance)}
//           </strong>

//           <small>
//             {user?.accountType} Account ·{' '}
//             {user?.account}
//           </small>

//         </div>


//         <div className="stat-card">

//           <span>
//             Security Layer
//           </span>

//           <strong>
//             🛡️ Active & Protected
//           </strong>

//           <small>
//             Outward payments are analyzed
//             in real time across behavioral,
//             anomaly, and velocity models
//             by FraudGuard.
//           </small>

//         </div>

//       </section>


//       <section className="section">

//         <div className="section-head">

//           <div>

//             <h2>
//               Recent activity
//             </h2>

//             <p className="muted">
//               Recent payments and screening
//               results.
//             </p>

//           </div>

//           <Link
//             to="/transactions"
//             className="text-link"
//           >
//             View all activity →
//           </Link>

//         </div>

//         <TransactionList
//           items={transactions.slice(0, 5)}
//           currentUser={user}
//         />

//       </section>
//     </>
//   )
// }


// // ============================================================
// // TRANSACTION LIST
// // ============================================================

// function TransactionList({
//   items,
//   currentUser,
//   onViewDetails,
// }) {
//   if (!items.length) {
//     return (
//       <div className="empty">

//         <strong>
//           No recent transactions
//         </strong>

//         <span>
//           Payments processed through
//           PaySecure will appear here with
//           their security assessments.
//         </span>

//       </div>
//     )
//   }

//   return (
//     <div className="transaction-list">

//       {items.map((t) => {

//         const outgoing =
//           Number(
//             t.user_id ??
//             t.sender_user_id
//           ) === Number(currentUser?.id)

//         const recipientTitle = outgoing
//           ? (
//               t.receiver_name ||
//               'Payment sent'
//             )
//           : (
//               t.sender_name ||
//               'Payment received'
//             )

//         return (
//           <div
//             className="transaction-row"
//             key={
//               t.transaction_id ||
//               t.id
//             }
//           >

//             <div
//               className={
//                 `transaction-icon ${
//                   outgoing
//                     ? 'outgoing'
//                     : 'incoming'
//                 }`
//               }
//             >
//               {outgoing ? '↑' : '↓'}
//             </div>


//             <div className="transaction-main">

//               <strong>
//                 {recipientTitle}
//               </strong>

//               <span>
//                 {t.transaction_id} ·{' '}
//                 {formatDate(
//                   t.created_at ||
//                   t.timestamp
//                 )}
//               </span>

//             </div>


//             <div
//               className={
//                 `transaction-amount ${
//                   outgoing
//                     ? 'outgoing'
//                     : 'incoming'
//                 }`
//               }
//             >

//               <strong>
//                 {outgoing ? '-' : '+'}
//                 {formatINR(t.amount)}
//               </strong>

//               <RiskPill
//                 risk={t.risk_level}
//               />

//             </div>


//             {onViewDetails && (
//               <button
//                 type="button"
//                 className="view-transaction-details"
//                 onClick={() =>
//                   onViewDetails(t)
//                 }
//               >
//                 View details
//               </button>
//             )}

//           </div>
//         )
//       })}

//     </div>
//   )
// }


// // ============================================================
// // RISK PILL
// // ============================================================

// function RiskPill({ risk }) {
//   const r =
//     (risk || 'PENDING')
//       .toLowerCase()

//   let label = 'PENDING'

//   if (r === 'low') {
//     label = 'LOW / Verified'
//   }

//   else if (r === 'medium') {
//     label = 'MEDIUM / Review'
//   }

//   else if (r === 'high') {
//     label = 'HIGH / Review'
//   }

//   else if (r === 'critical') {
//     label = 'CRITICAL / Flagged'
//   }

//   return (
//     <span className={`risk ${r}`}>
//       {label}
//     </span>
//   )
// }


// // ============================================================
// // SEND MONEY
// // ============================================================

// function SendMoney() {

//   const user = getUser(
//     localStorage.getItem('paysecure_session')
//   )

//   const receivers =
//     getReceiverOptions(user?.id)

//   const [receiverId, setReceiverId] =
//     useState(
//       String(receivers[0]?.id || '')
//     )

//   const [amount, setAmount] =
//     useState('')

//   const [note, setNote] =
//     useState('')

//   /*
//    * normal
//    * suspicious
//    */
//   const [scenario, setScenario] =
//     useState('normal')

//   const [step, setStep] =
//     useState(1)

//   const [result, setResult] =
//     useState(null)

//   const [busy, setBusy] =
//     useState(false)

//   const [error, setError] =
//     useState('')

//   if (user?.role !== 'sender') {
//     return (
//       <Navigate
//         to="/transactions"
//         replace
//       />
//     )
//   }

//   const receiver =
//     getUser(receiverId)


//   // ==========================================================
//   // BUILD REAL FRAUDGUARD FEATURES
//   // ==========================================================

//   const buildFeatures = () => {

//     const now = new Date()

//     const day =
//       now.getDay()

//     /*
//      * NORMAL TRANSACTION
//      *
//      * These are simulated normal behavioral
//      * values for the hackathon banking demo.
//      */
//     if (scenario === 'normal') {

//       const normalAmount =
//         Number(amount) || 500

//       const avgUserAmount = 2000

//       return {
//         avg_user_amount:
//           avgUserAmount,

//         /*
//          * Required behavioral ratio.
//          */
//         amount_ratio:
//           Number(
//             (
//               normalAmount /
//               avgUserAmount
//             ).toFixed(2)
//           ),

//         transactions_last_10min:
//           1,

//         new_device:
//           0,

//         new_location:
//           0,

//         international:
//           0,

//         merchant_risk:
//           2,

//         account_age_days:
//           1200,

//         device_age_days:
//           300,

//         distance_from_home:
//           5,

//         failed_attempts_10min:
//           0,

//         /*
//          * Deliberately use a normal
//          * daytime hour for the demo.
//          */
//         hour:
//           12,

//         day_of_week:
//           day,

//         is_weekend:
//           Number(day >= 5),

//         unusual_hour:
//           0,
//       }
//     }


//     // ========================================================
//     // FRAUD / SUSPICIOUS TEST TRANSACTION
//     // ========================================================

//     /*
//      * IMPORTANT:
//      *
//      * The frontend does NOT set risk_level.
//      *
//      * It only supplies suspicious behavioral
//      * signals to the existing FraudGuard
//      * risk engine.
//      *
//      * FraudGuard decides whether this becomes
//      * LOW / MEDIUM / HIGH / CRITICAL.
//      */

//     const suspiciousAmount =
//       Number(amount) || 8500

//     const avgUserAmount = 2000

//     return {

//       avg_user_amount:
//         avgUserAmount,

//       /*
//        * Example:
//        * ₹8500 / ₹2000 = 4.25
//        */
//       amount_ratio:
//         Number(
//           (
//             suspiciousAmount /
//             avgUserAmount
//           ).toFixed(2)
//         ),

//       /*
//        * Very high transaction velocity.
//        */
//       transactions_last_10min:
//         8,

//       /*
//        * New device.
//        */
//       new_device:
//         1,

//       /*
//        * New location.
//        */
//       new_location:
//         1,

//       /*
//        * International transaction.
//        */
//       international:
//         1,

//       /*
//        * High-risk merchant.
//        */
//       merchant_risk:
//         8,

//       /*
//        * Relatively new account.
//        */
//       account_age_days:
//         90,

//       /*
//        * Very new device.
//        */
//       device_age_days:
//         5,

//       /*
//        * Extremely far from normal
//        * home location.
//        */
//       distance_from_home:
//         800,

//       /*
//        * Multiple failed attempts.
//        */
//       failed_attempts_10min:
//         4,

//       /*
//        * 1 AM.
//        */
//       hour:
//         1,

//       day_of_week:
//         day,

//       is_weekend:
//         Number(day >= 5),

//       /*
//        * Explicit unusual-hour signal.
//        */
//       unusual_hour:
//         1,
//     }
//   }


//   // ==========================================================
//   // CONFIRM PAYMENT
//   // ==========================================================

//   const confirm = async () => {

//     setError('')

//     const value =
//       Number(amount)


//     if (!receiver) {
//       setError(
//         'Please select a recipient.'
//       )

//       setStep(1)

//       return
//     }


//     if (!value || value <= 0) {
//       setError(
//         'Please enter a valid transfer amount.'
//       )

//       setStep(1)

//       return
//     }


//     if (value > user.balance) {
//       setError(
//         'Insufficient available balance.'
//       )

//       setStep(1)

//       return
//     }


//     if (
//       Number(receiver.id) ===
//       Number(user.id)
//     ) {
//       setError(
//         'You cannot transfer money to your own account.'
//       )

//       setStep(1)

//       return
//     }


//     /*
//      * Prevent duplicate submissions.
//      */
//     if (busy) {
//       return
//     }


//     setBusy(true)

//     setStep(3)


//     const features =
//       buildFeatures()


//     /*
//      * SAME transaction ID is sent to
//      * FraudGuard and stored in the
//      * existing transaction system.
//      */
//     const transactionId =
//       `TXN-BANK-${Date.now()}-${Math.random()
//         .toString(36)
//         .slice(2, 7)
//         .toUpperCase()}`


//     const payload = {

//       transaction_id:
//         transactionId,

//       sender_user_id:
//         user.id,

//       sender_name:
//         user.name,

//       sender_account:
//         user.account,

//       receiver_user_id:
//         receiver.id,

//       receiver_name:
//         receiver.name,

//       receiver_account:
//         receiver.account,

//       amount:
//         value,

//       /*
//        * Payment note is retained locally
//        * where supported by the backend.
//        */
//       note,

//       /*
//        * Demo scenario identifier.
//        */
//       scenario,

//       /*
//        * FraudGuard behavioral features.
//        */
//       ...features,
//     }


//     try {

//       /*
//        * IMPORTANT:
//        *
//        * This is the actual FraudGuard API.
//        * We do not fabricate the result.
//        */
//       const data =
//         await analyzePayment(payload)


//       /*
//        * Only update balances after the
//        * backend accepts the transaction.
//        */
//       recordTransferBalances(
//         user.id,
//         receiver.id,
//         value
//       )


//       setResult(data)

//       setStep(4)

//     }

//     catch (e) {

//       console.error(
//         'FraudGuard transaction error:',
//         e
//       )

//       setError(
//         e?.response?.data?.detail ||
//         e?.message ||
//         'Security analysis service temporarily unavailable.'
//       )

//       setStep(2)

//     }

//     finally {

//       setBusy(false)

//     }
//   }


//   // ==========================================================
//   // RESULT SCREEN
//   // ==========================================================

//   if (step === 4 && result) {

//     return (
//       <ResultScreen
//         result={result}
//         receiver={receiver}
//         scenario={scenario}
//         onAgain={() => {

//           setResult(null)

//           setStep(1)

//           setAmount('')

//           setNote('')

//           setError('')

//         }}
//       />
//     )
//   }


//   return (
//     <>
//       <div className="page-heading">

//         <div>

//           <div className="eyebrow">
//             INSTANT TRANSFERS
//           </div>

//           <h1>
//             Send money
//           </h1>

//           <p className="muted">
//             Direct UPI & IMPS transfers
//             protected by real-time AI
//             security screening.
//           </p>

//         </div>

//         <div
//           className="balance-inline"
//           style={{ fontWeight: 700 }}
//         >
//           Available balance:{' '}
//           {formatINR(user?.balance)}
//         </div>

//       </div>


//       <div className="steps">

//         <span
//           className={
//             step >= 1
//               ? 'done'
//               : ''
//           }
//         >
//           1 Recipient & Amount
//         </span>

//         <i />

//         <span
//           className={
//             step >= 2
//               ? 'done'
//               : ''
//           }
//         >
//           2 Review
//         </span>

//         <i />

//         <span
//           className={
//             step >= 3
//               ? 'done'
//               : ''
//           }
//         >
//           3 Security Screening
//         </span>

//       </div>


//       {/* ======================================================
//           STEP 1
//           ====================================================== */}

//       {step === 1 && (

//         <div className="form-card narrow">

//           <h2>
//             Select recipient & amount
//           </h2>

//           <p className="muted">
//             Choose a beneficiary and
//             transfer amount.
//           </p>


//           <label>
//             Recipient
//           </label>

//           <select
//             value={receiverId}
//             onChange={(e) =>
//               setReceiverId(e.target.value)
//             }
//           >

//             {receivers.map((r) => (

//               <option
//                 key={r.id}
//                 value={r.id}
//               >
//                 {r.name} · {r.account}
//               </option>

//             ))}

//           </select>


//           <div className="receiver-preview">

//             <div className="avatar large">
//               {receiver?.name?.[0]}
//             </div>

//             <div>

//               <strong>
//                 {receiver?.name}
//               </strong>

//               <span>
//                 {receiver?.account} ·{' '}
//                 {receiver?.accountType}{' '}
//                 Account
//               </span>

//             </div>

//           </div>


//           <label>
//             Amount (₹)
//           </label>

//           <div className="money-input">

//             <span>
//               ₹
//             </span>

//             <input
//               autoFocus
//               type="text"
//               inputMode="decimal"
//               value={amount}
//               onChange={(e) =>
//                 setAmount(
//                   e.target.value.replace(
//                     /[^\d.]/g,
//                     ''
//                   )
//                 )
//               }
//               placeholder="0.00"
//             />

//           </div>


//           <label>
//             Payment note (optional)
//           </label>

//           <input
//             type="text"
//             value={note}
//             onChange={(e) =>
//               setNote(e.target.value)
//             }
//             placeholder="e.g. Monthly rent, Invoice, Dinner"
//           />


//           {/* ==================================================
//               TRANSACTION MODE
//               ================================================== */}

//           <div className="scenario-header">

//             <label style={{ margin: 0 }}>
//               Transaction type
//             </label>

//             <span className="scenario-badge">
//               Hackathon Demo Mode
//             </span>

//           </div>


//           <div className="scenario-grid">

//             {/* NORMAL */}

//             <button
//               type="button"
//               className={
//                 scenario === 'normal'
//                   ? 'scenario selected normal-scenario'
//                   : 'scenario normal-scenario'
//               }
//               onClick={() => {

//                 setScenario('normal')

//                 if (
//                   !amount ||
//                   amount === '8500'
//                 ) {
//                   setAmount('500')
//                 }

//               }}
//             >

//               <span className="scenario-icon">
//                 ✓
//               </span>

//               <strong>
//                 Normal Transaction
//               </strong>

//               <span>
//                 Standard customer activity
//               </span>

//             </button>


//             {/* FRAUD */}

//             <button
//               type="button"
//               className={
//                 scenario === 'suspicious'
//                   ? 'scenario selected fraud-scenario'
//                   : 'scenario fraud-scenario'
//               }
//               onClick={() => {

//                 setScenario('suspicious')

//                 if (
//                   !amount ||
//                   amount === '500'
//                 ) {
//                   setAmount('8500')
//                 }

//               }}
//             >

//               <span className="scenario-icon">
//                 ⚠
//               </span>

//               <strong>
//                 Fraud Test Transaction
//               </strong>

//               <span>
//                 Suspicious behavioral signals
//               </span>

//             </button>

//           </div>


//           {/* ==================================================
//               SELECTED SCENARIO INFORMATION
//               ================================================== */}

//           {scenario === 'normal' && (

//             <div className="scenario-info normal-info">

//               <strong>
//                 ✓ Normal transaction profile
//               </strong>

//               <span>
//                 Uses simulated normal device,
//                 location, velocity and spending
//                 behavior. FraudGuard will perform
//                 the actual risk assessment.
//               </span>

//             </div>

//           )}


//           {scenario === 'suspicious' && (

//             <div className="scenario-info fraud-info">

//               <strong>
//                 ⚠ Fraud test profile
//               </strong>

//               <span>
//                 Uses simulated suspicious signals
//                 such as a new device, new location,
//                 international activity, high velocity,
//                 failed attempts and unusual hour.
//               </span>

//             </div>

//           )}


//           <div
//             style={{
//               display: 'flex',
//               gap: '8px',
//               marginBottom: '16px',
//             }}
//           >

//             <button
//               type="button"
//               className="secondary"
//               style={{
//                 flex: 1,
//                 fontSize: '12px',
//                 padding: '8px',
//               }}
//               onClick={() => {

//                 setScenario('normal')

//                 setAmount('500')

//               }}
//             >
//               ₹500 Normal
//             </button>


//             <button
//               type="button"
//               className="secondary"
//               style={{
//                 flex: 1,
//                 fontSize: '12px',
//                 padding: '8px',
//               }}
//               onClick={() => {

//                 setScenario('suspicious')

//                 setAmount('8500')

//               }}
//             >
//               ₹8,500 Fraud Test
//             </button>

//           </div>


//           {error && (
//             <div className="error-box">
//               {error}
//             </div>
//           )}


//           <button
//             className="primary full"
//             onClick={() => {

//               if (
//                 !receiver
//               ) {
//                 setError(
//                   'Please select a recipient.'
//                 )

//                 return
//               }

//               if (
//                 !amount ||
//                 Number(amount) <= 0
//               ) {
//                 setError(
//                   'Please enter a valid amount.'
//                 )

//                 return
//               }

//               setError('')

//               setStep(2)

//             }}
//           >
//             Continue to review →
//           </button>

//         </div>

//       )}


//       {/* ======================================================
//           STEP 2 — REVIEW
//           ====================================================== */}

//       {step === 2 && (

//         <div className="form-card narrow">

//           <h2>
//             Review payment
//           </h2>

//           <p className="muted">
//             Please confirm transfer details
//             before real-time security analysis.
//           </p>


//           {/* SELECTED TYPE */}

//           <div
//             className={
//               scenario === 'suspicious'
//                 ? 'review-mode fraud-review-mode'
//                 : 'review-mode normal-review-mode'
//             }
//           >

//             <span>
//               Transaction profile
//             </span>

//             <strong>
//               {scenario === 'suspicious'
//                 ? '⚠ Fraud Test Transaction'
//                 : '✓ Normal Transaction'}
//             </strong>

//           </div>


//           <div className="review">

//             <div>

//               <span>
//                 Recipient
//               </span>

//               <strong>
//                 {receiver?.name}
//               </strong>

//             </div>


//             <div>

//               <span>
//                 Recipient Account
//               </span>

//               <small
//                 style={{
//                   fontFamily:
//                     'var(--font-mono)',
//                 }}
//               >
//                 {receiver?.account}
//               </small>

//             </div>


//             {note && (

//               <div>

//                 <span>
//                   Note
//                 </span>

//                 <strong>
//                   {note}
//                 </strong>

//               </div>

//             )}


//             <div>

//               <span>
//                 Transfer amount
//               </span>

//               <strong>
//                 {formatINR(amount)}
//               </strong>

//             </div>


//             <div>

//               <span>
//                 Transfer fee
//               </span>

//               <strong
//                 style={{
//                   color:
//                     'var(--accent-emerald)',
//                 }}
//               >
//                 ₹0.00 (Instant IMPS)
//               </strong>

//             </div>


//             <div className="total">

//               <span>
//                 Total debit
//               </span>

//               <strong>
//                 {formatINR(amount)}
//               </strong>

//             </div>

//           </div>


//           <div className="secure-callout">

//             <strong>
//               🛡️ FraudGuard Real-Time
//               Security Screening
//             </strong>

//             <span>
//               This transaction will be sent
//               to the existing FraudGuard
//               backend for behavioral, anomaly
//               and rule-based risk analysis.
//             </span>

//           </div>


//           {scenario === 'suspicious' && (

//             <div className="fraud-warning-callout">

//               <strong>
//                 ⚠ Suspicious test profile selected
//               </strong>

//               <span>
//                 The banking application will
//                 submit simulated suspicious
//                 behavioral signals. FraudGuard
//                 will determine the final risk
//                 level.
//               </span>

//             </div>

//           )}


//           {scenario === 'normal' && (

//             <div className="normal-callout">

//               <strong>
//                 ✓ Normal test profile selected
//               </strong>

//               <span>
//                 The transaction will be submitted
//                 with normal simulated behavioral
//                 signals for a low-risk demonstration.
//               </span>

//             </div>

//           )}


//           {error && (
//             <div className="error-box">
//               {error}
//             </div>
//           )}


//           <div className="button-row">

//             <button
//               className="secondary"
//               onClick={() =>
//                 setStep(1)
//               }
//               disabled={busy}
//             >
//               ← Back
//             </button>

//             <button
//               className="primary"
//               disabled={busy}
//               onClick={confirm}
//             >
//               {busy
//                 ? 'Analyzing...'
//                 : 'Confirm & Pay →'}
//             </button>

//           </div>

//         </div>

//       )}


//       {/* ======================================================
//           STEP 3
//           ====================================================== */}

//       {step === 3 && (

//         <SecurityProcessing
//           amount={amount}
//           receiverName={receiver?.name}
//           scenario={scenario}
//         />

//       )}

//     </>
//   )
// }


// // ============================================================
// // SECURITY PROCESSING
// // ============================================================

// function SecurityProcessing({
//   amount,
//   receiverName,
//   scenario,
// }) {

//   const [activeStep, setActiveStep] =
//     useState(1)

//   useEffect(() => {

//     const t1 =
//       setTimeout(
//         () => setActiveStep(2),
//         500
//       )

//     const t2 =
//       setTimeout(
//         () => setActiveStep(3),
//         1100
//       )

//     const t3 =
//       setTimeout(
//         () => setActiveStep(4),
//         1800
//       )

//     const t4 =
//       setTimeout(
//         () => setActiveStep(5),
//         2400
//       )

//     return () => {

//       clearTimeout(t1)
//       clearTimeout(t2)
//       clearTimeout(t3)
//       clearTimeout(t4)

//     }

//   }, [])


//   return (

//     <div className="processing-card">

//       <div className="transfer-animation-badge">

//         <span>
//           Ashwin
//         </span>

//         <span>
//           →
//         </span>

//         <span>
//           {formatINR(amount)}
//         </span>

//         <span>
//           →
//         </span>

//         <span>
//           {receiverName || 'Recipient'}
//         </span>

//       </div>


//       <div className="spinner" />


//       <div className="eyebrow">
//         REAL-TIME SECURITY SCREENING
//       </div>


//       <h1>
//         Securing your payment
//       </h1>


//       <p className="muted">

//         {scenario === 'suspicious'
//           ? 'FraudGuard is evaluating the suspicious behavioral profile.'
//           : 'FraudGuard is evaluating the normal transaction profile.'}

//       </p>


//       <div className="process-list">

//         <div>

//           <span
//             className={
//               `process-icon ${
//                 activeStep > 1
//                   ? 'done'
//                   : activeStep === 1
//                   ? 'active'
//                   : 'pending'
//               }`
//             }
//           >
//             {activeStep > 1
//               ? '✓'
//               : '•'}
//           </span>

//           <span
//             style={{
//               color:
//                 activeStep >= 1
//                   ? 'var(--text-main)'
//                   : 'var(--text-muted)',

//               fontWeight:
//                 activeStep === 1
//                   ? 700
//                   : 500,
//             }}
//           >
//             Transaction details
//             submitted & validated
//           </span>

//         </div>


//         <div>

//           <span
//             className={
//               `process-icon ${
//                 activeStep > 2
//                   ? 'done'
//                   : activeStep === 2
//                   ? 'active'
//                   : 'pending'
//               }`
//             }
//           >
//             {activeStep > 2
//               ? '✓'
//               : '•'}
//           </span>

//           <span
//             style={{
//               color:
//                 activeStep >= 2
//                   ? 'var(--text-main)'
//                   : 'var(--text-muted)',

//               fontWeight:
//                 activeStep === 2
//                   ? 700
//                   : 500,
//             }}
//           >
//             Fraud model behavioral
//             risk scoring
//           </span>

//         </div>


//         <div>

//           <span
//             className={
//               `process-icon ${
//                 activeStep > 3
//                   ? 'done'
//                   : activeStep === 3
//                   ? 'active'
//                   : 'pending'
//               }`
//             }
//           >
//             {activeStep > 3
//               ? '✓'
//               : '•'}
//           </span>

//           <span
//             style={{
//               color:
//                 activeStep >= 3
//                   ? 'var(--text-main)'
//                   : 'var(--text-muted)',

//               fontWeight:
//                 activeStep === 3
//                   ? 700
//                   : 500,
//             }}
//           >
//             Isolation Forest anomaly
//             detection
//           </span>

//         </div>


//         <div>

//           <span
//             className={
//               `process-icon ${
//                 activeStep > 4
//                   ? 'done'
//                   : activeStep === 4
//                   ? 'active'
//                   : 'pending'
//               }`
//             }
//           >
//             {activeStep > 4
//               ? '✓'
//               : '•'}
//           </span>

//           <span
//             style={{
//               color:
//                 activeStep >= 4
//                   ? 'var(--text-main)'
//                   : 'var(--text-muted)',

//               fontWeight:
//                 activeStep === 4
//                   ? 700
//                   : 500,
//             }}
//           >
//             SHAP explanation &
//             security rule evaluation
//           </span>

//         </div>


//         <div>

//           <span
//             className={
//               `process-icon ${
//                 activeStep >= 5
//                   ? 'done'
//                   : 'pending'
//               }`
//             }
//           >
//             {activeStep >= 5
//               ? '✓'
//               : '•'}
//           </span>

//           <span
//             style={{
//               color:
//                 activeStep >= 5
//                   ? 'var(--text-main)'
//                   : 'var(--text-muted)',

//               fontWeight:
//                 activeStep === 5
//                   ? 700
//                   : 500,
//             }}
//           >
//             Final risk assessment
//             & persistence
//           </span>

//         </div>

//       </div>


//       <div
//         style={{
//           marginTop: '24px',
//           fontSize: '11px',
//           color: 'var(--text-muted)',
//         }}
//       >
//         🛡️ Protected by FraudGuard ·
//         Existing ML Risk Engine
//       </div>

//     </div>
//   )
// }


// // ============================================================
// // RESULT SCREEN
// // ============================================================

// function ResultScreen({
//   result,
//   receiver,
//   scenario,
//   onAgain,
// }) {

//   const risk =
//     String(
//       result?.risk_level ||
//       'LOW'
//     ).toUpperCase()

//   const isLowRisk =
//     risk === 'LOW'

//   const isMediumRisk =
//     risk === 'MEDIUM'

//   const isHighRisk =
//     risk === 'HIGH' ||
//     risk === 'CRITICAL'


//   const formattedProbability =
//     result?.fraud_probability != null
//       ? `${(
//           Number(
//             result.fraud_probability
//           ) * 100
//         ).toFixed(2)}%`
//       : result?.fraud_score != null
//       ? `${Number(
//           result.fraud_score
//         ).toFixed(2)}%`
//       : '—'


//   const finalScore =
//     result?.final_risk_score != null
//       ? `${Number(
//           result.final_risk_score
//         ).toFixed(1)} / 100`
//       : '—'


//   return (

//     <div className="result-wrap">

//       <div
//         className={
//           `result-mark ${
//             risk.toLowerCase()
//           }`
//         }
//       >
//         {isLowRisk
//           ? '✓'
//           : '!'}
//       </div>


//       <div className="eyebrow">

//         {isLowRisk
//           ? 'PAYMENT VERIFIED'
//           : isMediumRisk
//           ? 'PAYMENT UNDER REVIEW'
//           : 'SECURITY NOTICE'}

//       </div>


//       <h1>

//         {isLowRisk
//           ? 'Payment successful'
//           : isCriticalTitle(risk)}

//       </h1>


//       <p className="muted">

//         {isLowRisk
//           ? 'Your payment was successfully assessed by FraudGuard. No elevated risk signals were detected.'
//           : 'FraudGuard detected elevated risk signals on this payment. The transaction has been flagged for security review.'}

//       </p>


//       {/* DEMO TYPE */}

//       <div
//         className={
//           scenario === 'suspicious'
//             ? 'result-profile fraud-result-profile'
//             : 'result-profile normal-result-profile'
//         }
//       >

//         <strong>
//           {scenario === 'suspicious'
//             ? '⚠ Fraud Test Transaction'
//             : '✓ Normal Transaction'}
//         </strong>

//         <span>
//           Final status below is determined
//           by the actual FraudGuard backend.
//         </span>

//       </div>


//       <div className="result-card">

//         <div>

//           <span>
//             Transaction ID
//           </span>

//           <strong
//             style={{
//               fontFamily:
//                 'var(--font-mono)',
//             }}
//           >
//             {result?.transaction_id}
//           </strong>

//         </div>


//         <div>

//           <span>
//             Recipient
//           </span>

//           <strong>
//             {receiver?.name}
//           </strong>

//         </div>


//         <div>

//           <span>
//             Amount
//           </span>

//           <strong>
//             {formatINR(result?.amount)}
//           </strong>

//         </div>


//         <div>

//           <span>
//             Risk Assessment
//           </span>

//           <RiskPill
//             risk={risk}
//           />

//         </div>


//         <div>

//           <span>
//             Fraud Probability
//           </span>

//           <strong>
//             {formattedProbability}
//           </strong>

//         </div>


//         <div>

//           <span>
//             Final Risk Score
//           </span>

//           <strong>
//             {finalScore}
//           </strong>

//         </div>

//       </div>


//       {isHighRisk &&
//         result?.reasons &&
//         result.reasons.length > 0 && (

//         <div className="reasons">

//           <strong>
//             ⚠️ Detected Security Signals
//           </strong>

//           {result.reasons.map(
//             (r, index) => (

//               <span
//                 key={`${r}-${index}`}
//               >
//                 • {r}
//               </span>

//             )
//           )}

//         </div>

//       )}


//       {/* AI EXPLANATION ONLY IF AVAILABLE */}

//       {(result?.ai_explanation ||
//         result?.aiExplanation) && (

//         <div className="result-ai-explanation">

//           <strong>
//             ✦ AI Investigation Explanation
//           </strong>

//           <p>
//             {result.ai_explanation ||
//               result.aiExplanation}
//           </p>

//         </div>

//       )}


//       {isHighRisk && (

//         <p
//           style={{
//             fontSize: '11.5px',
//             color: 'var(--text-muted)',
//             marginBottom: '20px',
//           }}
//         >
//           ℹ️ This transaction record is
//           preserved in the FraudGuard
//           monitoring platform for compliance
//           and investigation.
//         </p>

//       )}


//       <div className="button-row center">

//         <Link
//           className="secondary"
//           to="/transactions"
//         >
//           View all transactions
//         </Link>

//         <button
//           className="primary"
//           onClick={onAgain}
//         >
//           {isLowRisk
//             ? 'Send another payment'
//             : 'Back to payments'}
//         </button>

//       </div>

//     </div>
//   )
// }


// function isCriticalTitle(risk) {

//   if (risk === 'CRITICAL') {
//     return 'Transaction flagged for security review'
//   }

//   if (risk === 'HIGH') {
//     return 'Security review required'
//   }

//   return 'Payment requires additional verification'
// }


// // ============================================================
// // TRANSACTION DETAILS
// // ============================================================

// function TransactionDetail({
//   transaction,
//   currentUser,
//   onClose,
// }) {

//   if (!transaction) {
//     return null
//   }


//   const risk =
//     String(
//       transaction?.risk_level ||
//       'PENDING'
//     ).toLowerCase()


//   const transactionId =
//     transaction?.transaction_id ||
//     transaction?.id ||
//     'N/A'


//   const senderId =
//     transaction?.sender_user_id ??
//     transaction?.user_id


//   const receiverId =
//     transaction?.receiver_user_id


//   const sender =
//     DEMO_USERS.find(
//       (u) =>
//         Number(u.id) ===
//         Number(senderId)
//     )


//   const receiver =
//     DEMO_USERS.find(
//       (u) =>
//         Number(u.id) ===
//         Number(receiverId)
//     )


//   const outgoing =
//     Number(senderId) ===
//     Number(currentUser?.id)


//   const transactionType =
//     outgoing
//       ? 'Money sent'
//       : 'Money received'


//   const amount =
//     transaction?.amount || 0


//   const fraudProbability =
//     transaction?.fraud_probability


//   const finalRiskScore =
//     transaction?.final_risk_score


//   const anomalyScore =
//     transaction?.anomaly_score


//   const ruleScore =
//     transaction?.rule_score


//   const reasons =
//     transaction?.reasons || []


//   const aiExplanation =
//     transaction?.ai_explanation ||
//     transaction?.aiExplanation


//   return (

//     <div className="transaction-detail-overlay">

//       <div className="transaction-detail-light-panel">

//         {/* HEADER */}

//         <div className="transaction-detail-header">

//           <div>

//             <div className="transaction-detail-eyebrow">
//               TRANSACTION DETAILS
//             </div>

//             <h2>
//               {transactionId}
//             </h2>

//             <p>
//               Complete transaction and
//               security information
//             </p>

//           </div>


//           <button
//             type="button"
//             className="transaction-detail-close"
//             onClick={onClose}
//           >
//             ×
//           </button>

//         </div>


//         {/* SUMMARY */}

//         <div className="transaction-detail-summary">

//           <div>

//             <span className="transaction-detail-label">
//               {transactionType}
//             </span>

//             <div className="transaction-detail-amount">
//               {formatINR(amount)}
//             </div>

//             <span className="transaction-detail-id">
//               {transactionId}
//             </span>

//           </div>


//           <RiskPill
//             risk={risk}
//           />

//         </div>


//         {/* PARTICIPANTS */}

//         <section className="transaction-detail-section">

//           <div className="transaction-detail-section-title">
//             Participants
//           </div>


//           <div className="transaction-participants">

//             <div className="transaction-person-card">

//               <span className="transaction-detail-label">
//                 FROM
//               </span>

//               <strong>
//                 {sender?.name ||
//                   transaction?.sender_name ||
//                   'Unknown sender'}
//               </strong>

//               <small>
//                 {sender?.account ||
//                   transaction?.sender_account ||
//                   'Sender'}
//               </small>

//             </div>


//             <div className="transaction-flow-arrow">
//               →
//             </div>


//             <div className="transaction-person-card">

//               <span className="transaction-detail-label">
//                 TO
//               </span>

//               <strong>
//                 {receiver?.name ||
//                   transaction?.receiver_name ||
//                   'Unknown receiver'}
//               </strong>

//               <small>
//                 {receiver?.account ||
//                   transaction?.receiver_account ||
//                   'Receiver'}
//               </small>

//             </div>

//           </div>

//         </section>


//         {/* INFORMATION */}

//         <section className="transaction-detail-section">

//           <div className="transaction-detail-section-title">
//             Transaction Information
//           </div>


//           <div className="transaction-info-grid">

//             <div className="transaction-info-item">
//               <span>
//                 Transaction ID
//               </span>

//               <strong>
//                 {transactionId}
//               </strong>
//             </div>


//             <div className="transaction-info-item">
//               <span>
//                 Date & Time
//               </span>

//               <strong>
//                 {formatDate(
//                   transaction?.created_at ||
//                   transaction?.timestamp
//                 )}
//               </strong>
//             </div>


//             <div className="transaction-info-item">
//               <span>
//                 Transaction Type
//               </span>

//               <strong>
//                 {transactionType}
//               </strong>
//             </div>


//             <div className="transaction-info-item">
//               <span>
//                 Status
//               </span>

//               <strong
//                 className={
//                   `status-text status-${risk}`
//                 }
//               >
//                 {risk === 'low'
//                   ? 'Successful'
//                   : risk === 'medium'
//                   ? 'Under review'
//                   : risk === 'high'
//                   ? 'Flagged for review'
//                   : risk === 'critical'
//                   ? 'Critical security review'
//                   : 'Pending'}
//               </strong>
//             </div>


//             <div className="transaction-info-item">
//               <span>
//                 Amount
//               </span>

//               <strong>
//                 {formatINR(amount)}
//               </strong>
//             </div>


//             <div className="transaction-info-item">
//               <span>
//                 Security Level
//               </span>

//               <strong>
//                 {risk.toUpperCase()}
//               </strong>
//             </div>

//           </div>

//         </section>


//         {/* RISK ANALYSIS */}

//         <section className="transaction-detail-section">

//           <div className="transaction-detail-section-title">
//             FraudGuard Risk Analysis
//           </div>


//           <div className="risk-analysis-grid">

//             <div className="risk-analysis-card">

//               <span>
//                 Fraud Probability
//               </span>

//               <strong>
//                 {fraudProbability != null
//                   ? `${(
//                       Number(
//                         fraudProbability
//                       ) * 100
//                     ).toFixed(1)}%`
//                   : 'N/A'}
//               </strong>

//             </div>


//             <div className="risk-analysis-card">

//               <span>
//                 Final Risk Score
//               </span>

//               <strong>
//                 {finalRiskScore != null
//                   ? Number(
//                       finalRiskScore
//                     ).toFixed(1)
//                   : 'N/A'}
//               </strong>

//             </div>


//             <div className="risk-analysis-card">

//               <span>
//                 Anomaly Score
//               </span>

//               <strong>
//                 {anomalyScore != null
//                   ? Number(
//                       anomalyScore
//                     ).toFixed(1)
//                   : 'N/A'}
//               </strong>

//             </div>


//             <div className="risk-analysis-card">

//               <span>
//                 Rule Score
//               </span>

//               <strong>
//                 {ruleScore != null
//                   ? Number(
//                       ruleScore
//                     ).toFixed(1)
//                   : 'N/A'}
//               </strong>

//             </div>

//           </div>

//         </section>


//         {/* REASONS */}

//         {Array.isArray(reasons) &&
//           reasons.length > 0 && (

//           <section className="transaction-detail-section">

//             <div className="transaction-detail-section-title">
//               Detected Security Signals
//             </div>


//             <div className="transaction-risk-reasons">

//               {reasons.map(
//                 (reason, index) => (

//                   <div
//                     className="transaction-risk-reason"
//                     key={index}
//                   >

//                     <span>
//                       •
//                     </span>

//                     <span>
//                       {typeof reason === 'string'
//                         ? reason
//                         : reason?.reason ||
//                           reason?.message ||
//                           JSON.stringify(reason)}
//                     </span>

//                   </div>

//                 )
//               )}

//             </div>

//           </section>

//         )}


//         {/* AI EXPLANATION */}

//         {aiExplanation && (

//           <section className="transaction-ai-section">

//             <div className="transaction-ai-header">

//               <div className="transaction-ai-icon">
//                 ✦
//               </div>

//               <div>

//                 <h3>
//                   AI Investigation Explanation
//                 </h3>

//                 <p>
//                   Explanation generated from
//                   the available FraudGuard
//                   investigation data.
//                 </p>

//               </div>

//             </div>


//             <div className="transaction-ai-content">
//               {aiExplanation}
//             </div>

//           </section>

//         )}


//         <div className="transaction-detail-footer">

//           <button
//             type="button"
//             className="transaction-detail-done"
//             onClick={onClose}
//           >
//             Close details
//           </button>

//         </div>

//       </div>

//     </div>
//   )
// }


// // ============================================================
// // TRANSACTIONS PAGE
// // ============================================================

// function Transactions() {

//   const user = getUser(
//     localStorage.getItem('paysecure_session')
//   )

//   const [items, setItems] =
//     useState([])

//   const [loading, setLoading] =
//     useState(true)

//   const [
//     selectedTransaction,
//     setSelectedTransaction,
//   ] = useState(null)


//   useEffect(() => {

//     getUserTransactions(
//       user?.id,
//       user?.role
//     )
//       .then(setItems)
//       .catch(() => setItems([]))
//       .finally(() =>
//         setLoading(false)
//       )

//   }, [user?.id, user?.role])


//   return (
//     <>
//       <div className="page-heading">

//         <div>

//           <div className="eyebrow">
//             ACTIVITY & SETTLEMENTS
//           </div>

//           <h1>
//             Transaction history
//           </h1>

//           <p className="muted">
//             Your transfers and security
//             evaluations from the FraudGuard-backed
//             transaction store.
//           </p>

//         </div>


//         {user?.role === 'sender' && (

//           <Link
//             className="primary"
//             to="/send"
//           >
//             Send money →
//           </Link>

//         )}

//       </div>


//       {loading ? (

//         <div className="empty">
//           <span>
//             Loading transactions…
//           </span>
//         </div>

//       ) : (

//         <TransactionList
//           items={items}
//           currentUser={user}
//           onViewDetails={
//             setSelectedTransaction
//           }
//         />

//       )}


//       {/* LIGHT MODE DETAILS */}

//       {selectedTransaction && (

//         <TransactionDetail
//           transaction={
//             selectedTransaction
//           }
//           currentUser={user}
//           onClose={() =>
//             setSelectedTransaction(null)
//           }
//         />

//       )}

//     </>
//   )
// }


// // ============================================================
// // BENEFICIARIES
// // ============================================================

// function Beneficiaries() {

//   const user = getUser(
//     localStorage.getItem('paysecure_session')
//   )

//   if (user?.role !== 'sender') {

//     return (
//       <Navigate
//         to="/transactions"
//         replace
//       />
//     )

//   }


//   const receivers =
//     getReceiverOptions(user?.id)


//   return (
//     <>
//       <div className="page-heading">

//         <div>

//           <div className="eyebrow">
//             BENEFICIARY MANAGEMENT
//           </div>

//           <h1>
//             Beneficiaries
//           </h1>

//           <p className="muted">
//             Saved receivers available for
//             instant transfers.
//           </p>

//         </div>

//       </div>


//       <div className="beneficiary-grid">

//         {receivers.map((r) => (

//           <div
//             className="beneficiary"
//             key={r.id}
//           >

//             <div className="avatar large">
//               {r.name[0]}
//             </div>


//             <div>

//               <strong>
//                 {r.name}
//               </strong>

//               <span>
//                 {r.account}
//               </span>

//               <small>
//                 {r.accountType} Account
//               </small>

//             </div>


//             <Link
//               to="/send"
//               className="primary"
//               style={{
//                 padding: '8px 14px',
//                 fontSize: '12px',
//               }}
//             >
//               Send money
//             </Link>

//           </div>

//         ))}

//       </div>

//     </>
//   )
// }


// // ============================================================
// // APP
// // ============================================================

// function App() {

//   return (

//     <Routes>

//       <Route
//         path="/login"
//         element={<Login />}
//       />


//       <Route
//         path="*"
//         element={

//           <Protected>

//             <Shell>

//               <Routes>

//                 <Route
//                   path="/dashboard"
//                   element={<Dashboard />}
//                 />

//                 <Route
//                   path="/send"
//                   element={<SendMoney />}
//                 />

//                 <Route
//                   path="/transactions"
//                   element={<Transactions />}
//                 />

//                 <Route
//                   path="/beneficiaries"
//                   element={<Beneficiaries />}
//                 />

//                 <Route
//                   path="*"
//                   element={
//                     <Navigate
//                       to="/dashboard"
//                       replace
//                     />
//                   }
//                 />

//               </Routes>

//             </Shell>

//           </Protected>

//         }
//       />

//     </Routes>

//   )
// }

// export default App

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
    if (!user) return setError('Invalid credentials. Use demo PIN 1234.')
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
            <option value="ashwin">Ashwin — Primary Sender (•••• 1001)</option>
            <option value="rahul">Rahul Kumar — Beneficiary (•••• 4821)</option>
            <option value="priya">Priya Sharma — Beneficiary (•••• 7316)</option>
          </select>
          <label>Security PIN</label>
          <input type="password" inputMode="numeric" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
          {error && <div className="error-box">{error}</div>}
          <button className="primary full" type="submit" style={{ marginTop: '16px' }}>Sign in</button>
        </form>
        <div className="demo-hint">
          Demo PIN: <strong>1234</strong><br />
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
  const [step, setStep] = useState(1)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const receiver = getUser(receiverId)

  const buildFeatures = () => {
    const now = new Date()
    const scenarioConfig = getScenario(scenario)
    const base = scenarioConfig.features()
    const hour = scenario === 'high_risk' ? 1 : now.getHours()
    const day = now.getDay()
    return {
      ...base,
      hour,
      day_of_week: day,
      is_weekend: Number(day >= 5),
      unusual_hour: base.unusual_hour || Number(hour <= 5 || hour >= 23),
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
      recordTransferBalances(user.id, receiver.id, value)
      setResult(data)
      setStep(4)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Security analysis service temporarily unavailable.')
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
                  setScenario(s.id)
                  setAmount(String(s.suggestedAmount))
                }}
              >
                <strong>{s.label}</strong>
                <span>{s.description}</span>
              </button>
            ))}
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
            LightGBM behavioral risk scoring & velocity assessment
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
        {isLowRisk
          ? 'Payment successful'
          : isCriticalTitle(risk)}
      </h1>

      <p className="muted">
        {isLowRisk
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
          {result.reasons.map((r) => (
            <span key={r}>• {r}</span>
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
              {modelScore && <DetailRow label="Model Score (LightGBM)" value={modelScore} />}
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
            <span>Every transfer is scored by FraudGuard's LightGBM model, anomaly detector, and rule engine before it's marked successful.</span>
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
