import { useState } from 'react'
import { downloadArtifact, type Artifact } from './artifacts'

export function ArtifactDownloads({ artifacts, caseId }: { artifacts: Artifact[]; caseId: number }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  async function download(artifact: Artifact) {
    setError('')
    setPending(artifact.id)
    try { await downloadArtifact(artifact, caseId) }
    catch { setError('Nie udało się przygotować pliku. Spróbuj jeszcze raz.') }
    finally { setPending(null) }
  }
  if (!artifacts.length) return null
  return <><div className="artifact-list">{artifacts.map(artifact => <button type="button" className="artifact-download" key={artifact.id} disabled={pending !== null} aria-busy={pending === artifact.id} onClick={() => void download(artifact)}><span aria-hidden="true">↓</span><span>{artifact.title}<small>PDF · przykład</small></span></button>)}</div>{error && <p className="artifact-error" role="alert">{error}</p>}</>
}
