export const consumeJsonEventStream = async (response, handlers = {}) => {
  const {
    onMessage,
    onDone,
    onFinish,
    onParseError
  } = handlers

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = 'message'

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const rawLine of lines) {
      const line = rawLine.trim()

      if (line === '') {
        currentEvent = 'message'
        continue
      }

      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim()
        continue
      }

      if (!line.startsWith('data:')) {
        continue
      }

      const dataStr = line.slice(5).trim()

      if (dataStr === '[DONE]') {
        onDone?.()
        continue
      }

      if (currentEvent !== 'message') {
        continue
      }

      try {
        const parsedData = JSON.parse(dataStr)
        onMessage?.(parsedData)

        if (parsedData.is_finish === true) {
          onFinish?.(parsedData)
        }
      } catch (error) {
        onParseError?.(dataStr, error)
      }
    }
  }
}
