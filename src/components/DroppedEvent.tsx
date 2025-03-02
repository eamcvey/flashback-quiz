import React from 'react';
import type { HistoricalEvent } from '../types';

interface DroppedEventProps {
    event: HistoricalEvent;
    isCorrect: boolean;
}

export default function DroppedEvent({ event, isCorrect }: DroppedEventProps) {
    return (
        <div
            className={`p-4 rounded-lg shadow-md mb-4 w-full transition-colors ${isCorrect
                    ? 'border-2 border-emerald-600 bg-emerald-50/70'
                    : 'border-2 border-rose-400 bg-rose-50/70'
                }`}
        >
            <p className="text-lg text-center font-outfit text-stone-700">{event.description}</p>
            <p className="text-sm text-center mt-2 text-stone-500 font-outfit">({event.year})</p>
        </div>
    );
} 