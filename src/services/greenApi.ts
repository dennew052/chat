import { GreenApiCredentials, InstanceState, WebhookNotification } from '../types'

export class GreenApiService {
  /**
   * Cleans base API URL removing trailing slashes
   */
  private static cleanUrl(url?: string): string {
    const raw = (url || 'https://api.green-api.com').trim()
    return raw.replace(/\/+$/, '')
  }

  /**
   * Helper for standard fetch with error handling
   */
  private static async request<T>(
    credentials: GreenApiCredentials,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { idInstance, apiTokenInstance, apiUrl } = credentials
    const baseUrl = this.cleanUrl(apiUrl)
    const url = `${baseUrl}/waInstance${idInstance.trim()}/${endpoint.replace(/^\/+/, '')}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        let errorDetail = ''
        try {
          const errorJson = await response.json()
          errorDetail = errorJson.message || JSON.stringify(errorJson)
        } catch {
          errorDetail = await response.text()
        }
        throw new Error(`API Error (${response.status}): ${errorDetail || response.statusText}`)
      }

      // Some endpoints might return empty body on 200/204 or null
      const text = await response.text()
      if (!text || text.trim() === 'null') {
        return null as unknown as T
      }

      return JSON.parse(text) as T
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Сетевая ошибка или блокировка CORS. Проверьте правильность URL сервера API.')
      }
      throw err
    }
  }

  /**
   * Check state of the instance (authorization status)
   * GET /waInstance{{idInstance}}/getStateInstance/{{apiTokenInstance}}
   */
  static async getStateInstance(credentials: GreenApiCredentials): Promise<{ stateInstance: InstanceState }> {
    return this.request<{ stateInstance: InstanceState }>(
      credentials,
      `getStateInstance/${credentials.apiTokenInstance.trim()}`
    )
  }

  /**
   * Check if recipient exists and obtain chatId
   * POST /waInstance{{idInstance}}/checkAccount/{{apiTokenInstance}}
   */
  static async checkAccount(
    credentials: GreenApiCredentials,
    phoneNumber: string
  ): Promise<{ exist: boolean; chatId?: string }> {
    // Keep only digits
    const cleaned = phoneNumber.replace(/\D/g, '')
    const num = parseInt(cleaned, 10)

    if (isNaN(num)) {
      throw new Error('Некорректный номер телефона')
    }

    return this.request<{ exist: boolean; chatId?: string }>(
      credentials,
      `checkAccount/${credentials.apiTokenInstance.trim()}`,
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: num })
      }
    )
  }

  /**
   * Send a text message to recipient
   * POST /waInstance{{idInstance}}/sendMessage/{{apiTokenInstance}}
   * Requirements: https://green-api.com/v3/docs/api/sending/SendMessage/
   */
  static async sendMessage(
    credentials: GreenApiCredentials,
    chatId: string,
    message: string
  ): Promise<{ idMessage: string }> {
    if (!message || !message.trim()) {
      throw new Error('Сообщение не может быть пустым')
    }

    let formattedChatId = chatId.trim()
    // If user provided a raw phone number without suffix or id format
    if (!formattedChatId.includes('@') && !formattedChatId.startsWith('-')) {
      // In WhatsApp it uses @c.us, but in MAX it can be numeric chatId or digits@c.us
      // If it looks like a standard phone number (10-15 digits), we can append @c.us if standard,
      // or keep as-is if already a valid MAX chatId
    }

    return this.request<{ idMessage: string }>(
      credentials,
      `sendMessage/${credentials.apiTokenInstance.trim()}`,
      {
        method: 'POST',
        body: JSON.stringify({
          chatId: formattedChatId,
          message: message.trim()
        })
      }
    )
  }

  /**
   * Receive next incoming notification from the queue (HTTP API technology)
   * GET /waInstance{{idInstance}}/receiveNotification/{{apiTokenInstance}}?receiveTimeout=5
   * Requirements: https://green-api.com/v3/docs/api/receiving/technology-http-api/
   */
  static async receiveNotification(
    credentials: GreenApiCredentials,
    timeoutSeconds: number = 5
  ): Promise<WebhookNotification | null> {
    const endpoint = `receiveNotification/${credentials.apiTokenInstance.trim()}?receiveTimeout=${Math.max(5, Math.min(60, timeoutSeconds))}`
    return this.request<WebhookNotification | null>(credentials, endpoint, {
      method: 'GET'
    })
  }

  /**
   * Delete processed notification from queue
   * DELETE /waInstance{{idInstance}}/deleteNotification/{{apiTokenInstance}}/{{receiptId}}
   */
  static async deleteNotification(
    credentials: GreenApiCredentials,
    receiptId: number
  ): Promise<{ result: boolean }> {
    const endpoint = `deleteNotification/${credentials.apiTokenInstance.trim()}/${receiptId}`
    return this.request<{ result: boolean }>(credentials, endpoint, {
      method: 'DELETE'
    })
  }
}
