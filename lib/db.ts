import { createClient } from '@supabase/supabase-js';
import { SimCard } from '../src/app/models/sim-card.model';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function ensureSimTable(): Promise<void> {
  // Table is created in Supabase dashboard via SQL Editor
  // We'll just make sure the client is initialized
  return;
}

export async function listSimCards(): Promise<SimCard[]> {
  const { data, error } = await supabase
    .from('sim_cards')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  // Map to our SimCard model
  return data.map(row => ({
    id: row.id,
    phoneNumber: row.phone_number,
    personName: row.person_name,
    status: row.status,
    addedDate: row.added_date
  }));
}

export async function insertSimCard(simCard: SimCard): Promise<SimCard[]> {
  const { error } = await supabase
    .from('sim_cards')
    .insert({
      id: simCard.id,
      phone_number: simCard.phoneNumber,
      person_name: simCard.personName,
      status: simCard.status,
      added_date: simCard.addedDate
    });

  if (error) {
    throw error;
  }

  return listSimCards();
}

export async function updateSimCardStatus(id: string, status: SimCard['status']): Promise<SimCard[]> {
  const { error } = await supabase
    .from('sim_cards')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw error;
  }

  return listSimCards();
}
