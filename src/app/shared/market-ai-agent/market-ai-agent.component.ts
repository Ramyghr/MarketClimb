import { Component } from '@angular/core';

@Component({
  selector: 'app-market-ai-agent',
  templateUrl: './market-ai-agent.component.html',
  styleUrls: ['./market-ai-agent.component.css']
})
export class MarketAiAgentComponent {
  isOpen = false;
  userInput = '';
  messages = [
    { from: 'bot', text: '👋 Hi! I’m your Market Climb AI Assistant. How can I help you today?' }
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;
    const userMsg = { from: 'user', text: this.userInput };
    this.messages.push(userMsg);

    // TODO: Replace this with actual AI backend call
    setTimeout(() => {
      this.messages.push({ from: 'bot', text: '🤖 Thinking... (AI response goes here)' });
    }, 500);

    this.userInput = '';
  }
}
