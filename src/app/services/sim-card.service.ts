import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SimCard } from '../models/sim-card.model';

@Injectable({
  providedIn: 'root'
})
export class SimCardService {
  private readonly apiUrl = '/api/sims';

  constructor(private http: HttpClient) { }

  async getSimCards(): Promise<SimCard[]> {
    return firstValueFrom(this.http.get<SimCard[]>(this.apiUrl));
  }

  async addSimCard(simCard: SimCard): Promise<SimCard[]> {
    return firstValueFrom(this.http.post<SimCard[]>(this.apiUrl, simCard));
  }

  async updateSimCardStatus(id: string, status: SimCard['status']): Promise<SimCard[]> {
    return firstValueFrom(this.http.patch<SimCard[]>(this.apiUrl, { id, status }));
  }

  getStats() {
    return this.getStatsFromCards([]);
  }

  getStatsFromCards(simCards: SimCard[]) {
    const total = simCards.length;
    const active = simCards.filter(s => s.status === 'Active').length;
    const deactivated = simCards.filter(s => s.status === 'Deactivated').length;
    const spam = simCards.filter(s => s.status === 'Spam').length;
    return { total, active, deactivated, spam };
  }
}
