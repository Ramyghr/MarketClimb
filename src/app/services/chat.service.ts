import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface ChatResponse {
  conversation_id: number;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://127.0.0.1:8000/api/chat';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Send a message to the AI
   */
  sendMessage(message: string, conversationId?: number): Observable<ChatResponse> {
    const formData = new FormData();
    formData.append('message', message);
    if (conversationId) {
      formData.append('conversation_id', conversationId.toString());
    }

    return this.http.post<ChatResponse>(
      `${this.apiUrl}/message`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all conversations for the current user
   */
  getConversations(skip: number = 0, limit: number = 20): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      `${this.apiUrl}/conversations?skip=${skip}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get a specific conversation with all messages
   */
  getConversation(conversationId: number): Observable<ConversationWithMessages> {
    return this.http.get<ConversationWithMessages>(
      `${this.apiUrl}/conversations/${conversationId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Create a new conversation
   */
  createConversation(title: string = 'New Conversation'): Observable<Conversation> {
    const formData = new FormData();
    formData.append('title', title);

    return this.http.post<Conversation>(
      `${this.apiUrl}/conversations`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/conversations/${conversationId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update conversation title
   */
  updateConversationTitle(conversationId: number, title: string): Observable<any> {
    const formData = new FormData();
    formData.append('title', title);

    return this.http.patch(
      `${this.apiUrl}/conversations/${conversationId}/title`,
      formData,
      { headers: this.getHeaders() }
    );
  }
}