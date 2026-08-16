function validDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function assignmentWindowState(test, now = new Date()) {
  const opensAt = validDate(test.available_from)
  if (opensAt && now < opensAt) {
    return {
      blocked: true,
      label: `Opens ${opensAt.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })}`,
    }
  }

  const deadlines = [validDate(test.due_at), validDate(test.available_until)].filter(Boolean)
  const closesAt = deadlines.length
    ? new Date(Math.min(...deadlines.map((date) => date.getTime())))
    : null

  if (closesAt && now >= closesAt) {
    return { blocked: true, label: 'Deadline passed' }
  }

  return { blocked: false, label: null }
}
