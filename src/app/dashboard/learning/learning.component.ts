import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  LearningService, 
  Lesson,
  QuizQuestion,
  QuizAnswerSubmission,
  XPStatus,
  DashboardStats,
  ChapterProgress,
  LeaderboardResponse,
  SimulationResult,
  LessonCompleteResponse
} from '../../services/learning.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ChapterWithLessons {
  chapter: number;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: ChapterProgress | null;
  expanded: boolean;
}

declare var Math: Math;
declare var YT: any; // YouTube Player API type

@Component({
  selector: 'app-learning',
  templateUrl: './learning.component.html',
  styleUrls: ['./learning.component.css']
})
export class LearningComponent implements OnInit, OnDestroy {
  activeTab: 'lessons' | 'quizzes' | 'progress' | 'leaderboard' = 'lessons';
  
  // Global objects
  Math = Math;
  
  // Data from service
  allLessons: Lesson[] = [];
  xpStatus: XPStatus | null = null;
  dashboardStats: DashboardStats | null = null;
  chapterProgress: ChapterProgress[] = [];
  leaderboard: LeaderboardResponse | null = null;

  // Chapter organization
  chapters: ChapterWithLessons[] = [
    { chapter: 1, title: 'Trading Fundamentals', description: 'Learn the basics of trading and markets', lessons: [], progress: null, expanded: true },
    { chapter: 2, title: 'Technical Analysis Basics', description: 'Master chart reading and patterns', lessons: [], progress: null, expanded: false },
    { chapter: 3, title: 'Technical Indicators', description: 'Learn key trading indicators', lessons: [], progress: null, expanded: false },
    { chapter: 4, title: 'Risk Management', description: 'Protect your capital effectively', lessons: [], progress: null, expanded: false },
    { chapter: 5, title: 'Chart Patterns & Price Action', description: 'Advanced pattern recognition', lessons: [], progress: null, expanded: false },
    { chapter: 6, title: 'Trading Strategies', description: 'Build your trading system', lessons: [], progress: null, expanded: false },
    { chapter: 7, title: 'Advanced Concepts', description: 'Master professional techniques', lessons: [], progress: null, expanded: false }
  ];

  // Filter states
  selectedChapter: number | null = null;
  selectedDifficulty: string = 'all';
  selectedType: string = 'all';
  showCompletedOnly: boolean = false;

  // Lesson detail view
  selectedLesson: Lesson | null = null;
  isLoadingLesson: boolean = false;

  // Quiz states
  activeQuiz: Lesson | null = null;
  quizQuestions: QuizQuestion[] = [];
  currentQuestionIndex: number = 0;
  userAnswers: number[] = [];
  quizCompleted: boolean = false;
  quizResult: LessonCompleteResponse | null = null;
  timeRemaining: number = 0;
  timerInterval: any;

  // Video states
  videoWatchInterval: any;
  videoCurrentTime: number = 0;
  videoDuration: number = 0;
  
  // YouTube Player API
  youtubePlayer: any = null;
  youtubeWatchInterval: any = null;
  isYouTubeAPILoaded: boolean = false;

  // Simulation states
  simulationActive: boolean = false;
  simulationData: any = null;

  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  // Loading states
  isLoading: boolean = true;

  // Leaderboard
  leaderboardPeriod: 'all_time' | 'monthly' | 'weekly' = 'all_time';

  private destroy$ = new Subject<void>();

  constructor(
    private learningService: LearningService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    // Subscribe to all data streams
    this.learningService.lessons$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lessons => {
        this.allLessons = lessons;
        this.organizeLessonsByChapter();
        this.isLoading = false;
      });

