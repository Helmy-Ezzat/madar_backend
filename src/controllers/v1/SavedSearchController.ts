import { Request, Response } from 'express';
import { SavedSearchService, SavedSearchLimitError } from '../../services/SavedSearchService.js';

// GET /api/v1/saved-searches
export const getSavedSearches = async (req: Request, res: Response): Promise<void> => {
    try {
        const searches = await SavedSearchService.list(req.user!.uid);
        res.json({ success: true, data: searches });
    } catch (error) {
        console.error('Error fetching saved searches:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch saved searches.' });
    }
};

// POST /api/v1/saved-searches
export const createSavedSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { country, specialization, query } = req.body ?? {};
        const search = await SavedSearchService.create(req.user!.uid, { country, specialization, query });
        res.status(201).json({ success: true, data: search });
    } catch (error) {
        if (error instanceof SavedSearchLimitError) {
            res.status(400).json({ success: false, error: 'وصلت للحد الأقصى من عمليات البحث المحفوظة (10).' });
            return;
        }
        // Duplicate search (unique index)
        if ((error as { code?: number }).code === 11000) {
            res.status(409).json({ success: false, error: 'هذا البحث محفوظ بالفعل.' });
            return;
        }
        console.error('Error creating saved search:', error);
        res.status(500).json({ success: false, error: 'Failed to create saved search.' });
    }
};

// DELETE /api/v1/saved-searches/:id
export const deleteSavedSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await SavedSearchService.remove(req.user!.uid, String(req.params.id));
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error deleting saved search:', error);
        res.status(500).json({ success: false, error: 'Failed to delete saved search.' });
    }
};
