import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

// ============= Interfaces (matching backend schemas) =============

export interface Lesson {
  id: number;
  title: string;
  description: string;
  chapter: number;
  order: number;
  type: 'video' | 'reading' | 'quiz' | 'simulation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: any;
  duration_minutes: number;
  xp_reward: number;
  coin_reward: number;
  badge_reward: string | null;
  required_level: number;
  tags: string[];
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Progress fields
  user_completed: boolean;
  user_progress: number | null;
  is_locked: boolean;
  lock_reason: string | null;
}

export interface LessonListResponse {
  lessons: Lesson[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
  points: number;
  order: number;
}

export interface QuizAnswerSubmission {
  question_id: number;
  answer: number; // Index of selected answer (0-3)
}

export interface QuizCompleteRequest {
  answers: QuizAnswerSubmission[];
}

export interface SimulationResult {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  profit_loss_percentage: number;
  max_drawdown: number;
  final_balance: number;
  starting_balance: number;
}

export interface RewardResponse {
  xp_gained: number;
  coins_gained: number;
  badge_earned: string | null;
  level_up: boolean;
  new_level: number | null;
  unlocked_lessons: number[];
}

export interface LessonProgressResponse {
  id: number;
  lesson_id: number;
  completed: boolean;
  attempts: number;
  xp_earned: number;
  coins_earned: number;
  badge_earned: string | null;
  quiz_score: number | null;
  watched_percentage: number | null;
  simulation_score: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface LessonCompleteResponse {
  success: boolean;
  message: string;
  rewards: RewardResponse;
  progress: LessonProgressResponse;
  quiz_results?: {
    score: number;
    passed: boolean;
    correct_answers: number;
    total_questions: number;
    passing_score: number;
  };
}

export interface XPStatus {
  user_id: number;
  level: number;
  total_xp: number;
  current_level_xp: number;
  next_level_xp: number;
  level_progress_percentage: number;
  coins: number;
  total_coins_earned: number;
  badges: string[];
  lessons_completed: number;
  quizzes_passed: number;
  simulations_completed: number;
  current_streak_days: number;
  longest_streak_days: number;
}

export interface DashboardStats {
  xp_status: {
    level: number;
    total_xp: number;
    level_progress: number;
    coins: number;
    badges: number;
  };
  learning_stats: {
    lessons_completed: number;
    lessons_in_progress: number;
    quizzes_passed: number;
    simulations_completed: number;
    total_study_time_minutes: number;
    average_quiz_score: number;
  };
  streaks: {
    current_streak: number;
    longest_streak: number;
  };
  next_unlocks: Array<{
    id: number;
    title: string;
    type: string;
    required_level: number;
  }>;
}

export interface ChapterProgress {
  chapter: number;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  level: number;
  total_xp: number;
  lessons_completed: number;
  badges: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  user_rank: LeaderboardEntry | null;
  period: string;
}

export interface XPTransaction {
  id: number;
  transaction_type: string;
  xp_change: number;
  coin_change: number;
  description: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class LearningService {
  private apiUrl = 'http://127.0.0.1:8000/lessons';

  // BehaviorSubjects for reactive data
  private xpStatusSubject = new BehaviorSubject<XPStatus | null>(null);
  private dashboardStatsSubject = new BehaviorSubject<DashboardStats | null>(null);
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);
  private chaptersSubject = new BehaviorSubject<ChapterProgress[]>([]);

  // Public observables
  public xpStatus$ = this.xpStatusSubject.asObservable();
  public dashboardStats$ = this.dashboardStatsSubject.asObservable();
  public lessons$ = this.lessonsSubject.asObservable();
  public chapters$ = this.chaptersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeData();
  }

  // ============= Initialization =============

  private initializeData(): void {
    this.loadXPStatus();
    this.loadDashboardStats();
    this.loadLessons();
    this.loadChapters();
  }

  public refreshAll(): void {
    this.initializeData();
  }

  // ============= XP & Gamification =============

  loadXPStatus(): void {
    this.http.get<XPStatus>(`${this.apiUrl}/xp/status`).subscribe(
      status => this.xpStatusSubject.next(status),
      error => console.error('Error loading XP status:', error)
    );
  }

  getXPTransactions(limit: number = 50, offset: number = 0): Observable<XPTransaction[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<XPTransaction[]>(`${this.apiUrl}/xp/transactions`, { params });
  }

  recalculateLevel(): Observable<any> {
    return this.http.post(`${this.apiUrl}/recalculate-my-level`, {}).pipe(
      tap(() => this.loadXPStatus())
    );
  }

