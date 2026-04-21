import { supabase } from './supabase.js'

// ============================================================
// Session management — anonymous UUID stored in localStorage
// One session per browser. Not tied to identity, just dedup.
// ============================================================
const SESSION_KEY = 'wup-session-id'

function generateSessionId() {
  // Simple UUID v4-ish — good enough, no crypto required
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = generateSessionId()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return generateSessionId()
  }
}

// ============================================================
// Fetching
// ============================================================
export async function fetchProblems({ north, south, east, west }) {
  let q = supabase.from('problems').select('*')
    .gte('lat', south).lte('lat', north)
    .order('votes', { ascending: false }).limit(200)
  if (west < east) q = q.gte('lng', west).lte('lng', east)
  const { data, error } = await q
  if (error) { console.error('fetchProblems:', error); return [] }
  return data || []
}

export async function fetchDots() {
  const { data, error } = await supabase.from('problems')
    .select('id,lat,lng,category,votes,needs,description,country,subdivision,city,granularity,created_at')
    .order('votes', { ascending: false })
    .limit(2000)
  if (error) { console.error('fetchDots:', error); return [] }
  return data || []
}

// Fetch this session's existing votes so UI can highlight them on load
export async function fetchMyVotes() {
  const sessionId = getSessionId()
  const { data, error } = await supabase.rpc('get_session_votes', {
    p_session_id: sessionId
  })
  if (error) { console.error('fetchMyVotes:', error); return { votes:{}, needs:{} } }
  const votes = {}
  const needs = {}
  ;(data || []).forEach(r => {
    if (r.vote_type === 'vote') votes[r.problem_id] = true
    if (r.vote_type === 'need') needs[r.problem_id] = true
  })
  return { votes, needs }
}

// ============================================================
// Submitting
// ============================================================
export async function submitProblem(p) {
  const row = {
    description: p.desc,
    category: p.cat,
    lat: p.lat,
    lng: p.lng,
    country: p.country || 'Unknown',
    subdivision: p.subdivision || null,
    city: p.city || null,
    granularity: p.granularity || 'country',
    votes: 1,
    needs: 0
  }
  const { data, error } = await supabase.from('problems').insert([row]).select()
  if (error) { console.error('submitProblem:', error); return null }

  // Auto-log the poster's own +1 so they can't vote again on their own post
  if (data?.[0]) {
    const sessionId = getSessionId()
    await supabase.from('votes_log').insert([{
      session_id: sessionId,
      problem_id: data[0].id,
      vote_type: 'vote'
    }])
  }
  return data?.[0]
}

// ============================================================
// Voting (atomic, deduped)
// Returns true if applied, false if duplicate / no-op
// ============================================================
export async function castVote(problemId, add) {
  const sessionId = getSessionId()
  const { data, error } = await supabase.rpc('cast_vote', {
    p_session_id: sessionId,
    p_problem_id: problemId,
    p_vote_type: 'vote',
    p_add: add
  })
  if (error) { console.error('castVote:', error); return false }
  return data === true
}

export async function castNeed(problemId, add) {
  const sessionId = getSessionId()
  const { data, error } = await supabase.rpc('cast_vote', {
    p_session_id: sessionId,
    p_problem_id: problemId,
    p_vote_type: 'need',
    p_add: add
  })
  if (error) { console.error('castNeed:', error); return false }
  return data === true
}
