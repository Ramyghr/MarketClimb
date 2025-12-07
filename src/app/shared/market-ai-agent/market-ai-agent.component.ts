import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService, ChatMessage, Conversation } from '../../services/chat.service';

interface DisplayMessage {
  from: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

@Component({
  selector: 'app-market-ai-agent',
  templateUrl: './market-ai-agent.component.html',
  styleUrls: ['./market-ai-agent.component.css']
})
export class MarketAiAgentComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatBody') private chatBody!: ElementRef;

  // UI State
  isOpen = false;
  showConversations = false;
  userInput = '';
  messages: DisplayMessage[] = [];
  isLoading = false;
  
  // Conversations
  conversations: Conversation[] = [];
  currentConversationId: number | null = null;
  loadingConversations = false;

  private shouldScrollToBottom = false;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loadConversations();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.startNewConversation();
    }
  }

  toggleConversations() {
    this.showConversations = !this.showConversations;
    if (this.showConversations) {
      this.loadConversations();
    }
  }

  /**
   * Load all conversations
   */
  loadConversations() {
    this.loadingConversations = true;
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.loadingConversations = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loadingConversations = false;
      }
    });
  }

  /**
   * Start a new conversation
   */
  startNewConversation() {
    this.currentConversationId = null;
    this.messages = [
      { 
        from: 'bot', 
        text: "👋 Hi! I'm your Market Climb AI Assistant. How can I help you today?",
        timestamp: new Date().toISOString()
      }
    ];
    this.showConversations = false;
    this.shouldScrollToBottom = true;
  }

  /**
   * Load an existing conversation
   */
  loadConversation(conversationId: number) {
    this.isLoading = true;
    this.chatService.getConversation(conversationId).subscribe({
      next: (conversation) => {
        this.currentConversationId = conversationId;
        this.messages = conversation.messages.map(msg => ({
          from: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
          timestamp: msg.created_at
        }));
        this.showConversations = false;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error loading conversation:', error);
        this.isLoading = false;
        alert('Failed to load conversation. Please try again.');
      }
    });
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: number, event: Event) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.chatService.deleteConversation(conversationId).subscribe({
        next: () => {
          // Remove from list
          this.conversations = this.conversations.filter(c => c.id !== conversationId);
          
          // If it was the current conversation, start a new one
          if (this.currentConversationId === conversationId) {
            this.startNewConversation();
          }
        },
        error: (error) => {
          console.error('Error deleting conversation:', error);
          alert('Failed to delete conversation. Please try again.');
        }
      });
    }
  }

  /**
   * Send a message
   */
  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage = this.userInput.trim();
    
    // Add user message to display
    this.messages.push({ 
      from: 'user', 
      text: userMessage,
      timestamp: new Date().toISOString()
    });
    
    this.userInput = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    // Send to backend
    this.chatService.sendMessage(userMessage, this.currentConversationId || undefined).subscribe({
      next: (response) => {
        // Update current conversation ID if it's a new conversation
        if (!this.currentConversationId) {
          this.currentConversationId = response.conversation_id;
        }

        // Add bot response
        this.messages.push({ 
          from: 'bot', 
          text: response.assistant_message.content,
          timestamp: response.assistant_message.created_at
        });

        this.isLoading = false;
        this.shouldScrollToBottom = true;

        // Refresh conversations list
        this.loadConversations();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        
        // Show error message
        this.messages.push({ 
          from: 'bot', 
          text: '❌ Sorry, I encountered an error. Please try again or start a new conversation.',
          timestamp: new Date().toISOString()
        });
        
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      }
    });
  }

  /**
   * Scroll chat to bottom
   */
  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get conversation preview (first message)
   */
  getConversationPreview(conversation: Conversation): string {
    const preview = conversation.title;
    return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
  }
}