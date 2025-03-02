export interface HistoricalEvent {
    id: string;
    description: string;
    year: number;
}

export interface QuizState {
    events: HistoricalEvent[];
    currentEventIndex: number;
    answers: Record<string, boolean>;
    isComplete: boolean;
}

export type DropZone = 'before' | 'during'; 