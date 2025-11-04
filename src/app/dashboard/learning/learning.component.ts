import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  LearningService, 
  Course, 
  Quiz, 
  UserProgress, 
  Lesson,
  Question 
} from '../../core/services/learning.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-learning',
  templateUrl: './learning.component.html',
  styleUrls: ['./learning.component.css']
})
export class LearningComponent implements OnInit, OnDestroy {
  activeTab: 'courses' | 'quizzes' | 'progress' = 'courses';
  Math = Math;
  String = String;
  courses: Course[] = [];
  quizzes: Quiz[] = [];
  userProgress!: UserProgress;

  // Filter states
  selectedCategory: string = 'all';
  selectedDifficulty: string = 'all';
  showEnrolledOnly: boolean = false;

  // Course detail view
  selectedCourse: Course | null = null;
  courseLessons: Lesson[] = [];
  isLoadingLessons: boolean = false;

  // Quiz states
  activeQuiz: Quiz | null = null;
  currentQuestionIndex: number = 0;
  userAnswers: number[] = [];
  quizCompleted: boolean = false;
  quizResult: { score: number; passed: boolean; reward: number } | null = null;
  timeRemaining: number = 0;
  timerInterval: any;

  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(private learningService: LearningService) {}

  ngOnInit(): void {
    // Subscribe to data
    this.learningService.courses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(courses => this.courses = courses);

    this.learningService.quizzes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(quizzes => this.quizzes = quizzes);

    this.learningService.userProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => this.userProgress = progress);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  switchTab(tab: 'courses' | 'quizzes' | 'progress'): void {
    this.activeTab = tab;
    this.selectedCourse = null;
    this.activeQuiz = null;
  }

  // Course Methods
  get filteredCourses(): Course[] {
    return this.courses.filter(course => {
      const categoryMatch = this.selectedCategory === 'all' || course.category === this.selectedCategory;
      const difficultyMatch = this.selectedDifficulty === 'all' || course.difficulty === this.selectedDifficulty;
      const enrolledMatch = !this.showEnrolledOnly || course.enrolled;
      return categoryMatch && difficultyMatch && enrolledMatch;
    });
  }

  viewCourseDetails(course: Course): void {
    this.selectedCourse = course;
    this.isLoadingLessons = true;
    
    this.learningService.getLessonsByCourse(course.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(lessons => {
        this.courseLessons = lessons;
        this.isLoadingLessons = false;
      });
  }

  backToCourses(): void {
    this.selectedCourse = null;
    this.courseLessons = [];
  }

  enrollCourse(courseId: string): void {
    this.learningService.enrollInCourse(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showSuccess('Successfully enrolled in course!');
      });
  }

  unenrollCourse(courseId: string): void {
    if (confirm('Are you sure you want to unenroll from this course?')) {
      this.learningService.unenrollFromCourse(courseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.showSuccess('Successfully unenrolled from course');
          this.selectedCourse = null;
        });
    }
  }

  completeLesson(lessonId: string): void {
    this.learningService.completeLesson(lessonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showSuccess('+50 points earned!');
        // Update lesson status
        this.courseLessons = this.courseLessons.map(lesson =>
          lesson.id === lessonId ? { ...lesson, completed: true } : lesson
        );
        // Update course progress
        const completedLessons = this.courseLessons.filter(l => l.completed).length;
        const progress = Math.round((completedLessons / this.courseLessons.length) * 100);
        if (this.selectedCourse) {
          this.learningService.updateCourseProgress(this.selectedCourse.id, progress).subscribe();
        }
      });
  }

  // Quiz Methods
  startQuiz(quiz: Quiz): void {
    this.activeQuiz = quiz;
    this.currentQuestionIndex = 0;
    this.userAnswers = new Array(quiz.questions.length).fill(-1);
    this.quizCompleted = false;
    this.quizResult = null;

    if (quiz.timeLimit) {
      this.timeRemaining = quiz.timeLimit * 60; // Convert to seconds
      this.startTimer();
    }
  }

  exitQuiz(): void {
    if (confirm('Are you sure you want to exit this quiz? Your progress will be lost.')) {
      this.activeQuiz = null;
      this.stopTimer();
    }
  }

  selectAnswer(answer: number): void {
    if (this.activeQuiz && !this.quizCompleted) {
      this.userAnswers[this.currentQuestionIndex] = answer;
    }
  }

  nextQuestion(): void {
    if (this.activeQuiz && this.currentQuestionIndex < this.activeQuiz.questions.length - 1) {
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

    // Check if all questions are answered
    const unanswered = this.userAnswers.filter(a => a === -1).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    this.stopTimer();
    this.learningService.submitQuiz(this.activeQuiz.id, this.userAnswers)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.quizResult = result;
        this.quizCompleted = true;
        if (result.passed) {
          this.showSuccess(`Congratulations! You earned ${result.reward} points!`);
        }
      });
  }

  retakeQuiz(): void {
    if (this.activeQuiz) {
      this.startQuiz(this.activeQuiz);
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

  // Progress Methods
  get nextLevel(): number {
    return this.userProgress.level + 1;
  }

  get progressToNextLevel(): number {
    const pointsPerLevel = 1000;
    const currentLevelPoints = this.userProgress.totalPoints % pointsPerLevel;
    return (currentLevelPoints / pointsPerLevel) * 100;
  }

  // Helper Methods
  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.clearMessages(), 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.clearMessages(), 3000);
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

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'basics': '📚',
      'technical': '📊',
      'fundamental': '📈',
      'risk': '🛡️',
      'advanced': '⚡'
    };
    return icons[category] || '📖';
  }
}