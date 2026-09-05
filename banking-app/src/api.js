// import axios from 'axios'

// export const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 30000,
//   headers: { 'Content-Type': 'application/json' },
// })

// export async function analyzePayment(payload) {
//   const amount = Number(payload.amount) || 0
//   const avgUserAmount = Number(payload.avg_user_amount) || 2000.0
//   const amountRatio =
//     avgUserAmount > 0
//       ? Number((amount / avgUserAmount).toFixed(2))
//       : 1.0
//   const senderId = Number(payload.sender_user_id || payload.user_id || 1001)

//   // Map banking app fields directly to the existing backend TransactionRequest schema
//   const transactionRequest = {
//     transaction_id:
//       payload.transaction_id ||
//       `TXN-BANK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
//     user_id: senderId,
//     amount: amount,
//     avg_user_amount: avgUserAmount,
//     amount_ratio: amountRatio,
//     transactions_last_10min: Number(payload.transactions_last_10min) || 1,
//     new_device: payload.new_device ? 1 : 0,
//     new_location: payload.new_location ? 1 : 0,
//     international: payload.international ? 1 : 0,
//     merchant_risk: Number(payload.merchant_risk) || 2,
//     account_age_days: Number(payload.account_age_days) || 365,
//     device_age_days: Number(payload.device_age_days) || 180,
//     distance_from_home: Number(payload.distance_from_home) || 5.0,
//     failed_attempts_10min: Number(payload.failed_attempts_10min) || 0,
//     hour:
//       typeof payload.hour === 'number'
//         ? payload.hour
//         : new Date().getHours(),
//     day_of_week:
//       typeof payload.day_of_week === 'number'
//         ? payload.day_of_week
//         : new Date().getDay(),
//     is_weekend:
//       typeof payload.is_weekend === 'number'
//         ? payload.is_weekend
//         : new Date().getDay() >= 5
//         ? 1
//         : 0,
//     unusual_hour: payload.unusual_hour ? 1 : 0,
//   }

//   // Call the existing FastAPI fraud analysis endpoint
//   const { data } = await api.post(
//     '/api/transactions/analyze',
//     transactionRequest
//   )

//   const enriched = {
//     ...data,
//     sender_user_id: payload.sender_user_id,
//     sender_name: payload.sender_name,
//     sender_account: payload.sender_account,
//     receiver_user_id: payload.receiver_user_id,
//     receiver_name: payload.receiver_name,
//     receiver_account: payload.receiver_account,
//   }

//   // Cache in local storage for instant, lag-free display
//   try {
//     const cached = JSON.parse(
//       localStorage.getItem('paysecure_local_tx') || '[]'
//     )
//     cached.unshift(enriched)
//     localStorage.setItem(
//       'paysecure_local_tx',
//       JSON.stringify(cached.slice(0, 50))
//     )
//   } catch {}

//   return enriched
// }

// export async function getUserTransactions(userId, role = 'sender') {
//   const localTx = (() => {
//     try {
//       return JSON.parse(localStorage.getItem('paysecure_local_tx') || '[]')
//     } catch {
//       return []
//     }
//   })()

//   try {
//     const { data } = await api.get('/api/transactions', {
//       params: { limit: 100 },
//     })
//     const remoteList = Array.isArray(data) ? data : data?.transactions || []

//     // Merge remote backend transactions with local session transactions
//     const seen = new Set()
//     const merged = []

//     for (const tx of [...localTx, ...remoteList]) {
//       const id = tx.transaction_id || tx.id
//       if (id && !seen.has(id)) {
//         seen.add(id)
//         merged.push(tx)
//       }
//     }

//     const userNum = Number(userId)
//     const userFiltered = merged.filter((t) => {
//       const txUser = Number(t.user_id || t.sender_user_id)
//       const rxUser = Number(t.receiver_user_id)
//       if (role === 'receiver') {
//         return rxUser === userNum || (txUser !== userNum && t.receiver_name)
//       }
//       return txUser === userNum || !t.receiver_user_id
//     })

