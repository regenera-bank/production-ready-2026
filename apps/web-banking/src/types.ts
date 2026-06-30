
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type ModuleId = 
  | 'home' 
  | 'pix' 
  | 'transfer' 
  | 'payment' 
  | 'transactions' 
  | 'cards' 
  | 'profile' 
  | 'savings' 
  | 'investments' 
  | 'crypto' 
  | 'loans' 
  | 'insurance' 
  | 'rewards' 
  | 'support' 
  | 'kids-account' 
  | 'pet-savings' 
  | 'realizar' 
  | 'marketplace' 
  | 'chat-ai'
  | 'travel'
  | 'statement-insights'
  | 'manifesto';

export interface UserProfile {
  name: string;
  balance: number;
  availableBalance: number;
  /** Ledger-safe available balance from BFF (cent string). */
  availableBalanceCents?: string;
  document?: string;
  agency?: string;
  accountNumber?: string;
  memberSince?: string;
}

export interface Transaction {
  id: string;
  title: string;
  party: string;
  date: string;
  amount: number;
  type: 'inflow' | 'outflow';
  icon: string;
  category: 'lifestyle' | 'essential' | 'transport' | 'leisure' | 'investment';
  channel?: 'pix' | 'transfer' | 'seed';
}

export interface BankingModuleProps {
  user: UserProfile;
  transactions: Transaction[];
  accessToken: string;
  onNavigate: (module: ModuleId) => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface CardDetails {
    id: string;
    alias: string;
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
    limit: number;
    used: number;
    brand: 'mastercard' | 'visa';
    type: 'black' | 'infinite' | 'platinum';
    status: 'active' | 'locked';
}

export interface CryptoAsset {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    balance: number;
    icon: unknown;
}

export interface Contact {
    id: string;
    name: string;
    key: string;
    bank: string;
    agency?: string;
    account?: string;
    cpf?: string;
    avatar?: string;
}

export interface PixKey {
    id: string;
    type: 'cpf' | 'email' | 'phone' | 'random';
    key: string;
    createdAt: string;
}

export interface SearchResultItem {
    title: string;
    url: string;
}

export interface MapLocation {
    name: string;
    rating?: number;
    address?: string;
    status?: string;
    coordinates?: { lat: number, lng: number };
    placeId?: string;
}

export interface AiResponse {
    text: string;
    action?: 'navigate' | 'pix_send' | 'pix_receive' | 'transfer_send' | 'show_balance' | 'toggle_balance' | 'block_card' | 'invest_suggestion' | 'map_search' | 'market_check' | 'fraud_scan' | 'send_telegram' | 'send_email' | 'manage_cloud' | 'change_theme' | 'search_transactions' | 'statement_insights' | 'manifesto' | 'none';
    params?: Record<string, unknown>;
    searchResults?: SearchResultItem[];
    mapResults?: MapLocation[];
}

export type OrbTheme = 'cyan' | 'purple' | 'emerald' | 'amber' | 'crimson';

export interface AiSettings {
    voice: string;
    style: 'formal' | 'casual' | 'concise';
    orbTheme: OrbTheme;
    telegramToken: string;
    telegramChatId: string;
    googleCloudToken: string;
}