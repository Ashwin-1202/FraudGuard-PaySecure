export const DEMO_USERS = [
  {
    id: 1001,
    name: 'Ashwin',
    account: 'XXXX XXXX 1001',
    accountType: 'Savings',
    balance: 500000,
    role: 'sender',
    loginId: 'ashwin',
    pin: '1234',
  },
  {
    id: 1002,
    name: 'Rahul Kumar',
    account: 'XXXX XXXX 4821',
    accountType: 'Savings',
    balance: 320400,
    role: 'sender',
    loginId: 'rahul',
    pin: '1234',
  },
  {
    id: 1003,
    name: 'Priya Sharma',
    account: 'XXXX XXXX 7316',
    accountType: 'Savings',
    balance: 41750,
    role: 'sender',
    loginId: 'priya',
    pin: '1234',
  },
]

export const getStoredBalances = () => {
  try {
    const raw = localStorage.getItem('paysecure_balances')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const setStoredBalance = (userId, newBalance) => {
  try {
    const balances = getStoredBalances()
    balances[userId] = Math.max(0, Number(newBalance) || 0)
    localStorage.setItem('paysecure_balances', JSON.stringify(balances))
  } catch {}
}

export const recordTransferBalances = (senderId, receiverId, amount) => {
  const sender = getUser(senderId)
  const receiver = getUser(receiverId)
  if (sender) setStoredBalance(sender.id, Math.max(0, sender.balance - amount))
  if (receiver) setStoredBalance(receiver.id, receiver.balance + amount)
}

export const getUser = (id) => {
  const base = DEMO_USERS.find((u) => u.id === Number(id))
  if (!base) return null
  const balances = getStoredBalances()
  const customBalance = balances[base.id]
  return {
    ...base,
    balance: typeof customBalance === 'number' ? customBalance : base.balance,
  }
}

export const getReceiverOptions = (senderId) =>
  DEMO_USERS.filter((u) => u.id !== Number(senderId))

export const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

export const formatDate = (value) => {
  if (!value) return 'Just now'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export const formatDateOnly = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

export const formatTimeOnly = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', { timeStyle: 'short' })
}

// ==================================================
// TRANSACTION DEMONSTRATION SCENARIOS
//
// Each scenario builds a realistic feature profile that is
// sent to the EXISTING FraudGuard AI risk-analysis pipeline
// (POST /api/transactions/analyze). The frontend never invents
// a risk result — the backend model, rule engine and anomaly
// detector remain the sole source of truth for the outcome.
// ==================================================

export const SCENARIOS = [
  {
    id: 'normal',
    label: 'Normal Transaction',
    description: 'Everyday spending that matches usual account behavior.',
    suggestedAmount: 500,
    features: () => ({
      avg_user_amount: 2000,
      transactions_last_10min: 1,
      new_device: 0,
      new_location: 0,
      international: 0,
      merchant_risk: 2,
      account_age_days: 1200,
      device_age_days: 300,
      distance_from_home: 5,
      failed_attempts_10min: 0,
      unusual_hour: 0,
    }),
  },
  {
    id: 'large_amount',
    label: 'Large Amount',
    description: 'A transfer far above the account\u2019s typical spending pattern.',
    suggestedAmount: 250000,
    features: () => ({
      avg_user_amount: 2000,
      transactions_last_10min: 1,
      new_device: 0,
      new_location: 0,
      international: 0,
      merchant_risk: 3,
      account_age_days: 1000,
      device_age_days: 260,
      distance_from_home: 8,
      failed_attempts_10min: 0,
      unusual_hour: 0,
    }),
  },
  {
    id: 'unusual_location',
    label: 'Unusual Location',
    description: 'Payment initiated from an unfamiliar, distant or international location.',
    suggestedAmount: 3000,
    features: () => ({
      avg_user_amount: 2000,
      transactions_last_10min: 1,
      new_device: 0,
      new_location: 1,
      international: 1,
      merchant_risk: 3,
      account_age_days: 900,
      device_age_days: 240,
      distance_from_home: 1350,
      failed_attempts_10min: 0,
      unusual_hour: 0,
    }),
  },
  {
    id: 'rapid_transaction',
    label: 'Rapid Transaction',
    description: 'Several transfers fired off in a very short time window.',
    suggestedAmount: 2200,
    features: () => ({
      avg_user_amount: 2000,
      transactions_last_10min: 6,
      new_device: 0,
      new_location: 0,
      international: 0,
      merchant_risk: 2,
      account_age_days: 900,
      device_age_days: 240,
      distance_from_home: 10,
      failed_attempts_10min: 0,
      unusual_hour: 0,
    }),
  },
  {
    id: 'suspicious_merchant',
    label: 'Suspicious Merchant',
    description: 'Payment routed to a merchant category flagged as high risk.',
    suggestedAmount: 4200,
    features: () => ({
      avg_user_amount: 2000,
      transactions_last_10min: 1,
      new_device: 0,
      new_location: 0,
      international: 0,
      merchant_risk: 9,
      account_age_days: 900,
      device_age_days: 240,
      distance_from_home: 12,
      failed_attempts_10min: 0,
      unusual_hour: 0,
    }),
  },
  {
    id: 'multiple_transactions',
    label: 'Multiple Transactions',
    description: 'High transaction velocity combined with recent failed attempts.',
    suggestedAmount: 3800,
    features: () => ({
      avg_user_amount: 2000,
      transactions_last_10min: 9,
      new_device: 1,
      new_location: 0,
      international: 0,
      merchant_risk: 4,
      account_age_days: 600,
      device_age_days: 120,
      distance_from_home: 18,
      failed_attempts_10min: 3,
      unusual_hour: 0,
    }),
  },
  {
    id: 'high_risk',
    label: 'High Risk Transaction',
    description: 'Every risk signal at once \u2014 new device, new location, odd hour.',
    suggestedAmount: 850000,
    features: () => ({
      avg_user_amount: 2000,
      transactions_last_10min: 8,
      new_device: 1,
      new_location: 1,
      international: 1,
      merchant_risk: 8,
      account_age_days: 90,
      device_age_days: 5,
      distance_from_home: 1800,
      failed_attempts_10min: 4,
      unusual_hour: 1,
    }),
  },
]

export const getScenario = (id) => SCENARIOS.find((s) => s.id === id) || SCENARIOS[0]
