import { useCallback, useState } from 'react'

export function useCopyToClipboard(resetMs = 2_000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), resetMs)
        return true
      } catch {
        return false
      }
    },
    [resetMs],
  )

  return { copied, copy }
}
