export interface GreenApiCredentials {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export type InstanceState = 
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'sleepMode'
  | 'starting'
  | 'unknown'

export interface Message {
  idMessage: string
  chatId: string
  text: string
  timestamp: number // unix epoch ms
  type: 'incoming' | 'outgoing'
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error'
  senderName?: string
  errorMessage?: string
}

export interface Chat {
  id: string // chatId e.g. "1000000" or "79001234567@c.us"
  name: string
  phoneNumber: string
  lastMessage?: Message
  unreadCount: number
  updatedAt: number // epoch ms
}

export interface WebhookNotification {
  receiptId: number
  body: {
    typeWebhook: string
    instanceData?: {
      idInstance: number
      wid?: string
      typeInstance?: string
    }
    timestamp?: number
    idMessage?: string
    senderData?: {
      chatId?: string
      sender?: string
      senderName?: string
      senderContactName?: string
    }
    messageData?: {
      typeMessage?: string
      textMessageData?: {
        textMessage?: string
      }
      extendedTextMessageData?: {
        text?: string
        description?: string
        title?: string
      }
    }
  }
}
