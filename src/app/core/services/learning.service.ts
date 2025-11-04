import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'technical' | 'fundamental' | 'risk' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  lessons: number;
  enrolled: boolean;
  progress: number; // 0-100
  rating: number;
  students: number;
  icon: string;
  color: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  duration: number;
  completed: boolean;
  videoUrl?: string;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  reward: number; // points
  completed: boolean;
  score?: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserProgress {
  totalPoints: number;
  coursesCompleted: number;
  quizzesPassed: number;
  currentStreak: number;
  level: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LearningService {

  private coursesSubject = new BehaviorSubject<Course[]>([
    {
      id: '1',
      title: 'Trading Fundamentals',
      description: 'Master the basics of trading: orders, markets, and essential concepts',
      category: 'basics',
      difficulty: 'beginner',
      duration: 120,
      lessons: 8,
      enrolled: true,
      progress: 75,
      rating: 4.8,
      students: 15420,
      icon: '📚',
      color: '#00c896'
    },
    {
      id: '2',
      title: 'Technical Analysis Masterclass',
      description: 'Learn chart patterns, indicators, and technical strategies',
      category: 'technical',
      difficulty: 'intermediate',
      duration: 240,
      lessons: 12,
      enrolled: true,
      progress: 35,
      rating: 4.9,
      students: 12350,
      icon: '📊',
      color: '#5c7cfa'
    },
    {
      id: '3',
      title: 'Risk Management Pro',
      description: 'Protect your capital with advanced risk management techniques',
      category: 'risk',
      difficulty: 'intermediate',
      duration: 180,
      lessons: 10,
      enrolled: false,
      progress: 0,
      rating: 4.7,
      students: 9840,
      icon: '🛡️',
      color: '#ff6b6b'
    },
    {
      id: '4',
      title: 'Cryptocurrency Trading',
      description: 'Navigate the crypto markets with confidence and strategy',
      category: 'advanced',
      difficulty: 'intermediate',
      duration: 200,
      lessons: 14,
      enrolled: false,
      progress: 0,
      rating: 4.6,
      students: 11200,
      icon: '₿',
      color: '#ffd43b'
    },
    {
      id: '5',
      title: 'Fundamental Analysis',
      description: 'Evaluate stocks using financial statements and economic indicators',
      category: 'fundamental',
      difficulty: 'advanced',
      duration: 300,
      lessons: 16,
      enrolled: false,
      progress: 0,
      rating: 4.9,
      students: 8500,
      icon: '📈',
      color: '#51cf66'
    },
    {
      id: '6',
      title: 'Options Trading Strategies',
      description: 'Master options trading from basics to advanced strategies',
      category: 'advanced',
      difficulty: 'advanced',
      duration: 360,
      lessons: 20,
      enrolled: false,
      progress: 0,
      rating: 4.8,
      students: 6700,
      icon: '⚡',
      color: '#a78bfa'
    }
  ]);
  public courses$ = this.coursesSubject.asObservable();

  private quizzesSubject = new BehaviorSubject<Quiz[]>([
    {
      id: '1',
      title: 'Trading Basics Quiz',
      description: 'Test your knowledge of fundamental trading concepts',
      category: 'Basics',
      difficulty: 'beginner',
      questions: this.getBasicQuestions(),
      timeLimit: 10,
      passingScore: 70,
      reward: 100,
      completed: false
    },
    {
      id: '2',
      title: 'Technical Analysis Quiz',
      description: 'Challenge yourself with chart patterns and indicators',
      category: 'Technical',
      difficulty: 'intermediate',
      questions: this.getTechnicalQuestions(),
      timeLimit: 15,
      passingScore: 75,
      reward: 200,
      completed: false
    },
    {
      id: '3',
      title: 'Risk Management Quiz',
      description: 'Prove your risk management expertise',
      category: 'Risk',
      difficulty: 'advanced',
      questions: this.getRiskQuestions(),
      timeLimit: 20,
      passingScore: 80,
      reward: 300,
      completed: false
    }
  ]);
  public quizzes$ = this.quizzesSubject.asObservable();

  private userProgressSubject = new BehaviorSubject<UserProgress>({
    totalPoints: 2450,
    coursesCompleted: 2,
    quizzesPassed: 5,
    currentStreak: 7,
    level: 8,
    achievements: [
      { id: '1', title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', unlocked: true, unlockedAt: new Date('2024-01-15') },
      { id: '2', title: 'Quick Learner', description: 'Complete 5 lessons in one day', icon: '⚡', unlocked: true, unlockedAt: new Date('2024-02-20') },
      { id: '3', title: 'Quiz Master', description: 'Pass 10 quizzes with 90%+', icon: '🏆', unlocked: false },
      { id: '4', title: 'Dedicated Student', description: 'Maintain a 30-day streak', icon: '🔥', unlocked: false },
      { id: '5', title: 'Course Completer', description: 'Complete 5 courses', icon: '🎓', unlocked: false }
    ]
  });
  public userProgress$ = this.userProgressSubject.asObservable();

  constructor() {}

  // Courses Methods
  getCourseById(id: string): Observable<Course | undefined> {
    const course = this.coursesSubject.value.find(c => c.id === id);
    return of(course).pipe(delay(300));
  }

  enrollInCourse(courseId: string): Observable<boolean> {
    const courses = this.coursesSubject.value.map(course =>
      course.id === courseId ? { ...course, enrolled: true } : course
    );
    this.coursesSubject.next(courses);
    return of(true).pipe(delay(500));
  }

  unenrollFromCourse(courseId: string): Observable<boolean> {
    const courses = this.coursesSubject.value.map(course =>
      course.id === courseId ? { ...course, enrolled: false, progress: 0 } : course
    );
    this.coursesSubject.next(courses);
    return of(true).pipe(delay(500));
  }

  updateCourseProgress(courseId: string, progress: number): Observable<boolean> {
    const courses = this.coursesSubject.value.map(course =>
      course.id === courseId ? { ...course, progress } : course
    );
    this.coursesSubject.next(courses);
    return of(true).pipe(delay(300));
  }

  // Lessons Methods
  getLessonsByCourse(courseId: string): Observable<Lesson[]> {
    // Mock lessons data
    const lessons: Lesson[] = Array.from({ length: 8 }, (_, i) => ({
      id: `${courseId}-lesson-${i + 1}`,
      courseId,
      title: `Lesson ${i + 1}: ${this.getLessonTitle(i)}`,
      description: 'Learn essential trading concepts and strategies',
      content: this.getLessonContent(i),
      duration: 15,
      completed: i < 6, // First 6 completed
      order: i + 1
    }));
    return of(lessons).pipe(delay(500));
  }

  completeLesson(lessonId: string): Observable<boolean> {
    // Update user progress
    const progress = this.userProgressSubject.value;
    this.userProgressSubject.next({
      ...progress,
      totalPoints: progress.totalPoints + 50
    });
    return of(true).pipe(delay(300));
  }

  // Quiz Methods
  submitQuiz(quizId: string, answers: number[]): Observable<{ score: number; passed: boolean; reward: number }> {
    const quiz = this.quizzesSubject.value.find(q => q.id === quizId);
    if (!quiz) return of({ score: 0, passed: false, reward: 0 });

    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    const reward = passed ? quiz.reward : 0;

    // Update quiz status
    const quizzes = this.quizzesSubject.value.map(q =>
      q.id === quizId ? { ...q, completed: passed, score } : q
    );
    this.quizzesSubject.next(quizzes);

    // Update user progress
    if (passed) {
      const progress = this.userProgressSubject.value;
      this.userProgressSubject.next({
        ...progress,
        totalPoints: progress.totalPoints + reward,
        quizzesPassed: progress.quizzesPassed + 1
      });
    }

    return of({ score, passed, reward }).pipe(delay(1000));
  }

  // Helper Methods
  private getLessonTitle(index: number): string {
    const titles = [
      'Introduction to Trading',
      'Understanding Markets',
      'Types of Orders',
      'Reading Charts',
      'Market Analysis',
      'Trading Psychology',
      'Building Strategies',
      'Risk Management Basics'
    ];
    return titles[index] || 'Trading Lesson';
  }

  private getLessonContent(index: number): string {
    return `
      <h2>Lesson ${index + 1}</h2>
      <p>Welcome to this comprehensive lesson on trading fundamentals. In this session, you'll learn:</p>
      <ul>
        <li>Key concepts and terminology</li>
        <li>Practical examples and case studies</li>
        <li>Best practices from professional traders</li>
        <li>Common mistakes to avoid</li>
      </ul>
      <h3>Key Takeaways</h3>
      <p>Understanding these fundamentals will help you make informed trading decisions and manage risk effectively.</p>
    `;
  }

  private getBasicQuestions(): Question[] {
    return [
      {
        id: '1',
        question: 'What is a market order?',
        options: [
          'An order that executes at a specific price',
          'An order that executes immediately at the best available price',
          'An order that never expires',
          'An order that only works during market hours'
        ],
        correctAnswer: 1,
        explanation: 'A market order executes immediately at the best available current market price.'
      },
      {
        id: '2',
        question: 'What does "going long" mean?',
        options: [
          'Holding a position for a long time',
          'Buying an asset expecting it to increase in value',
          'Selling an asset short',
          'Trading with high leverage'
        ],
        correctAnswer: 1,
        explanation: 'Going long means buying an asset with the expectation that its price will rise.'
      },
      {
        id: '3',
        question: 'What is a stop-loss order?',
        options: [
          'An order to buy at a lower price',
          'An order to sell when price reaches a certain level to limit losses',
          'An order that stops all trading',
          'An order to take profits'
        ],
        correctAnswer: 1,
        explanation: 'A stop-loss order automatically sells your position when the price falls to a specified level, helping to limit potential losses.'
      },
      {
        id: '4',
        question: 'What is liquidity in trading?',
        options: [
          'The amount of cash in your account',
          'How easily an asset can be bought or sold without affecting its price',
          'The total value of all assets',
          'The speed of order execution'
        ],
        correctAnswer: 1,
        explanation: 'Liquidity refers to how quickly and easily an asset can be converted to cash without significantly impacting its price.'
      },
      {
        id: '5',
        question: 'What is leverage in trading?',
        options: [
          'Using borrowed money to increase potential returns',
          'A type of technical indicator',
          'The difference between bid and ask price',
          'A trading strategy'
        ],
        correctAnswer: 0,
        explanation: 'Leverage allows traders to control larger positions with a smaller amount of capital by borrowing funds.'
      }
    ];
  }

  private getTechnicalQuestions(): Question[] {
    return [
      {
        id: '1',
        question: 'What does RSI (Relative Strength Index) measure?',
        options: [
          'Trading volume',
          'Price momentum and overbought/oversold conditions',
          'Market volatility',
          'Trend direction'
        ],
        correctAnswer: 1,
        explanation: 'RSI measures the speed and magnitude of price changes to identify overbought or oversold conditions.'
      },
      {
        id: '2',
        question: 'What is a bullish candlestick pattern?',
        options: [
          'A pattern indicating potential price decline',
          'A pattern indicating potential price increase',
          'A pattern with no predictive value',
          'A pattern only used in bear markets'
        ],
        correctAnswer: 1,
        explanation: 'Bullish candlestick patterns suggest potential upward price movement and buying opportunities.'
      },
      {
        id: '3',
        question: 'What do moving averages help identify?',
        options: [
          'Exact future prices',
          'Trends and potential support/resistance levels',
          'Trading volume',
          'Market sentiment only'
        ],
        correctAnswer: 1,
        explanation: 'Moving averages smooth out price data to help identify trends and key support/resistance levels.'
      }
    ];
  }

  private getRiskQuestions(): Question[] {
    return [
      {
        id: '1',
        question: 'What is the recommended maximum risk per trade?',
        options: [
          '1-2% of your total capital',
          '10-20% of your total capital',
          '50% of your total capital',
          'All of your available capital'
        ],
        correctAnswer: 0,
        explanation: 'Professional traders typically risk no more than 1-2% of their total capital on a single trade to preserve their trading account.'
      },
      {
        id: '2',
        question: 'What is portfolio diversification?',
        options: [
          'Investing all money in one asset',
          'Spreading investments across different assets to reduce risk',
          'Only trading one type of market',
          'Using maximum leverage'
        ],
        correctAnswer: 1,
        explanation: 'Diversification spreads risk across multiple assets so that poor performance in one doesn\'t devastate your entire portfolio.'
      }
    ];
  }
}