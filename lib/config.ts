export const BOARD_MEMBERS = [
  { name: 'James', email: 'james@proverbs31landsphere.com' },
  { name: 'Jayda', email: 'mrsjaydaflores@gmail.com' },
  { name: 'Lawanda', email: 'lawanda@proverbs31landsphere.com' }
];

export const APPROVALS_REQUIRED = 2;

export function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getApproversForBuyer(buyerEmail: string) {
  const normalizedBuyer = normalizeEmail(buyerEmail);
  const buyerIsBoardMember = BOARD_MEMBERS.some(
    member => normalizeEmail(member.email) === normalizedBuyer
  );

  if (!buyerIsBoardMember) {
    return BOARD_MEMBERS;
  }

  return BOARD_MEMBERS.filter(member => normalizeEmail(member.email) !== normalizedBuyer);
}
