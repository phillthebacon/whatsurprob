import { supabase } from './supabase.js'

export async function fetchProblems({ north, south, east, west }) {
  let q = supabase.from('problems').select('*')
    .gte('lat', south).lte('lat', north)
    .order('votes', { ascending: false }).limit(200)
  if (west < east) q = q.gte('lng', west).lte('lng', east)
  const { data } = await q
  return data || []
}

export async function fetchDots() {
  const { data } = await supabase.from('problems')
    .select('id,lat,lng,category,votes,needs').order('votes', { ascending: false }).limit(2000)
  return data || []
}

export async function submitProblem(p) {
  const { data } = await supabase.from('problems')
    .insert([{ description: p.desc, category: p.cat, lat: p.lat, lng: p.lng,
      country: p.country, votes: 1, needs: 0 }]).select()
  return data?.[0]
}

export async function vote(id, up) {
  const { data } = await supabase.from('problems').select('votes').eq('id', id).single()
  if (data) await supabase.from('problems').update({ votes: Math.max(0, data.votes + (up ? 1 : -1)) }).eq('id', id)
}

export async function flagNeed(id, add) {
  const { data } = await supabase.from('problems').select('needs').eq('id', id).single()
  if (data) await supabase.from('problems').update({ needs: Math.max(0, (data.needs||0) + (add ? 1 : -1)) }).eq('id', id)
}
