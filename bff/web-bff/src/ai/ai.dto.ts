export interface AiChatBody {
  message: string;
  context: string;
  voice?: string;
}

export interface AiTelegramBody {
  message: string;
}

export interface AiSpeakBody {
  text: string;
  voice?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
}

export interface AiResponseDto {
  text: string;
  action: string;
  params?: Record<string, unknown>;
  searchResults?: SearchResultItem[];
  mapResults?: unknown[];
}