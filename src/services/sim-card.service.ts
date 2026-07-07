import { SimCard } from '../types/sim-card';
import { supabase } from '../utils/supabase';

export const getSimCards = async (): Promise<SimCard[]> => {
  const { data, error } = await supabase
    .from('sim_cards')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    phoneNumber: row.phone_number,
    personName: row.person_name,
    status: row.status,
    addedDate: row.added_date
  }));
};

export const addSimCard = async (simCard: SimCard): Promise<SimCard[]> => {
  const { error } = await supabase.from('sim_cards').insert({
    id: simCard.id,
    phone_number: simCard.phoneNumber,
    person_name: simCard.personName,
    status: simCard.status,
    added_date: simCard.addedDate
  });

  if (error) throw error;

  return getSimCards();
};

export const updateSimCardStatus = async (
  id: string,
  status: SimCard['status']
): Promise<SimCard[]> => {
  const { error } = await supabase
    .from('sim_cards')
    .update({ status })
    .eq('id', id);

  if (error) throw error;

  return getSimCards();
};

export const updateSimCard = async (
  id: string,
  updates: Partial<Omit<SimCard, 'id'>>
): Promise<SimCard[]> => {
  const { error } = await supabase
    .from('sim_cards')
    .update({
      phone_number: updates.phoneNumber,
      person_name: updates.personName,
      status: updates.status,
      added_date: updates.addedDate
    })
    .eq('id', id);

  if (error) throw error;

  return getSimCards();
};

export const deleteSimCard = async (
  id: string
): Promise<SimCard[]> => {
  console.log('Attempting to delete SIM card with id:', id);
  const { error } = await supabase
    .from('sim_cards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting SIM card:', error);
    throw error;
  }

  console.log('Successfully deleted SIM card');
  return getSimCards();
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
