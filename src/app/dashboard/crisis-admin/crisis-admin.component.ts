import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CrisisSimulatorServiceService } from '../../services/crisis-simulator.service.service';
import * as CrisisTypes from '../crisis-simulator/crisis-simulator.interfaces';

interface SimulationListItem {
  id: number;
  crisis_type: string;
  status: string;
  participant_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_minutes: number;
  max_participants: number;
  is_competitive: boolean;
}

interface SimulationHistoryItem {
  id: number;
  crisis_type: string;
  status: string;
  participant_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_minutes: number;
  max_participants: number;
  is_competitive: boolean;
  created_by: number;
}

interface SimulationStats {
  simulation_id: number;
  crisis_type: string;
  status: string;
  total_participants: number;
  active_participants: number;
  total_trades: number;
  average_return_pct: number;
  max_return_pct: number;
  min_return_pct: number;
  duration_minutes: number;
  elapsed_minutes: number;
}

@Component({
  selector: 'app-crisis-admin',
  templateUrl: './crisis-admin.component.html',
  styleUrls: ['./crisis-admin.component.css']
})
export class CrisisAdminComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  // Data
  simulations: SimulationHistoryItem[] = [];
  crisisTypes: CrisisTypes.CrisisTypeInfo[] = [];
  allParticipants: CrisisTypes.Participant[] = [];
  simulationStats: SimulationStats | null = null;
  
  // UI State
  activeView: 'overview' | 'history' | 'create' | 'analytics' = 'overview';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  selectedSimulationId: number | null = null;

  // Filters
  statusFilter: string = '';
  crisisTypeFilter: string = '';
  limit: number = 10;
  offset: number = 0;

  // Create Simulation Form
  createForm = {
    crisis_type: '',
    max_participants: 50,
    is_competitive: false
  };

  // Stats
  totalSimulations = 0;
  activeSimulations = 0;
  totalParticipants = 0;
  completedSimulations = 0;

  constructor(public crisisService: CrisisSimulatorServiceService) {}

  ngOnInit() {
    this.loadCrisisTypes();
    this.loadSimulationHistory();
    this.loadActiveSimulation();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadActiveSimulation() {
    this.crisisService.getActiveSimulation().subscribe({
      next: (simulation) => {
        if (simulation) {
          this.selectedSimulationId = simulation.id;
          this.loadSimulationStats(simulation.id);
          this.loadParticipants(simulation.id);
        }
      },
      error: (error) => {
        console.error('Error loading active simulation:', error);
      }
    });
  }

  loadSimulationHistory() {
    this.isLoading = true;
    this.crisisService.getSimulationHistory(this.limit, this.offset, this.statusFilter, this.crisisTypeFilter)
      .subscribe({
        next: (history) => {
          this.simulations = history;
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading simulation history:', error);
          this.errorMessage = 'Failed to load simulation history';
          this.isLoading = false;
        }
      });
  }

  loadCrisisTypes() {
    this.crisisService.getCrisisTypes().subscribe({
      next: (types) => {
        this.crisisTypes = types;
        if (types.length > 0 && !this.createForm.crisis_type) {
          this.createForm.crisis_type = types[0].type;
        }
      },
      error: (error) => {
        console.error('Error loading crisis types:', error);
        this.errorMessage = 'Failed to load crisis types';
      }
    });
  }

  loadParticipants(simulationId?: number) {
    this.crisisService.getParticipants(simulationId).subscribe({
      next: (participants) => {
        this.allParticipants = participants;
        this.totalParticipants = participants.length;
      },
      error: (error) => {
        console.error('Error loading participants:', error);
      }
    });
  }

  loadSimulationStats(simulationId: number) {
    this.crisisService.getSimulationStats(simulationId).subscribe({
      next: (stats) => {
        this.simulationStats = stats;
      },
      error: (error) => {
        console.error('Error loading simulation stats:', error);
      }
    });
  }

  calculateStats() {
    this.totalSimulations = this.simulations.length;
    this.activeSimulations = this.simulations.filter(s => 
      s.status === 'active' || s.status === 'ACTIVE' || 
      s.status === 'pending' || s.status === 'PENDING'
    ).length;
    this.completedSimulations = this.simulations.filter(s => 
      s.status === 'completed' || s.status === 'COMPLETED'
    ).length;
  }

  // ============================================================================
  // SIMULATION MANAGEMENT
  // ============================================================================

  createSimulation() {
    if (!this.validateCreateForm()) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    this.crisisService.createSimulation(
      this.createForm.crisis_type,
      this.createForm.max_participants,
      this.createForm.is_competitive
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Simulation created successfully!';
        this.resetCreateForm();
        this.loadSimulationHistory();
        this.loadActiveSimulation();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Failed to create simulation';
        console.error('Error creating simulation:', error);
      }
    });
  }

  validateCreateForm(): boolean {
    if (!this.createForm.crisis_type) {
      this.errorMessage = 'Please select a crisis type';
      return false;
    }
    if (this.createForm.max_participants < 1 || this.createForm.max_participants > 1000) {
      this.errorMessage = 'Max participants must be between 1 and 1000';
      return false;
    }
    return true;
  }

  resetCreateForm() {
    this.createForm = {
      crisis_type: this.crisisTypes[0]?.type || '',
      max_participants: 50,
      is_competitive: false
    };
  }

  startSimulation(simulationId: number) {
    if (!confirm('Start this simulation now? Participants will no longer be able to join.')) return;

    this.isLoading = true;
    this.crisisService.startSimulation(simulationId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Simulation started successfully!';
        this.loadSimulationHistory();
        this.loadActiveSimulation();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Failed to start simulation';
        console.error('Error starting simulation:', error);
      }
    });
  }

  stopSimulation(simulationId: number) {
    if (!confirm('Stop this simulation immediately? This will finalize rankings and cannot be undone.')) return;

    this.isLoading = true;
    this.crisisService.stopSimulation(simulationId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Simulation stopped successfully!';
        this.loadSimulationHistory();
        this.loadActiveSimulation();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Failed to stop simulation';
        console.error('Error stopping simulation:', error);
      }
    });
  }

  pauseSimulation(simulationId: number) {
    if (!confirm('Pause this simulation?')) return;

    this.isLoading = true;
    this.crisisService.pauseSimulation(simulationId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Simulation paused successfully!';
        this.loadSimulationHistory();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Failed to pause simulation';
        console.error('Error pausing simulation:', error);
      }
    });
  }

  resumeSimulation(simulationId: number) {
    if (!confirm('Resume this simulation?')) return;

    this.isLoading = true;
    this.crisisService.resumeSimulation(simulationId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Simulation resumed successfully!';
        this.loadSimulationHistory();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Failed to resume simulation';
        console.error('Error resuming simulation:', error);
      }
    });
  }

  deleteSimulation(simulationId: number) {
    if (!confirm('Delete this simulation? This action cannot be undone.')) return;

    this.isLoading = true;
    this.crisisService.deleteSimulation(simulationId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Simulation deleted successfully!';
        this.loadSimulationHistory();
        this.loadActiveSimulation();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Failed to delete simulation';
        console.error('Error deleting simulation:', error);
      }
    });
  }

  selectSimulation(simulationId: number) {
    this.selectedSimulationId = simulationId;
    this.loadSimulationStats(simulationId);
    this.loadParticipants(simulationId);
    this.activeView = 'analytics';
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  setView(view: 'overview' | 'history' | 'create' | 'analytics') {
    this.activeView = view;
    if (view === 'history') {
      this.loadSimulationHistory();
    } else if (view === 'overview') {
      this.loadActiveSimulation();
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': '#f59e0b',
      'PENDING': '#f59e0b',
      'active': '#10b981',
      'ACTIVE': '#10b981',
      'paused': '#f59e0b',
      'PAUSED': '#f59e0b',
      'completed': '#3b82f6',
      'COMPLETED': '#3b82f6',
      'cancelled': '#6b7280',
      'CANCELLED': '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'PENDING': 'Pending',
      'active': 'Active',
      'ACTIVE': 'Active',
      'paused': 'Paused',
      'PAUSED': 'Paused',
      'completed': 'Completed',
      'COMPLETED': 'Completed',
      'cancelled': 'Cancelled',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getFilteredSimulations(): SimulationHistoryItem[] {
    let filtered = this.simulations;

    if (this.statusFilter) {
      filtered = filtered.filter(s => 
        s.status.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }

    if (this.crisisTypeFilter) {
      filtered = filtered.filter(s => s.crisis_type === this.crisisTypeFilter);
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getCrisisTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'great_depression': '📉',
      'black_monday': '⚫',
      'dotcom_bubble': '💻',
      'financial_crisis_2008': '🏦',
      'covid_crash': '🦠',
      'asian_financial_crisis': '🌏',
      'european_debt_crisis': '🇪🇺'
    };
    return icons[type] || '📊';
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return this.crisisService.formatDate(dateString);
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return this.crisisService.formatDateTime(dateString);
  }

  formatPercentage(value: number): string {
    return this.crisisService.formatPercentage(value);
  }

  exportSimulationData(simulationId: number) {
    // Export simulation data as CSV/JSON
    this.successMessage = 'Export functionality coming soon!';
    setTimeout(() => this.successMessage = '', 3000);
  }

  getSelectedCrisisType(): CrisisTypes.CrisisTypeInfo | undefined {
    return this.crisisTypes.find(t => t.type === this.createForm.crisis_type);
  }

  refreshData() {
    this.loadSimulationHistory();
    this.loadActiveSimulation();
    this.successMessage = 'Data refreshed!';
    setTimeout(() => this.successMessage = '', 2000);
  }

  clearFilters() {
    this.statusFilter = '';
    this.crisisTypeFilter = '';
    this.loadSimulationHistory();
  }
}