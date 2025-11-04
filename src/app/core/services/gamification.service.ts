import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'trading' | 'learning' | 'social' | 'milestone';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: Date;
  color: string;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakDates: Date[];
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  days: number;
  reward: number;
  claimed: boolean;
  icon: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
  icon: string;
  progress: number;
  maxProgress: number;
  reward: number;
  expiresAt: Date;
  completed: boolean;
  claimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  points: number;
  level: number;
  badge: string;
  change: number; // +5, -2, 0
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: 'cosmetic' | 'boost' | 'feature' | 'premium';
  icon: string;
  cost: number;
  available: boolean;
  owned: boolean;
}

export interface UserGamification {
  totalPoints: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  rank: number;
  achievements: Achievement[];
  streak: Streak;
  activeChallenges: Challenge[];
  rewards: Reward[];
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {

  private userGamificationSubject = new BehaviorSubject<UserGamification>({
    totalPoints: 12450,
    level: 24,
    currentXP: 1850,
    nextLevelXP: 2500,
    rank: 142,
    achievements: this.generateAchievements(),
    streak: {
      currentStreak: 12,
      longestStreak: 28,
      lastActivityDate: new Date(),
      streakDates: this.generateStreakDates(12),
      milestones: [
        { days: 7, reward: 500, claimed: true, icon: '🔥' },
        { days: 14, reward: 1000, claimed: false, icon: '⚡' },
        { days: 30, reward: 2500, claimed: false, icon: '💎' },
        { days: 60, reward: 5000, claimed: false, icon: '👑' },
        { days: 100, reward: 10000, claimed: false, icon: '🏆' }
      ]
    },
    activeChallenges: this.generateChallenges(),
    rewards: this.generateRewards()
  });
  public userGamification$ = this.userGamificationSubject.asObservable();

  private leaderboardSubject = new BehaviorSubject<LeaderboardEntry[]>(this.generateLeaderboard());
  public leaderboard$ = this.leaderboardSubject.asObservable();

  constructor() {}

  // Achievements Methods
  unlockAchievement(achievementId: string): Observable<{ points: number; achievement: Achievement }> {
    const data = this.userGamificationSubject.value;
    const achievement = data.achievements.find(a => a.id === achievementId);
    
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      
      this.userGamificationSubject.next({
        ...data,
        totalPoints: data.totalPoints + achievement.points,
        currentXP: data.currentXP + achievement.points
      });

      return of({ points: achievement.points, achievement }).pipe(delay(500));
    }

    return of({ points: 0, achievement: achievement! });
  }

