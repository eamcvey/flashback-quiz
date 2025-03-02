'use client';

import React from 'react';
import { useState, useCallback } from 'react';
import { historicalEvents, GRANDPA_BIRTH_YEAR } from '../data/events';
import type { HistoricalEvent, QuizState, DropZone } from '../types';
import DroppedEvent from '../components/DroppedEvent';

export default function Home() {
    const [quizState, setQuizState] = useState<QuizState>({
        events: historicalEvents,
        currentEventIndex: 0,
        answers: {},
        isComplete: false,
    });

    const [droppedEvents, setDroppedEvents] = useState<{
        before: { event: HistoricalEvent; isCorrect: boolean }[];
        during: { event: HistoricalEvent; isCorrect: boolean }[];
    }>({
        before: [],
        during: [],
    });

    const currentEvent = quizState.events[quizState.currentEventIndex];
    const totalCorrect = Object.values(quizState.answers).filter(Boolean).length;

    const handleDrop = useCallback((zone: DropZone) => {
        if (!currentEvent) return;

        const isCorrect =
            (zone === 'before' && currentEvent.year < GRANDPA_BIRTH_YEAR) ||
            (zone === 'during' && currentEvent.year >= GRANDPA_BIRTH_YEAR);

        const newDroppedEvents = {
            ...droppedEvents,
            [zone]: [...droppedEvents[zone], { event: currentEvent, isCorrect }],
        };

        const newAnswers = {
            ...quizState.answers,
            [currentEvent.id]: isCorrect,
        };

        const newIndex = quizState.currentEventIndex + 1;
        const isComplete = newIndex === quizState.events.length;

        setDroppedEvents(newDroppedEvents);
        setQuizState({
            ...quizState,
            answers: newAnswers,
            currentEventIndex: newIndex,
            isComplete,
        });
    }, [currentEvent, droppedEvents, quizState]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const createShareText = useCallback(() => {
        // Combine both arrays and sort by event ID to get chronological order
        const allResults = [...droppedEvents.before, ...droppedEvents.during]
            .sort((a, b) => parseInt(a.event.id) - parseInt(b.event.id));

        const resultEmojis = allResults.map(item => item.isCorrect ? '🟩' : '🟥').join('');
        const totalCorrect = allResults.filter(item => item.isCorrect).length;

        return `I completed Grandpa's Birthday Flashback Quiz!\n${resultEmojis}\n${totalCorrect}/${historicalEvents.length} correct!\nCan you beat my score?`;
    }, [droppedEvents]);

    const shareResults = useCallback(() => {
        const text = createShareText();
        if (navigator.share) {
            navigator.share({
                text: text,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert('Results copied to clipboard!');
        }
    }, [createShareText]);

    if (quizState.isComplete) {
        return (
            <div className="min-h-screen flex flex-col items-center p-4 bg-gray-100">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full mb-8">
                    <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
                    <p className="text-lg mb-4">
                        You got {totalCorrect} out of {quizState.events.length} correct!
                    </p>
                    <button
                        onClick={shareResults}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Share Results
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold mb-4 text-center">Before Grandpa was born</h3>
                        <div className="space-y-4">
                            {droppedEvents.before.map((item) => (
                                <DroppedEvent
                                    key={item.event.id}
                                    event={item.event}
                                    isCorrect={item.isCorrect}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold mb-4 text-center">In Grandpa's lifetime</h3>
                        <div className="space-y-4">
                            {droppedEvents.during.map((item) => (
                                <DroppedEvent
                                    key={item.event.id}
                                    event={item.event}
                                    isCorrect={item.isCorrect}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
            <h1 className="text-2xl font-bold mb-8 text-center">Flashback Quiz</h1>

            {currentEvent && !quizState.answers[currentEvent.id] && (
                <div
                    draggable
                    className="bg-white p-4 rounded-lg shadow-md mb-8 w-full max-w-sm touch-manipulation cursor-move"
                >
                    <p className="text-lg text-center">{currentEvent.description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop('before')}
                    className="border-4 border-dashed p-4 rounded-lg min-h-[200px] flex flex-col items-center bg-white"
                >
                    <p className="text-center text-lg font-medium mb-4">
                        Before Grandpa was born
                    </p>
                    {droppedEvents.before.map((item) => (
                        <DroppedEvent
                            key={item.event.id}
                            event={item.event}
                            isCorrect={item.isCorrect}
                        />
                    ))}
                </div>

                <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop('during')}
                    className="border-4 border-dashed p-4 rounded-lg min-h-[200px] flex flex-col items-center bg-white"
                >
                    <p className="text-center text-lg font-medium mb-4">
                        In Grandpa's lifetime
                    </p>
                    {droppedEvents.during.map((item) => (
                        <DroppedEvent
                            key={item.event.id}
                            event={item.event}
                            isCorrect={item.isCorrect}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-gray-600">
                    Event {quizState.currentEventIndex + 1} of {quizState.events.length}
                </p>
            </div>
        </div>
    );
} 