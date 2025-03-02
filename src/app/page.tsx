'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { historicalEvents, GRANDPA_BIRTH_YEAR } from '../data/events';
import type { HistoricalEvent, QuizState, DropZone } from '../types';
import DroppedEvent from '../components/DroppedEvent';
import Image from 'next/image';

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

    const [isDragging, setIsDragging] = useState(false);
    const draggedPosition = useRef<{ x: number; y: number; scrollY: number } | null>(null);
    const currentEventRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastScrollTime = useRef<number>(0);
    const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);

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
        setIsDragging(false);
    }, [currentEvent, droppedEvents, quizState]);

    const handleScroll = useCallback((touch: { clientY: number }) => {
        const now = Date.now();
        if (now - lastScrollTime.current < 16) return; // Limit to ~60fps
        lastScrollTime.current = now;

        const SCROLL_THRESHOLD = 200;
        const MAX_SCROLL_SPEED = 15;
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - windowHeight;

        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
        }

        const getScrollSpeed = (distance: number) => {
            const normalizedDistance = Math.min(distance / SCROLL_THRESHOLD, 1);
            // Add easing function for smoother acceleration
            return Math.round(MAX_SCROLL_SPEED * (1 - Math.pow(normalizedDistance, 2)));
        };

        if (touch.clientY < SCROLL_THRESHOLD && scrollY > 0) {
            const speed = getScrollSpeed(touch.clientY);
            scrollIntervalRef.current = setInterval(() => {
                window.scrollBy({
                    top: -speed,
                    behavior: 'auto'
                });
                if (window.scrollY <= 0) {
                    clearInterval(scrollIntervalRef.current!);
                }
            }, 16);
        } else if (touch.clientY > windowHeight - SCROLL_THRESHOLD && scrollY < maxScroll) {
            const speed = getScrollSpeed(windowHeight - touch.clientY);
            scrollIntervalRef.current = setInterval(() => {
                window.scrollBy({
                    top: speed,
                    behavior: 'auto'
                });
                if (window.scrollY >= maxScroll) {
                    clearInterval(scrollIntervalRef.current!);
                }
            }, 16);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !currentEventRef.current || !draggedPosition.current) return;
        e.preventDefault();
        const touch = e.touches[0];

        // Calculate the total movement including scroll
        const deltaX = touch.clientX - draggedPosition.current.x;
        const deltaY = (touch.clientY - draggedPosition.current.y) +
            (window.scrollY - draggedPosition.current.scrollY);

        // Cancel any existing animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        // Schedule the transform update
        animationFrameRef.current = requestAnimationFrame(() => {
            if (currentEventRef.current) {
                currentEventRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
            }
            animationFrameRef.current = null;
        });

        // Handle scrolling
        handleScroll(touch);

        // Update active drop zone
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
        const beforeZone = elements.find(el => el.getAttribute('data-zone') === 'before');
        const duringZone = elements.find(el => el.getAttribute('data-zone') === 'during');

        setActiveDropZone(beforeZone ? 'before' : duringZone ? 'during' : null);
    }, [isDragging, handleScroll]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        draggedPosition.current = {
            x: touch.clientX,
            y: touch.clientY,
            scrollY: window.scrollY
        };
        setIsDragging(true);
    }, []);

    // Clean up animations and intervals on unmount
    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !currentEventRef.current) return;
        e.preventDefault();

        // Clear all animations and intervals
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const touch = e.changedTouches[0];
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

        // Reset the transform with a transition for smooth return
        currentEventRef.current.style.transition = 'transform 0.2s ease-out';
        currentEventRef.current.style.transform = '';

        // Remove the transition after it completes
        setTimeout(() => {
            if (currentEventRef.current) {
                currentEventRef.current.style.transition = '';
            }
        }, 200);

        // Check if we're over a drop zone
        const beforeZone = elements.find(el => el.getAttribute('data-zone') === 'before');
        const duringZone = elements.find(el => el.getAttribute('data-zone') === 'during');

        if (beforeZone) {
            handleDrop('before');
        } else if (duringZone) {
            handleDrop('during');
        }

        setIsDragging(false);
        setActiveDropZone(null);
        draggedPosition.current = null;
    }, [isDragging, handleDrop]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const createShareText = useCallback(() => {
        const allResults = [...droppedEvents.before, ...droppedEvents.during]
            .sort((a, b) => parseInt(a.event.id) - parseInt(b.event.id));

        const resultEmojis = allResults.map(item => item.isCorrect ? '🟩' : '🟥').join('');
        const totalCorrect = allResults.filter(item => item.isCorrect).length;

        return `I completed Grandpa's Birthday Flashback Quiz!\n${resultEmojis}\n${totalCorrect}/${historicalEvents.length} correct!\nCan you beat my score?\nhttps://flashback-quiz.vercel.app`;
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
            <div className="min-h-screen flex flex-col items-center p-4 bg-stone-100">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full mb-8">
                    <h2 className="text-2xl font-bold mb-4 font-fredoka text-stone-800">Quiz Complete!</h2>
                    <p className="text-lg mb-4 font-outfit text-stone-700">
                        You got {totalCorrect} out of {quizState.events.length} correct!
                    </p>
                    <button
                        onClick={shareResults}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-outfit"
                    >
                        Share Results
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold mb-4 text-center font-fredoka text-stone-800">Before Grandpa was born</h3>
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
                        <h3 className="text-lg font-semibold mb-4 text-center font-fredoka text-stone-800">In Grandpa's lifetime</h3>
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
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-100">
            <h1 className="text-3xl font-bold mb-8 text-center text-stone-800 font-fredoka">Grandpa's Birthday Flashback Quiz 🎂</h1>

            {currentEvent && !quizState.answers[currentEvent.id] && (
                <>
                    <p className="text-lg text-center mb-4 text-stone-700 font-outfit">Drag this event into the correct Grandpa Era!</p>
                    <div
                        ref={currentEventRef}
                        draggable
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`bg-white p-4 rounded-lg shadow-md mb-4 w-full max-w-sm touch-manipulation cursor-move transition-transform hover:shadow-lg select-none font-outfit ${isDragging ? 'z-50 shadow-xl' : ''
                            }`}
                        style={{ touchAction: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                    >
                        <p className="text-lg text-center select-none text-stone-700">{currentEvent.description}</p>
                    </div>
                    <p className="text-stone-500 font-outfit mb-8">
                        Event {quizState.currentEventIndex + 1} of {quizState.events.length}
                    </p>
                </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div
                    data-zone="before"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop('before')}
                    className={`border-4 ${activeDropZone === 'before' ? 'border-solid border-stone-600' : 'border-dashed border-stone-300'} p-4 rounded-lg min-h-[200px] flex flex-col items-center bg-white transition-all duration-200`}
                >
                    <p className="text-center text-lg font-medium mb-4 font-fredoka text-stone-800">
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
                    data-zone="during"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop('during')}
                    className={`border-4 ${activeDropZone === 'during' ? 'border-solid border-stone-600' : 'border-dashed border-stone-300'} p-4 rounded-lg min-h-[200px] flex flex-col items-center bg-white transition-all duration-200`}
                >
                    <p className="text-center text-lg font-medium mb-4 font-fredoka text-stone-800">
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
        </div>
    );
} 