  updateAchievementProgress(achievementId: string, progress: number): void {
    const data = this.userGamificationSubject.value;
    const achievements = data.achievements.map(a =>
      a.id === achievementId ? { ...a, progress: Math.min(progress, a.maxProgress) } : a
    );

    this.userGamificationSubject.next({ ...data, achievements });

    // Auto-unlock if progress reached
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && achievement.progress >= achievement.maxProgress && !achievement.unlocked) {
      this.unlockAchievement(achievementId).subscribe();
    }
  }

  // Streak Methods
  updateStreak(activityDate: Date = new Date()): Observable<boolean> {
    const data = this.userGamificationSubject.value;
    const lastDate = new Date(data.streak.lastActivityDate);
    const currentDate = new Date(activityDate);
    
    // Check if same day
    if (this.isSameDay(lastDate, currentDate)) {
      return of(false).pipe(delay(200));
    }

    // Check if consecutive day
    const isConsecutive = this.isConsecutiveDay(lastDate, currentDate);
    
    const newStreak = isConsecutive ? data.streak.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, data.streak.longestStreak);

    this.userGamificationSubject.next({
      ...data,
      streak: {
        ...data.streak,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: currentDate,
        streakDates: [...data.streak.streakDates, currentDate]
      }
    });

    return of(true).pipe(delay(200));
  }

  claimStreakMilestone(days: number): Observable<number> {
    const data = this.userGamificationSubject.value;
    const milestone = data.streak.milestones.find(m => m.days === days);

    if (milestone && !milestone.claimed && data.streak.currentStreak >= days) {
      milestone.claimed = true;
      
      this.userGamificationSubject.next({
        ...data,
        totalPoints: data.totalPoints + milestone.reward,
        currentXP: data.currentXP + milestone.reward
      });

      return of(milestone.reward).pipe(delay(300));
    }

    return of(0);
  }

  // Challenge Methods
  claimChallenge(challengeId: string): Observable<number> {
    const data = this.userGamificationSubject.value;
    const challenge = data.activeChallenges.find(c => c.id === challengeId);

    if (challenge && challenge.completed && !challenge.claimed) {
      challenge.claimed = true;

      this.userGamificationSubject.next({
        ...data,
        totalPoints: data.totalPoints + challenge.reward,
        currentXP: data.currentXP + challenge.reward
      });

      return of(challenge.reward).pipe(delay(500));
    }

    return of(0);
  }

  updateChallengeProgress(challengeId: string, progress: number): void {
    const data = this.userGamificationSubject.value;
    const challenges = data.activeChallenges.map(c => {
      if (c.id === challengeId) {
        const newProgress = Math.min(progress, c.maxProgress);
        return {
          ...c,
          progress: newProgress,
          completed: newProgress >= c.maxProgress
        };
      }
      return c;
    });

    this.userGamificationSubject.next({ ...data, activeChallenges: challenges });
  }

  // Rewards Methods
  purchaseReward(rewardId: string): Observable<boolean> {
    const data = this.userGamificationSubject.value;
    const reward = data.rewards.find(r => r.id === rewardId);

    if (reward && !reward.owned && data.totalPoints >= reward.cost) {
      reward.owned = true;

      this.userGamificationSubject.next({
        ...data,
        totalPoints: data.totalPoints - reward.cost
      });

      return of(true).pipe(delay(500));
    }

    return of(false).pipe(delay(200));
  }

  // Helper Methods
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private isConsecutiveDay(lastDate: Date, currentDate: Date): boolean {
    const diff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 1;
  }

  private generateStreakDates(days: number): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.unshift(date);
    }
    return dates;
  }

  private generateAchievements(): Achievement[] {
    return [
      {
        id: '1',
        title: 'First Trade',
        description: 'Complete your first trade',
        category: 'trading',
        icon: '🎯',
        rarity: 'common',
        points: 100,
        unlocked: true,
        progress: 1,
        maxProgress: 1,
        unlockedAt: new Date('2024-01-10'),
        color: '#9ca3af'
      },
      {
        id: '2',
        title: 'Profitable Trader',
        description: 'Close 10 profitable trades',
        category: 'trading',
        icon: '💰',
        rarity: 'rare',
        points: 500,
        unlocked: true,
        progress: 10,
        maxProgress: 10,
        unlockedAt: new Date('2024-02-15'),
        color: '#5c7cfa'
      },
      {
        id: '3',
        title: 'Risk Manager',
        description: 'Set stop-loss on 50 trades',
        category: 'trading',
        icon: '🛡️',
        rarity: 'epic',
        points: 1000,
        unlocked: false,
        progress: 38,
        maxProgress: 50,
        color: '#a78bfa'
      },
      {
        id: '4',
        title: 'Diamond Hands',
        description: 'Hold a position for 30 days',
        category: 'trading',
        icon: '💎',
        rarity: 'legendary',
        points: 2500,
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        color: '#ffd43b'
      },
      {
        id: '5',
        title: 'Scholar',
        description: 'Complete 5 courses',
        category: 'learning',
        icon: '🎓',
        rarity: 'rare',
        points: 800,
        unlocked: false,
        progress: 2,
        maxProgress: 5,
        color: '#5c7cfa'
      },
      {
        id: '6',
        title: 'Quiz Master',
        description: 'Pass 20 quizzes with 90%+',
        category: 'learning',
        icon: '🏆',
        rarity: 'epic',
        points: 1500,
        unlocked: false,
        progress: 5,
        maxProgress: 20,
        color: '#a78bfa'
      },
      {
        id: '7',
        title: 'Social Butterfly',
        description: 'Create 100 posts',
        category: 'social',
        icon: '🦋',
        rarity: 'rare',
        points: 600,
        unlocked: false,
        progress: 47,
        maxProgress: 100,
        color: '#5c7cfa'
      },
      {
        id: '8',
        title: 'Influencer',
        description: 'Get 1000 followers',
        category: 'social',
        icon: '⭐',
        rarity: 'epic',
        points: 2000,
        unlocked: false,
        progress: 324,
        maxProgress: 1000,
        color: '#a78bfa'
      },
      {
        id: '9',
        title: 'Century Club',
        description: 'Reach level 100',
        category: 'milestone',
        icon: '💯',
        rarity: 'legendary',
        points: 10000,
        unlocked: false,
        progress: 24,
        maxProgress: 100,
        color: '#ffd43b'
      }
    ];
  }

  private generateChallenges(): Challenge[] {
    const now = new Date();
    return [
      {
        id: '1',
        title: 'Daily Trader',
        description: 'Complete 5 trades today',
        type: 'daily',
        category: 'Trading',
        icon: '📊',
        progress: 3,
        maxProgress: 5,
        reward: 200,
        expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        completed: false,
        claimed: false
      },
      {
        id: '2',
        title: 'Learning Streak',
        description: 'Complete 1 lesson today',
        type: 'daily',
        category: 'Learning',
        icon: '📚',
        progress: 1,
        maxProgress: 1,
        reward: 150,
        expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        completed: true,
        claimed: false
      },
      {
        id: '3',
        title: 'Weekly Warrior',
        description: 'Trade 30 times this week',
        type: 'weekly',
        category: 'Trading',
        icon: '⚔️',
        progress: 18,
        maxProgress: 30,
        reward: 1000,
        expiresAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        completed: false,
        claimed: false
      },
      {
        id: '4',
        title: 'Social Star',
        description: 'Post 20 times this week',
        type: 'weekly',
        category: 'Social',
        icon: '⭐',
        progress: 12,
        maxProgress: 20,
        reward: 800,
        expiresAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        completed: false,
        claimed: false
      },
      {
        id: '5',
        title: 'Monthly Master',
        description: 'Earn 10000 points this month',
        type: 'monthly',
        category: 'General',
        icon: '👑',
        progress: 7450,
        maxProgress: 10000,
        reward: 5000,
        expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        completed: false,
        claimed: false
      }
    ];
  }

  private generateLeaderboard(): LeaderboardEntry[] {
    const usernames = ['CryptoKing', 'TradeQueen', 'BullMarket', 'BearHunter', 'DiamondHands', 'PaperTrader', 'WolfOfTrade', 'StockGuru', 'ForexPro', 'ChartMaster'];
    return Array.from({ length: 100 }, (_, i) => ({
      rank: i + 1,
      userId: `user-${i + 1}`,
      username: i === 0 ? 'You' : usernames[i % usernames.length] + (i > 9 ? i : ''),
      avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
      points: 15000 - (i * 100) + Math.floor(Math.random() * 50),
      level: 30 - Math.floor(i / 5),
      badge: i < 3 ? ['🥇', '🥈', '🥉'][i] : '',
      change: Math.floor(Math.random() * 20) - 10
    }));
  }

  private generateRewards(): Reward[] {
    return [
      {
        id: '1',
        name: 'Gold Theme',
        description: 'Unlock the premium gold color theme',
        category: 'cosmetic',
        icon: '🎨',
        cost: 5000,
        available: true,
        owned: false
      },
      {
        id: '2',
        name: '2x XP Boost',
        description: 'Double XP for 7 days',
        category: 'boost',
        icon: '⚡',
        cost: 3000,
        available: true,
        owned: false
      },
      {
        id: '3',
        name: 'VIP Badge',
        description: 'Show off your VIP status',
        category: 'cosmetic',
        icon: '👑',
        cost: 8000,
        available: true,
        owned: false
      },
      {
        id: '4',
        name: 'Advanced Analytics',
        description: 'Unlock advanced chart features',
        category: 'feature',
        icon: '📊',
        cost: 10000,
        available: true,
        owned: false
      },
      {
        id: '5',
        name: 'Premium Month',
        description: '30 days of premium features',
        category: 'premium',
        icon: '💎',
        cost: 15000,
        available: true,
        owned: false
      },
      {
        id: '6',
        name: 'Neon Theme',
        description: 'Cyberpunk neon color scheme',
        category: 'cosmetic',
        icon: '🌈',
        cost: 6000,
        available: true,
        owned: true
      }
    ];
  }
}