    this.learningService.xpStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => this.xpStatus = status);

    this.learningService.dashboardStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => this.dashboardStats = stats);

    this.learningService.chapters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chapters => {
        this.chapterProgress = chapters;
        this.updateChapterProgress();
      });

    // Load leaderboard if needed
    this.loadLeaderboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTimer();
    this.stopVideoTracking();
    this.destroyYouTubePlayer();
  }

  // ============= Tab Navigation =============

  switchTab(tab: 'lessons' | 'quizzes' | 'progress' | 'leaderboard'): void {
    this.activeTab = tab;
    this.selectedLesson = null;
    this.activeQuiz = null;
    this.simulationActive = false;
    this.destroyYouTubePlayer();
    
    if (tab === 'leaderboard' && !this.leaderboard) {
      this.loadLeaderboard();
    }
  }

  // ============= YouTube Player Methods =============

  isYouTubeUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  getSafeYouTubeUrl(url: string): SafeResourceUrl {
    const videoId = this.getYouTubeVideoId(url);
    if (videoId) {
      // Use YouTube embed URL
      const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    
    // Return original URL if not YouTube
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  loadYouTubeAPI(): void {
    if (this.isYouTubeAPILoaded) return;

    // Check if API is already loaded
    if ((window as any)['YT']) {
      this.isYouTubeAPILoaded = true;
      return;
    }

    // Create script tag for YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onload = () => {
      this.isYouTubeAPILoaded = true;
    };
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Setup global callback for API ready
    (window as any)['onYouTubeIframeAPIReady'] = () => {
    console.log('YouTube API loaded');
  };
  }

  initializeYouTubePlayer(videoId: string, lessonId: number): void {
    // Load API if not already loaded
    if (!this.isYouTubeAPILoaded) {
      this.loadYouTubeAPI();
      
      // Wait for API to load
      const checkInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(checkInterval);
          this.createYouTubePlayer(videoId, lessonId);
        }
      }, 100);
    } else {
      this.createYouTubePlayer(videoId, lessonId);
    }
  }

  // Get the current chapter lessons
  getCurrentChapterLessons(): Lesson[] {
    if (!this.selectedLesson) return [];
    
    const chapter = this.chapters.find(c => c.chapter === this.selectedLesson!.chapter);
    return chapter ? chapter.lessons : [];
  }

  // Get current lesson index
  getCurrentLessonIndex(): number {
    if (!this.selectedLesson) return -1;
    
    const lessons = this.getCurrentChapterLessons();
    return lessons.findIndex(lesson => lesson.id === this.selectedLesson!.id);
  }

  // Check if there's a previous lesson
  hasPreviousLesson(): boolean {
    const currentIndex = this.getCurrentLessonIndex();
    return currentIndex > 0;
  }

  // Check if there's a next lesson
  hasNextLesson(): boolean {
    const lessons = this.getCurrentChapterLessons();
    const currentIndex = this.getCurrentLessonIndex();
    return currentIndex >= 0 && currentIndex < lessons.length - 1;
  }

  // Navigate to previous lesson
  goToPreviousLesson(): void {
    if (!this.selectedLesson || !this.hasPreviousLesson()) return;
    
    const lessons = this.getCurrentChapterLessons();
    const currentIndex = this.getCurrentLessonIndex();
    const previousLesson = lessons[currentIndex - 1];
    
    if (previousLesson) {
      this.viewLessonDetail(previousLesson);
      this.scrollToTop();
    }
  }

  // Navigate to next lesson
  goToNextLesson(): void {
    if (!this.selectedLesson || !this.hasNextLesson()) return;
    
    const lessons = this.getCurrentChapterLessons();
    const currentIndex = this.getCurrentLessonIndex();
    const nextLesson = lessons[currentIndex + 1];
    
    if (nextLesson) {
      this.viewLessonDetail(nextLesson);
      this.scrollToTop();
    }
  }

  // Scroll to top of page
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  createYouTubePlayer(videoId: string, lessonId: number): void {
    // Destroy existing player
    this.destroyYouTubePlayer();

    // Create new player
    this.youtubePlayer = new (window as any)['YT'].Player(`youtube-player-${lessonId}`, {
      videoId: videoId,
      playerVars: {
        controls: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1
      },
      events: {
        'onReady': (event: any) => this.onYouTubePlayerReady(event, lessonId),
        'onStateChange': (event: any) => this.onYouTubeStateChange(event, lessonId),
        'onError': (event: any) => this.onYouTubePlayerError(event)
      }
    });
  }

  onYouTubePlayerReady(event: any, lessonId: number): void {
    console.log('YouTube player ready');
    // Start tracking if autoplay is enabled
    this.startYouTubeTimeTracking(lessonId);
  }

  onYouTubeStateChange(event: any, lessonId: number): void {
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) { 
      this.startYouTubeTimeTracking(lessonId);
    }
    // YT.PlayerState.PAUSED = 2, YT.PlayerState.ENDED = 0
    else if (event.data === 2 || event.data === 0) { 
      this.stopYouTubeTimeTracking();
    }
  }

  onYouTubePlayerError(event: any): void {
    console.error('YouTube player error:', event.data);
    this.showError('Error loading YouTube video. Please try again.');
  }

  startYouTubeTimeTracking(lessonId: number): void {
    this.stopYouTubeTimeTracking();
    
    this.youtubeWatchInterval = setInterval(() => {
      if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
        try {
          const currentTime = this.youtubePlayer.getCurrentTime();
          const duration = this.youtubePlayer.getDuration();
          
          // Only send progress if we have valid times
          if (currentTime > 0 && duration > 0) {
            const watchedPercentage = (currentTime / duration) * 100;
            
            this.learningService.updateVideoProgress(
              lessonId,
              watchedPercentage,
              Math.floor(currentTime)
            ).subscribe({
              error: (err) => console.error('Failed to update video progress:', err)
            });
          }
        } catch (error) {
          console.error('Error getting YouTube player time:', error);
        }
      }
    }, 10000); // Update every 10 seconds
  }

  stopYouTubeTimeTracking(): void {
    if (this.youtubeWatchInterval) {
      clearInterval(this.youtubeWatchInterval);
      this.youtubeWatchInterval = null;
    }
  }

  destroyYouTubePlayer(): void {
    this.stopYouTubeTimeTracking();
    
    if (this.youtubePlayer) {
      try {
        this.youtubePlayer.destroy();
      } catch (error) {
        console.error('Error destroying YouTube player:', error);
      }
      this.youtubePlayer = null;
    }
  }

  // ============= Chapter & Lesson Organization =============

  organizeLessonsByChapter(): void {
    this.chapters.forEach(chapter => {
      chapter.lessons = this.allLessons.filter(l => l.chapter === chapter.chapter)
        .sort((a, b) => a.order - b.order);
    });
  }

  updateChapterProgress(): void {
    this.chapters.forEach(chapter => {
      const progress = this.chapterProgress.find(p => p.chapter === chapter.chapter);
      chapter.progress = progress || null;
    });
  }

  getLessonTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'video': '#ff6b6b',
      'reading': '#4dabf7',
      'quiz': '#51cf66',
      'simulation': '#cc5de8'
    };
    return colors[type] || '#9ca3af';
  }

  getLessonTypeName(type: string): string {
    const names: { [key: string]: string } = {
      'video': 'Video',
      'reading': 'Reading',
      'quiz': 'Quiz',
      'simulation': 'Simulation'
    };
    return names[type] || 'Lesson';
  }

  toggleChapter(chapter: ChapterWithLessons): void {
    chapter.expanded = !chapter.expanded;
  }

  get filteredQuizzes(): Lesson[] {
    return this.allLessons.filter(l => {
      if (l.type !== 'quiz') return false;
      if (this.selectedDifficulty !== 'all' && l.difficulty !== this.selectedDifficulty) return false;
      if (this.showCompletedOnly && !l.user_completed) return false;
      return true;
    }).sort((a, b) => a.chapter - b.chapter || a.order - b.order);
  }

  // ============= Lesson Detail View =============

  viewLessonDetail(lesson: Lesson): void {
    if (lesson.is_locked) {
      this.showError(lesson.lock_reason || 'This lesson is locked');
      return;
    }

    this.selectedLesson = lesson;
    this.isLoadingLesson = true;

    // Load full lesson details
    this.learningService.getLesson(lesson.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fullLesson) => {
          this.selectedLesson = fullLesson;
          this.isLoadingLesson = false;

          // Handle different lesson types
          if (fullLesson.type === 'quiz') {
            this.loadQuizQuestions(fullLesson.id);
          } else if (fullLesson.type === 'video') {
            // Initialize YouTube player if it's a YouTube video
            if (this.isYouTubeUrl(fullLesson.content?.video_url)) {
              const videoId = this.getYouTubeVideoId(fullLesson.content.video_url);
              if (videoId) {
                this.initializeYouTubePlayer(videoId, fullLesson.id);
              }
            }
          }
        },
        error: (err) => {
          this.showError('Failed to load lesson');
          this.isLoadingLesson = false;
        }
      });
  }

  backToLessons(): void {
    this.selectedLesson = null;
    this.stopVideoTracking();
    this.destroyYouTubePlayer();
  }

  // ============= Video Lessons =============

  startVideoTracking(lessonId: number): void {
    this.stopVideoTracking();
    
    // Track video progress every 10 seconds
    this.videoWatchInterval = setInterval(() => {
      if (this.videoCurrentTime > 0 && this.videoDuration > 0) {
        const watchedPercentage = (this.videoCurrentTime / this.videoDuration) * 100;
        
        this.learningService.updateVideoProgress(
          lessonId,
          watchedPercentage,
          Math.floor(this.videoCurrentTime)
        ).subscribe({
          error: (err) => console.error('Failed to update video progress:', err)
        });
      }
    }, 10000); // Every 10 seconds
  }

  stopVideoTracking(): void {
    if (this.videoWatchInterval) {
      clearInterval(this.videoWatchInterval);
      this.videoWatchInterval = null;
    }
  }

  onVideoTimeUpdate(event: any): void {
    this.videoCurrentTime = event.target.currentTime;
    this.videoDuration = event.target.duration;
  }

  completeVideoLesson(): void {
    if (!this.selectedLesson) return;

    // For YouTube videos, handle differently
    if (this.isYouTubeUrl(this.selectedLesson.content?.video_url) && this.youtubePlayer) {
      this.completeYouTubeVideoLesson();
      return;
    }

    // For regular videos, check if duration is valid
    if (!this.videoDuration || this.videoDuration <= 0 || !isFinite(this.videoDuration)) {
      this.showError('Cannot complete lesson: Video duration is not available yet. Please watch the video first.');
      return;
    }

    const timeSpent = Math.ceil(this.videoDuration / 60); // Convert to minutes
    
    this.learningService.completeLesson(this.selectedLesson.id, timeSpent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleLessonCompletion(response);
          this.stopVideoTracking();
        },
        error: (err) => this.showError('Failed to complete lesson')
      });
  }

  completeYouTubeVideoLesson(): void {
    if (!this.selectedLesson || !this.youtubePlayer) return;

    try {
      const currentTime = this.youtubePlayer.getCurrentTime();
      const duration = this.youtubePlayer.getDuration();
      
      // Use current time watched, or full duration if video ended
      const timeWatched = currentTime > 0 ? currentTime : duration;
      
      if (timeWatched <= 0) {
        this.showError('Please watch some of the video before completing the lesson.');
        return;
      }

      const timeSpent = Math.ceil(timeWatched / 60); // Convert to minutes
      
      this.learningService.completeLesson(this.selectedLesson.id, timeSpent)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handleLessonCompletion(response);
            this.stopYouTubeTimeTracking();
          },
          error: (err) => this.showError('Failed to complete lesson')
        });
    } catch (error) {
      console.error('Error completing YouTube lesson:', error);
      this.showError('Error completing lesson. Please try again.');
    }
  }

  // ============= Reading Lessons =============

  completeReadingLesson(): void {
    if (!this.selectedLesson) return;

    this.learningService.completeLesson(this.selectedLesson.id, this.selectedLesson.duration_minutes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleLessonCompletion(response),
        error: (err) => this.showError('Failed to complete lesson')
      });
  }

  // ============= Quiz Methods =============

  loadQuizQuestions(lessonId: number): void {
    this.learningService.getQuizQuestions(lessonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.quizQuestions = questions.sort((a, b) => a.order - b.order);
        },
        error: (err) => this.showError('Failed to load quiz questions')
      });
  }

  startQuiz(lesson: Lesson): void {
    if (lesson.is_locked) {
      this.showError(lesson.lock_reason || 'This quiz is locked');
      return;
    }

    this.activeQuiz = lesson;
    this.currentQuestionIndex = 0;
    this.quizCompleted = false;
    this.quizResult = null;

    // Load questions
    this.learningService.getQuizQuestions(lesson.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.quizQuestions = questions.sort((a, b) => a.order - b.order);
          this.userAnswers = new Array(questions.length).fill(-1);
          
          // Start timer if lesson has time limit
          if (lesson.duration_minutes) {
            this.timeRemaining = lesson.duration_minutes * 60;
            this.startTimer();
          }
        },
        error: (err) => this.showError('Failed to load quiz')
      });
  }

  exitQuiz(): void {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      this.activeQuiz = null;
      this.stopTimer();
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }

  selectAnswer(answerIndex: number): void {
    if (!this.quizCompleted) {
      this.userAnswers[this.currentQuestionIndex] = answerIndex;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitQuiz(): void {
    if (!this.activeQuiz) return;

    const unanswered = this.userAnswers.filter(a => a === -1).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    this.stopTimer();

    const answers: QuizAnswerSubmission[] = this.quizQuestions.map((q, i) => ({
      question_id: q.id,
      answer: this.userAnswers[i] === -1 ? 0 : this.userAnswers[i]
    }));

    this.learningService.submitQuiz(this.activeQuiz.id, answers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.quizResult = response;
          this.quizCompleted = true;
          
          if (response.success && response.quiz_results?.passed) {
            this.showSuccess(
              `Congratulations! You scored ${response.quiz_results.score}% and earned ${response.rewards.xp_gained} XP!`
            );
          } else {
            this.showError(
              `You scored ${response.quiz_results?.score || 0}%. Keep practicing!`
            );
          }
        },
        error: (err) => this.showError('Failed to submit quiz')
      });
  }

  retakeQuiz(): void {
    if (this.activeQuiz) {
      const lesson = this.activeQuiz;
      this.activeQuiz = null;
      setTimeout(() => this.startQuiz(lesson), 100);
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.submitQuiz();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  getTimeFormatted(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // ============= Simulation Methods =============

  startSimulation(lesson: Lesson): void {
    if (lesson.is_locked) {
      this.showError(lesson.lock_reason || 'This simulation is locked');
      return;
    }

    this.selectedLesson = lesson;
    this.simulationActive = true;
    this.simulationData = lesson.content;
  }

  submitSimulationResults(result: SimulationResult): void {
    if (!this.selectedLesson) return;

    this.learningService.submitSimulation(this.selectedLesson.id, result)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleLessonCompletion(response);
          this.simulationActive = false;
        },
        error: (err) => this.showError('Failed to submit simulation')
      });
  }

  // ============= Leaderboard =============

  loadLeaderboard(): void {
    this.learningService.getLeaderboard(this.leaderboardPeriod, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.leaderboard = data,
        error: (err) => console.error('Failed to load leaderboard', err)
      });
  }

  changeLeaderboardPeriod(period: 'all_time' | 'monthly' | 'weekly'): void {
    this.leaderboardPeriod = period;
    this.loadLeaderboard();
  }

  // ============= Helper Methods =============

  handleLessonCompletion(response: LessonCompleteResponse): void {
    let message = response.message;
    
    if (response.rewards.level_up) {
      message += ` 🎉 Level Up! You're now Level ${response.rewards.new_level}!`;
    }
    
    if (response.rewards.badge_earned) {
      message += ` 🏆 Badge Earned: ${response.rewards.badge_earned}!`;
    }

    this.showSuccess(message);
    
    // Refresh data
    this.learningService.refreshAll();
    
    // Update local lesson state
    if (this.selectedLesson) {
      this.selectedLesson.user_completed = true;
    }
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getDifficultyColor(difficulty: string): string {
    const colors: { [key: string]: string } = {
      'beginner': '#51cf66',
      'intermediate': '#ffd43b',
      'advanced': '#ff6b6b'
    };
    return colors[difficulty] || '#9ca3af';
  }

  getLessonTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'video': '🎥',
      'reading': '📖',
      'quiz': '🎯',
      'simulation': '🎮'
    };
    return icons[type] || '📚';
  }

  get nextLevel(): number {
    return this.xpStatus ? this.xpStatus.level + 1 : 2;
  }

  get progressToNextLevel(): number {
    if (!this.xpStatus) return 0;
    return this.xpStatus.level_progress_percentage;
  }
}