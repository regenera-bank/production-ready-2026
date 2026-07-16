export interface AssistantChatBody {
  message: string;
  context: string;
  voice?: string;
}

export interface AssistantTelegramBody {
  message: string;
}

export interface AssistantSpeakBody {
  text: string;
  voice?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
}

export interface AssistantResponseDto {
  text: string;
  action: string;
  params?: Record<string, unknown>;
  searchResults?: SearchResultItem[];
  mapResults?: unknown[];
}