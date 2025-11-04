import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommunityService, Post, User, ForumThread, Challenge } from '../../core/services/community.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css']
})
export class CommunityComponent implements OnInit, OnDestroy {
  activeTab: 'feed' | 'leaderboard' | 'forum' | 'challenges' = 'feed';
  
  posts: Post[] = [];
  leaderboard: User[] = [];
  threads: ForumThread[] = [];
  challenges: Challenge[] = [];

  newPostContent: string = '';
  isPostingDisabled: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private communityService: CommunityService) {}

  ngOnInit(): void {
    // Subscribe to all data streams
    this.communityService.posts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(posts => this.posts = posts);

    this.communityService.leaderboard$
      .pipe(takeUntil(this.destroy$))
      .subscribe(leaderboard => this.leaderboard = leaderboard);

    this.communityService.threads$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threads => this.threads = threads);

    this.communityService.challenges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(challenges => this.challenges = challenges);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(tab: 'feed' | 'leaderboard' | 'forum' | 'challenges'): void {
    this.activeTab = tab;
  }

  likePost(postId: string): void {
    this.communityService.likePost(postId);
  }

  createPost(): void {
    if (this.newPostContent.trim()) {
      this.communityService.createPost(this.newPostContent);
      this.newPostContent = '';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  getRankBadge(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'active': return '#51cf66';
      case 'upcoming': return '#ffd43b';
      case 'ended': return '#868e96';
      default: return '#868e96';
    }
  }

  getDaysRemaining(endDate: Date): number {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}