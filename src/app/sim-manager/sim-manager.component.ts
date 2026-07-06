import { Component, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SimCard } from '../models/sim-card.model';
import { SimCardService } from '../services/sim-card.service';

@Component({
  selector: 'app-sim-manager',
  templateUrl: './sim-manager.component.html',
  styleUrls: ['./sim-manager.component.scss']
})
export class SimManagerComponent implements OnInit {
  simCards: SimCard[] = [];
  filteredSimCards: SimCard[] = [];
  searchQuery = '';
  activeFilter: 'all' | 'Active' | 'Deactivated' | 'Spam' = 'all';
  isLoading = false;
  pageError = '';
  statusMenuOpenId: string | null = null;
  readonly statusOptions: Array<'Active' | 'Deactivated' | 'Spam'> = ['Active', 'Deactivated', 'Spam'];
  showAddSimModal = false;
  addSimError = '';
  newSimForm: { id: string; phoneNumber: string; personName: string; status: SimCard['status'] } = this.createEmptySimForm();
  stats: { total: number; active: number; deactivated: number; spam: number } = { total: 0, active: 0, deactivated: 0, spam: 0 };
  showPersonalize = false;
  orgName = 'EduConnect';
  accentColors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#374151'];
  selectedColor = '#667eea';

  constructor(private simCardService: SimCardService, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.applyAccentColor();
    void this.loadSimCards();
  }

  filterByStatus(status: 'all' | 'Active' | 'Deactivated' | 'Spam'): void {
    this.activeFilter = status;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.simCards];
    
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(sim => sim.status === this.activeFilter);
    }
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(sim => 
        sim.id.toLowerCase().includes(query) ||
        sim.phoneNumber.includes(query) ||
        sim.personName.toLowerCase().includes(query)
      );
    }
    
    this.filteredSimCards = filtered;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  isStatusMenuOpen(simId: string): boolean {
    return this.statusMenuOpenId === simId;
  }

  toggleStatusMenu(simId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.statusMenuOpenId = this.statusMenuOpenId === simId ? null : simId;
  }

  onStatusMenuClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:click')
  closeStatusMenu(): void {
    this.statusMenuOpenId = null;
  }

  openAddSimModal(): void {
    this.showAddSimModal = true;
    this.addSimError = '';
  }

  closeAddSimModal(): void {
    this.showAddSimModal = false;
    this.addSimError = '';
    this.newSimForm = this.createEmptySimForm();
  }

  async submitAddSim(): Promise<void> {
    const id = this.newSimForm.id.trim();
    const phoneNumber = this.newSimForm.phoneNumber.trim();
    const personName = this.newSimForm.personName.trim();

    if (!id || !phoneNumber || !personName) {
      this.addSimError = 'Enter a SIM ID, phone number, and assigned person.';
      return;
    }

    const duplicateId = this.simCards.some((sim) => sim.id.toLowerCase() === id.toLowerCase());
    if (duplicateId) {
      this.addSimError = 'That SIM ID already exists.';
      return;
    }

    const createdSim: SimCard = {
      id,
      phoneNumber,
      personName,
      status: this.newSimForm.status,
      addedDate: new Date().toISOString().slice(0, 10)
    };

    try {
      this.simCards = await this.simCardService.addSimCard(createdSim);
      this.pageError = '';
      this.applyFilters();
      this.updateStats();
      this.closeAddSimModal();
    } catch {
      this.addSimError = 'Unable to save the SIM right now.';
    }
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.applyAccentColor();
  }

  applyAccentColor(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.style.setProperty('--accent-color', this.selectedColor);
      document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${this.selectedColor} 0%, ${this.adjustColor(this.selectedColor, -20)} 100%)`);
    }
  }

  adjustColor(color: string, amount: number): string {
    let usePound = false;
    if (color[0] === "#") {
        color = color.slice(1);
        usePound = true;
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amount;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + ((g | (b << 8) | (r << 16))).toString(16).padStart(6, '0');
  }

  updateStats(): void {
    this.stats = this.simCardService.getStatsFromCards(this.simCards);
  }

  async updateSimStatus(sim: SimCard, newStatus: 'Active' | 'Deactivated' | 'Spam'): Promise<void> {
    try {
      this.simCards = await this.simCardService.updateSimCardStatus(sim.id, newStatus);
      this.pageError = '';
      this.statusMenuOpenId = null;
      this.updateStats();
      this.applyFilters();
    } catch {
      this.pageError = 'Unable to update the SIM status right now.';
    }
  }

  private createEmptySimForm(): { id: string; phoneNumber: string; personName: string; status: SimCard['status'] } {
    return {
      id: '',
      phoneNumber: '',
      personName: '',
      status: 'Active'
    };
  }

  private async loadSimCards(): Promise<void> {
    this.isLoading = true;
    this.pageError = '';

    try {
      this.simCards = await this.simCardService.getSimCards();
      this.applyFilters();
      this.updateStats();
    } catch {
      this.pageError = 'Unable to load SIM data. Start the Vercel API or configure Vercel Postgres.';
    } finally {
      this.isLoading = false;
    }
  }
}
