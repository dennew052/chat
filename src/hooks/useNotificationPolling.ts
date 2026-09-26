import { useEffect, useRef, useState } from 'react'
import { GreenApiCredentials, Message } from '../types'
import { GreenApiService } from '../services/greenApi'
import { playNotificationSound } from '../utils/sound'

export type PollingStatus = 'idle' | 'listening' | 'receiving' | 'error'

interface UseNotificationPollingProps {
  credentials: GreenApiCredentials | null
  isEnabled: boolean
  onMessageReceived: (message: Message) => void
}

export function useNotificationPolling({
  credentials,
  isEnabled,
  onMessageReceived
}: UseNotificationPollingProps) {
  const [status, setStatus] = useState<PollingStatus>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const isRunningRef = useRef(false)
  const onMessageReceivedRef = useRef(onMessageReceived)

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived
  }, [onMessageReceived])

  useEffect(() => {
    if (!isEnabled || !credentials || !credentials.idInstance || !credentials.apiTokenInstance) {
      setStatus('idle')
      isRunningRef.current = false
      return
    }

    let isMounted = true
    isRunningRef.current = true

    const pollLoop = async () => {
      while (isMounted && isRunningRef.current) {
        try {
          setStatus('listening')
          setLastError(null)

          // 1. Receive notification from queue with 5 second timeout
          const notification = await GreenApiService.receiveNotification(credentials, 5)

          if (!isMounted || !isRunningRef.current) break

          if (notification && notification.receiptId) {
            setStatus('receiving')
            const { receiptId, body } = notification

            // Check if notification contains a message
            if (
              body?.typeWebhook === 'incomingMessageReceived' ||
              body?.typeWebhook === 'outgoingMessageReceived' ||
              body?.typeWebhook === 'outgoingAPIMessageReceived'
            ) {
              const isIncoming = body.typeWebhook === 'incomingMessageReceived'
              const text =
                body.messageData?.textMessageData?.textMessage ||
                body.messageData?.extendedTextMessageData?.text ||
                ''

              const chatId =
                body.senderData?.chatId ||
                body.senderData?.sender ||
                ''

              const senderName =
                body.senderData?.senderContactName ||
                body.senderData?.senderName ||
                undefined

              const timestamp = body.timestamp
                ? body.timestamp * 1000
                : Date.now()

              const idMessage =
                body.idMessage ||
                `notif_${receiptId}_${Date.now()}`

              if (text && chatId) {
                const messageObj: Message = {
                  idMessage,
                  chatId,
                  text,
                  timestamp,
                  type: isIncoming ? 'incoming' : 'outgoing',
                  status: isIncoming ? undefined : 'sent',
                  senderName
                }

                onMessageReceivedRef.current(messageObj)

                if (isIncoming) {
                  playNotificationSound()
                }
              }
            }

            // 2. Always delete the notification from queue after processing
            try {
              await GreenApiService.deleteNotification(credentials, receiptId)
            } catch (delErr: any) {
              console.warn('Failed to delete notification:', delErr)
            }
          }

          // If no notification (null response), loop continues immediately
        } catch (err: any) {
          if (!isMounted || !isRunningRef.current) break

          console.error('Polling error:', err)
          setStatus('error')
          setLastError(err.message || 'Ошибка получения уведомлений')

          // Back off for 2.5s before retrying to prevent rapid error loops
          await new Promise((resolve) => setTimeout(resolve, 2500))
        }
      }
    }

    pollLoop()

    return () => {
      isMounted = false
      isRunningRef.current = false
    }
  }, [isEnabled, credentials?.idInstance, credentials?.apiTokenInstance, credentials?.apiUrl])

  return { status, lastError }
}
