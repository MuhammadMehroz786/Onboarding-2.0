'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    CheckCircle,
    Clock,
    Plus,
    Trash2,
    Sparkles,
    Calendar,
    Edit2,
    X,
    Save
} from 'lucide-react';

interface Milestone {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    completed: boolean;
    completedAt?: string;
    aiSuggested: boolean;
    displayOrder: number;
    createdAt: string;
}

interface MilestoneManagerProps {
    clientId: string;
    companyName: string;
}

export function MilestoneManager({ clientId, companyName }: MilestoneManagerProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [suggesting, setSuggesting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
    });

    useEffect(() => {
        fetchMilestones();
    }, [clientId]);

    const fetchMilestones = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/milestones?clientId=${clientId}`);
            const data = await response.json();
            if (data.success) {
                setMilestones(data.milestones);
            }
        } catch (error) {
            console.error('Error fetching milestones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestMilestones = async () => {
        try {
            setSuggesting(true);
            const response = await fetch('/api/admin/milestones/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId }),
            });

            const data = await response.json();
            if (data.success && data.suggestions) {
                // Create milestones from suggestions
                for (const suggestion of data.suggestions) {
                    await fetch('/api/admin/milestones', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientId,
                            title: suggestion.title,
                            description: suggestion.description,
                            dueDate: suggestion.dueDate,
                            aiSuggested: true,
                        }),
                    });
                }
                await fetchMilestones();
            }
        } catch (error) {
            console.error('Error suggesting milestones:', error);
        } finally {
            setSuggesting(false);
        }
    };

    const handleAddMilestone = async () => {
        if (!formData.title.trim()) return;

        try {
            const response = await fetch('/api/admin/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    ...formData,
                }),
            });

            if (response.ok) {
                setFormData({ title: '', description: '', dueDate: '' });
                setShowAddForm(false);
                await fetchMilestones();
            }
        } catch (error) {
            console.error('Error adding milestone:', error);
        }
    };

    const handleToggleComplete = async (milestone: Milestone) => {
        try {
            await fetch('/api/admin/milestones', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: milestone.id,
                    completed: !milestone.completed,
                }),
            });
            await fetchMilestones();
        } catch (error) {
            console.error('Error toggling milestone:', error);
        }
    };

    const handleDeleteMilestone = async (milestoneId: string) => {
        if (!confirm('Delete this milestone?')) return;

        try {
            await fetch(`/api/admin/milestones?id=${milestoneId}`, {
                method: 'DELETE',
            });
            await fetchMilestones();
        } catch (error) {
            console.error('Error deleting milestone:', error);
        }
    };

    const completedCount = milestones.filter(m => m.completed).length;
    const totalCount = milestones.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                        Milestones & Progress
                    </h3>
                    {totalCount > 0 && (
                        <p className="text-sm text-slate-600 mt-1">
                            {completedCount} of {totalCount} completed ({progressPercentage}%)
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {milestones.length === 0 && (
                        <Button
                            onClick={handleSuggestMilestones}
                            disabled={suggesting}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center gap-2"
                        >
                            {suggesting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    AI Suggest Milestones
                                </>
                            )}
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Milestone
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
                <div className="mb-6">
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Add Milestone Form */}
            {showAddForm && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-indigo-200">
                    <h4 className="font-medium text-slate-900 mb-3">New Milestone</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Complete brand assets upload"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={2}
                                placeholder="Additional details..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                onClick={handleAddMilestone}
                                disabled={!formData.title.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Milestone
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setFormData({ title: '', description: '', dueDate: '' });
                                }}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Milestones List */}
            {milestones.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="font-medium">No milestones yet</p>
                    <p className="text-sm mt-1">
                        Use AI to suggest milestones or add manually
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {milestones.map((milestone) => (
                        <div
                            key={milestone.id}
                            className={`p-4 rounded-lg border-2 transition-all ${milestone.completed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => handleToggleComplete(milestone)}
                                    className="flex-shrink-0 mt-0.5"
                                >
                                    {milestone.completed ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-600"></div>
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4
                                                className={`font-medium ${milestone.completed ? 'text-green-900 line-through' : 'text-slate-900'
                                                    }`}
                                            >
                                                {milestone.title}
                                                {milestone.aiSuggested && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        AI
                                                    </span>
                                                )}
                                            </h4>
                                            {milestone.description && (
                                                <p className="text-sm text-slate-600 mt-1">{milestone.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                {milestone.dueDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {milestone.completedAt && (
                                                    <span className="text-green-600">
                                                        ✓ Completed {new Date(milestone.completedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteMilestone(milestone.id)}
                                            className="text-red-600 hover:text-red-700 p-1"
                                            title="Delete milestone"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