  getXPProgressionTable(maxLevel: number = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/xp-progression-table`, {
      params: { max_level: maxLevel.toString() }
    });
  }

  // ============= Dashboard & Stats =============

  loadDashboardStats(): void {
    this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`).subscribe(
      stats => this.dashboardStatsSubject.next(stats),
      error => console.error('Error loading dashboard stats:', error)
    );
  }

  loadChapters(): void {
    this.http.get<{ chapters: ChapterProgress[] }>(`${this.apiUrl}/chapters`).subscribe(
      response => this.chaptersSubject.next(response.chapters),
      error => console.error('Error loading chapters:', error)
    );
  }

  // ============= Leaderboard =============

  getLeaderboard(
    period: 'all_time' | 'monthly' | 'weekly' = 'all_time',
    limit: number = 10
  ): Observable<LeaderboardResponse> {
    const params = new HttpParams()
      .set('period', period)
      .set('limit', limit.toString());
    return this.http.get<LeaderboardResponse>(`${this.apiUrl}/leaderboard`, { params });
  }

  // ============= Lessons =============

  loadLessons(
    chapter?: number,
    difficulty?: string,
    lessonType?: string,
    page: number = 1,
    pageSize: number = 100
  ): void {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (chapter) params = params.set('chapter', chapter.toString());
    if (difficulty) params = params.set('difficulty', difficulty);
    if (lessonType) params = params.set('lesson_type', lessonType);

    this.http.get<LessonListResponse>(`${this.apiUrl}/`, { params }).subscribe(
      response => this.lessonsSubject.next(response.lessons),
      error => console.error('Error loading lessons:', error)
    );
  }

  getLesson(lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/${lessonId}`);
  }

  getLessonProgress(lessonId: number): Observable<LessonProgressResponse> {
    return this.http.get<LessonProgressResponse>(`${this.apiUrl}/${lessonId}/progress`);
  }

  // ============= Quiz Methods =============

  getQuizQuestions(lessonId: number): Observable<QuizQuestion[]> {
    return this.http.get<QuizQuestion[]>(`${this.apiUrl}/${lessonId}/questions`);
  }

  submitQuiz(lessonId: number, answers: QuizAnswerSubmission[]): Observable<LessonCompleteResponse> {
    const payload: QuizCompleteRequest = { answers };
    return this.http.post<LessonCompleteResponse>(
      `${this.apiUrl}/${lessonId}/submit-quiz`,
      payload
    ).pipe(
      tap(() => {
        this.loadXPStatus();
        this.loadDashboardStats();
        this.loadLessons();
      })
    );
  }

  // ============= Lesson Completion =============

  completeLesson(lessonId: number, timeSpentMinutes?: number): Observable<LessonCompleteResponse> {
    const payload = { time_spent_minutes: timeSpentMinutes };
    return this.http.post<LessonCompleteResponse>(
      `${this.apiUrl}/${lessonId}/complete`,
      payload
    ).pipe(
      tap(() => {
        this.loadXPStatus();
        this.loadDashboardStats();
        this.loadLessons();
      })
    );
  }

  updateVideoProgress(
    lessonId: number,
    watchedPercentage: number,
    lastPosition: number
  ): Observable<any> {
    const payload = {
      watched_percentage: watchedPercentage,
      last_position: lastPosition
    };
    return this.http.post(`${this.apiUrl}/${lessonId}/video-progress`, payload);
  }

  submitSimulation(
    lessonId: number,
    result: SimulationResult
  ): Observable<LessonCompleteResponse> {
    const payload = { result };
    return this.http.post<LessonCompleteResponse>(
      `${this.apiUrl}/${lessonId}/submit-simulation`,
      payload
    ).pipe(
      tap(() => {
        this.loadXPStatus();
        this.loadDashboardStats();
        this.loadLessons();
      })
    );
  }

  // ============= Helper Methods =============

  getLessonsByChapter(chapter: number): Lesson[] {
    return this.lessonsSubject.value.filter(l => l.chapter === chapter);
  }

  getQuizLessons(): Lesson[] {
    return this.lessonsSubject.value.filter(l => l.type === 'quiz');
  }

  getSimulationLessons(): Lesson[] {
    return this.lessonsSubject.value.filter(l => l.type === 'simulation');
  }

  getCurrentXPStatus(): XPStatus | null {
    return this.xpStatusSubject.value;
  }

  getCurrentDashboardStats(): DashboardStats | null {
    return this.dashboardStatsSubject.value;
  }
}