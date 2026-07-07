import { SimCard } from '../types/sim-card';

const API_URL = '/api/sims';

export const getSimCards = async (): Promise<SimCard[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error('Failed to fetch SIM cards');
  }
  return res.json();
};

export const addSimCard = async (simCard: SimCard): Promise<SimCard[]> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(simCard),
  });
  if (!res.ok) {
    throw new Error('Failed to add SIM card');
  }
  return res.json();
};

export const updateSimCardStatus = async (
  id: string,
  status: SimCard['status']
): Promise<SimCard[]> => {
  const res = await fetch(API_URL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) {
    throw new Error('Failed to update SIM status');
  }
  return res.json();
};

export const getStatsFromCards = (
  simCards: SimCard[]
): { total: number; active: number; deactivated: number; spam: number } => {
  const total = simCards.length;
  const active = simCards.filter(s => s.status === 'Active').length;
  const deactivated = simCards.filter(s => s.status === 'Deactivated').length;
  const spam = simCards.filter(s => s.status === 'Spam').length;
  return { total, active, deactivated, spam };
};
