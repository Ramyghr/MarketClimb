import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';

export interface User {
  id: string;
  username: string;
  avatar: string;
  rank: number;
  profit: number;
  profitPercent: number;
  trades: number;
  winRate: number;
  followers: number;
  verified: boolean;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  type: 'text' | 'trade' | 'analysis';
  tradeData?: {
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    profit?: number;
  };
  image?: string;
}

export interface ForumThread {
  id: string;
  title: string;
  author: User;
  category: string;
  replies: number;
  views: number;
  lastActivity: Date;
  isPinned: boolean;
  isHot: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  prize: string;
  participants: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
}

@Injectable({
  providedIn: 'root'
})
export class CommunityService {

  // Sample users data
  private users: User[] = [
    {
      id: '1',
      username: 'CryptoKing',
      avatar: 'https://i.pravatar.cc/150?img=12',
      rank: 1,
      profit: 125000,
      profitPercent: 245.5,
      trades: 1250,
      winRate: 78.5,
      followers: 15420,
      verified: true
    },
    {
      id: '2',
      username: 'TraderJoe',
      avatar: 'https://i.pravatar.cc/150?img=33',
      rank: 2,
      profit: 98500,
      profitPercent: 198.3,
      trades: 980,
      winRate: 72.1,
      followers: 12350,
      verified: true
    },
    {
      id: '3',
      username: 'BullMarket',
      avatar: 'https://i.pravatar.cc/150?img=25',
      rank: 3,
      profit: 87200,
      profitPercent: 174.8,
      trades: 850,
      winRate: 69.4,
      followers: 9840,
      verified: false
    },
    {
      id: '4',
      username: 'StockGuru',
      avatar: 'https://i.pravatar.cc/150?img=45',
      rank: 4,
      profit: 76300,
      profitPercent: 152.6,
      trades: 720,
      winRate: 67.2,
      followers: 8200,
      verified: true
    },
    {
      id: '5',
      username: 'ForexPro',
      avatar: 'https://i.pravatar.cc/150?img=56',
      rank: 5,
      profit: 65400,
      profitPercent: 130.8,
      trades: 650,
      winRate: 64.5,
      followers: 7100,
      verified: false
    }
  ];

  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();

  private leaderboardSubject = new BehaviorSubject<User[]>(this.users);
  public leaderboard$ = this.leaderboardSubject.asObservable();

  private threadsSubject = new BehaviorSubject<ForumThread[]>([]);
  public threads$ = this.threadsSubject.asObservable();

  private challengesSubject = new BehaviorSubject<Challenge[]>([]);
  public challenges$ = this.challengesSubject.asObservable();

  constructor() {
    this.generateInitialPosts();
    this.generateForumThreads();
    this.generateChallenges();
    this.simulateLiveActivity();
  }

  private generateInitialPosts(): void {
    const posts: Post[] = [
      {
        id: '1',
        user: this.users[0],
        content: 'Just made a 15% profit on $TSLA! The technical indicators were screaming BUY. Always trust your analysis! 🚀📈',
        timestamp: new Date(Date.now() - 5 * 60000),
        likes: 245,
        comments: 38,
        shares: 12,
        isLiked: false,
        type: 'trade',
        tradeData: {
          symbol: 'TSLA',
          side: 'buy',
          price: 245.50,
          profit: 3675
        }
      },
      {
        id: '2',
        user: this.users[1],
        content: 'Market analysis: I think we\'re seeing a bullish reversal pattern forming on BTC. RSI is oversold and volume is picking up. What do you all think?',
        timestamp: new Date(Date.now() - 15 * 60000),
        likes: 189,
        comments: 52,
        shares: 8,
        isLiked: true,
        type: 'analysis'
      },
      {
        id: '3',
        user: this.users[2],
        content: 'Remember: The market can stay irrational longer than you can stay solvent. Risk management is everything! 💯',
        timestamp: new Date(Date.now() - 30 * 60000),
        likes: 421,
        comments: 67,
        shares: 34,
        isLiked: false,
        type: 'text'
      },
      {
        id: '4',
        user: this.users[3],
        content: 'Short position on $AAPL looking great! Took profit at resistance. Sometimes patience pays off. 📊',
        timestamp: new Date(Date.now() - 45 * 60000),
        likes: 156,
        comments: 29,
        shares: 6,
        isLiked: false,
        type: 'trade',
        tradeData: {
          symbol: 'AAPL',
          side: 'sell',
          price: 178.30,
          profit: 2240
        }
      }
    ];
    this.postsSubject.next(posts);
  }

