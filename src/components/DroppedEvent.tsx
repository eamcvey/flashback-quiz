import React from 'react';
import type { HistoricalEvent } from '../types';

interface DroppedEventProps {
    event: HistoricalEvent;
    isCorrect: boolean;
}

export default function DroppedEvent({ event, isCorrect }: DroppedEventProps) {
    return (
        <div
            className={`p-4 rounded-lg shadow-md mb-4 w-full transition-colors ${isCorrect ? 'border-2 border-green-500 bg-green-50' : 'border-2 border-red-500 bg-red-50'
                }`}
        >
            <p className="text-lg text-center">{event.description}</p>
            <p className="text-sm text-center mt-2 text-gray-600">({event.year})</p>
        </div>
    );
} 