//     return userFiltered.length ? userFiltered : merged.slice(0, 10)
//   } catch (err) {
//     console.warn('Backend transactions fetch error:', err)
//     return localTx
//   }
// }

// export default api


import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export async function analyzePayment(payload) {
  const amount = Number(payload.amount) || 0
  const avgUserAmount = Number(payload.avg_user_amount) || 2000.0
  const amountRatio =
    avgUserAmount > 0
      ? Number((amount / avgUserAmount).toFixed(2))
      : 1.0
  const senderId = Number(payload.sender_user_id || payload.user_id || 1001)

  // Map banking app fields directly to the existing backend TransactionRequest schema
  const transactionRequest = {
    transaction_id:
      payload.transaction_id ||
      `TXN-BANK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    user_id: senderId,
    amount: amount,
    avg_user_amount: avgUserAmount,
    amount_ratio: amountRatio,
    transactions_last_10min: Number(payload.transactions_last_10min) || 1,
    new_device: payload.new_device ? 1 : 0,
    new_location: payload.new_location ? 1 : 0,
    international: payload.international ? 1 : 0,
    merchant_risk: Number(payload.merchant_risk) || 2,
    account_age_days: Number(payload.account_age_days) || 365,
    device_age_days: Number(payload.device_age_days) || 180,
    distance_from_home: Number(payload.distance_from_home) || 5.0,
    failed_attempts_10min: Number(payload.failed_attempts_10min) || 0,
    hour:
      typeof payload.hour === 'number'
        ? payload.hour
        : new Date().getHours(),
    day_of_week:
      typeof payload.day_of_week === 'number'
        ? payload.day_of_week
        : new Date().getDay(),
    is_weekend:
      typeof payload.is_weekend === 'number'
        ? payload.is_weekend
        : new Date().getDay() >= 5
        ? 1
        : 0,
    unusual_hour: payload.unusual_hour ? 1 : 0,
  }

  // Call the existing FastAPI fraud analysis endpoint
  const { data } = await api.post(
    '/api/transactions/analyze',
    transactionRequest
  )

  const enriched = {
    ...data,
    sender_user_id: payload.sender_user_id,
    sender_name: payload.sender_name,
    sender_account: payload.sender_account,
    receiver_user_id: payload.receiver_user_id,
    receiver_name: payload.receiver_name,
    receiver_account: payload.receiver_account,
  }

  // Cache in local storage for instant, lag-free display
  try {
    const cached = JSON.parse(
      localStorage.getItem('paysecure_local_tx') || '[]'
    )
    cached.unshift(enriched)
    localStorage.setItem(
      'paysecure_local_tx',
      JSON.stringify(cached.slice(0, 50))
    )
  } catch {}

  return enriched
}

export async function getUserTransactions(userId, role = 'sender') {
  const localTx = (() => {
    try {
      return JSON.parse(localStorage.getItem('paysecure_local_tx') || '[]')
    } catch {
      return []
    }
  })()

  try {
    const { data } = await api.get('/api/transactions', {
      params: { limit: 100 },
    })
    const remoteList = Array.isArray(data) ? data : data?.transactions || []

    // Merge remote backend transactions with local session transactions
    const seen = new Set()
    const merged = []

    for (const tx of [...localTx, ...remoteList]) {
      const id = tx.transaction_id || tx.id
      if (id && !seen.has(id)) {
        seen.add(id)
        merged.push(tx)
      }
    }

    const userNum = Number(userId)
    const userFiltered = merged.filter((t) => {
      const txUser = Number(t.user_id || t.sender_user_id)
      const rxUser = Number(t.receiver_user_id)
      if (role === 'receiver') {
        return rxUser === userNum || (txUser !== userNum && t.receiver_name)
      }
      return txUser === userNum || !t.receiver_user_id
    })

    return userFiltered.length ? userFiltered : merged.slice(0, 10)
  } catch (err) {
    console.warn('Backend transactions fetch error:', err)
    return localTx
  }
}

export default api