  private generateForumThreads(): void {
    const threads: ForumThread[] = [
      {
        id: '1',
        title: 'Best strategies for volatile markets?',
        author: this.users[0],
        category: 'Strategies',
        replies: 45,
        views: 1203,
        lastActivity: new Date(Date.now() - 10 * 60000),
        isPinned: true,
        isHot: true
      },
      {
        id: '2',
        title: 'Technical Analysis: Head and Shoulders pattern',
        author: this.users[1],
        category: 'Education',
        replies: 28,
        views: 856,
        lastActivity: new Date(Date.now() - 25 * 60000),
        isPinned: false,
        isHot: true
      },
      {
        id: '3',
        title: 'Which broker do you recommend for beginners?',
        author: this.users[2],
        category: 'General',
        replies: 67,
        views: 2104,
        lastActivity: new Date(Date.now() - 60 * 60000),
        isPinned: false,
        isHot: false
      }
    ];
    this.threadsSubject.next(threads);
  }

  private generateChallenges(): void {
    const challenges: Challenge[] = [
      {
        id: '1',
        title: 'Weekly Trading Challenge',
        description: 'Highest profit percentage wins $500!',
        prize: '$500 + Premium Badge',
        participants: 342,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60000),
        status: 'active'
      },
      {
        id: '2',
        title: 'Crypto Master Challenge',
        description: 'Trade only crypto pairs for maximum returns',
        prize: '$1000 + Trophy',
        participants: 567,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60000),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60000),
        status: 'upcoming'
      }
    ];
    this.challengesSubject.next(challenges);
  }

  private simulateLiveActivity(): void {
    // Add new post every 30 seconds
    interval(30000).subscribe(() => {
      this.addRandomPost();
    });

    // Update leaderboard every 10 seconds
    interval(10000).subscribe(() => {
      this.updateLeaderboard();
    });
  }

  private addRandomPost(): void {
    const randomUser = this.users[Math.floor(Math.random() * this.users.length)];
    const contents = [
      'Great day in the markets! Up 8% on my portfolio 📈',
      'Anyone else watching the Fed announcement tomorrow?',
      'Just closed a profitable swing trade. Patience is key!',
      'Market looking bullish, time to add more positions?',
      'Stop loss saved me today. Never trade without one!'
    ];

    const newPost: Post = {
      id: Date.now().toString(),
      user: randomUser,
      content: contents[Math.floor(Math.random() * contents.length)],
      timestamp: new Date(),
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 5),
      isLiked: false,
      type: 'text'
    };

    const currentPosts = this.postsSubject.value;
    this.postsSubject.next([newPost, ...currentPosts].slice(0, 20));
  }

  private updateLeaderboard(): void {
    const updatedUsers = this.users.map(user => ({
      ...user,
      profit: user.profit + (Math.random() - 0.5) * 1000,
      profitPercent: user.profitPercent + (Math.random() - 0.5) * 2
    }));

    // Re-sort by profit
    updatedUsers.sort((a, b) => b.profit - a.profit);
    updatedUsers.forEach((user, index) => user.rank = index + 1);

    this.leaderboardSubject.next(updatedUsers);
  }

  // Actions
  likePost(postId: string): void {
    const posts = this.postsSubject.value.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    });
    this.postsSubject.next(posts);
  }

  createPost(content: string): void {
    const newPost: Post = {
      id: Date.now().toString(),
      user: {
        id: 'current-user',
        username: 'You',
        avatar: 'https://i.pravatar.cc/150?img=68',
        rank: 15,
        profit: 25000,
        profitPercent: 50.0,
        trades: 250,
        winRate: 65.0,
        followers: 120,
        verified: false
      },
      content,
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      type: 'text'
    };

    const currentPosts = this.postsSubject.value;
    this.postsSubject.next([newPost, ...currentPosts]);
  }
}