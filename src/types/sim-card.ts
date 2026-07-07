export interface SimCard {
  id: string;
  phoneNumber: string;
  personName: string;
  status: 'Active' | 'Deactivated' | 'Spam';
  addedDate: string;
}
