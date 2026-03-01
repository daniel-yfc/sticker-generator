import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    AlertCircle: () => <svg data-testid="alert-icon" />,
    ArrowRight: () => <svg data-testid="arrow-right-icon" />,
    Layers: () => <svg data-testid="layers-icon" />,
    Sticker: () => <svg data-testid="sticker-icon" />,
    RefreshCw: () => <svg data-testid="refresh-cw-icon" />,
    Sparkles: () => <svg data-testid="sparkles-icon" />,
    Download: () => <svg data-testid="download-icon" />,
    Repeat: () => <svg data-testid="repeat-icon" />,
    Check: () => <svg data-testid="check-icon" />,
    Wand2: () => <svg data-testid="wand2-icon" />,
    Trash2: () => <svg data-testid="trash2-icon" />,
    Upload: () => <svg data-testid="upload-icon" />,
    Image: () => <svg data-testid="image-icon" />,
    Settings: () => <svg data-testid="settings-icon" />,
    X: () => <svg data-testid="x-icon" />,
    Camera: () => <svg data-testid="camera-icon" />,
    ChevronRight: () => <svg data-testid="chevron-right-icon" />,
    ChevronLeft: () => <svg data-testid="chevron-left-icon" />,
    RefreshCcw: () => <svg data-testid="refresh-ccw-icon" />,
    Globe: () => <svg data-testid="globe-icon" />,
    UploadCloud: () => <svg data-testid="upload-cloud-icon" />,
    PlayCircle: () => <svg data-testid="play-circle-icon" />,
    Clock: () => <svg data-testid="clock-icon" />,
    DownloadCloud: () => <svg data-testid="download-cloud-icon" />,
    Palette: () => <svg data-testid="palette-icon" />,
}));

// Mock services
vi.mock('./services/geminiService', () => ({
    generateSticker: vi.fn(),
    generateStickerSet: vi.fn(),
}));

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
    });

    it('renders landing page initially', () => {
        render(<App />);
        expect(screen.getByText(/Turn Photos into/i)).toBeInTheDocument();
        expect(screen.getByText(/Amazing Stickers/i)).toBeInTheDocument();
    });

    it('can navigate to gallery view', () => {
        render(<App />);
        // Wait for the specific elements corresponding to the "zh-TW" default language
        const viewAllButtons = screen.getAllByText('View All');
        fireEvent.click(viewAllButtons[0]);

        // Assert that the view has changed
        expect(screen.getByText('精選範例 (Sample Gallery)')).toBeInTheDocument();
    });

    it('can navigate to history view', () => {
        render(<App />);
        const historyLinks = screen.getAllByText('我的貼圖集');
        fireEvent.click(historyLinks[0]);

        // Assert that the view has changed
        expect(screen.getByText('您在本機製作的所有貼圖')).toBeInTheDocument();
    });
});
