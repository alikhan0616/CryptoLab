import { useEffect, useState, type DependencyList } from 'react'

/** Run an async function whenever deps change; ignore results from outdated runs. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): { value?: T; error?: string; loading: boolean } {
  const [state, setState] = useState<{ value?: T; error?: string; loading: boolean }>({ loading: true })
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true }))
    fn().then(
      (value) => live && setState({ value, loading: false }),
      (e: unknown) => live && setState({ error: e instanceof Error ? e.message : String(e), loading: false }),
    )
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
