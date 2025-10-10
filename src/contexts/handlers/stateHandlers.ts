import type { Dispatch } from 'react';
import type { GameState, SaveSlot } from '../../types';
import type { Action } from '../gameReducer';
import * as db from '../../services/dbService';
import { migrateGameState } from '../../utils/gameStateManager';
import { CURRENT_GAME_VERSION } from '../../constants';

export async function saveGame(
    gameState: GameState | null,
    currentSlotId: number | null,
    dispatch: Dispatch<Action>,
    loadSaveSlots: () => Promise<void>
) {
    if (gameState && currentSlotId !== null) {
        const gameStateToSave: GameState = { ...gameState, version: CURRENT_GAME_VERSION, lastSaved: new Date().toISOString() };
        await db.saveGameState(currentSlotId, gameStateToSave);
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gameStateToSave });
        await loadSaveSlots();
    } else {
        throw new Error("Không có trạng thái game hoặc ô lưu hiện tại để lưu.");
    }
}

export function loadGame(
    slotId: number,
    saveSlots: SaveSlot[],
    dispatch: Dispatch<Action>
) {
    const selectedSlot = saveSlots.find(s => s.id === slotId);
    if (selectedSlot?.data?.playerCharacter) {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đang tải hành trình...' } });
        setTimeout(() => {
            dispatch({ type: 'LOAD_GAME', payload: { gameState: selectedSlot.data!, slotId } });
        }, 500);
    } else {
        alert("Ô trống. Vui lòng vào 'Tạo Thế Giới Mới' để bắt đầu.");
    }
}

export async function deleteGame(
    slotId: number,
    loadSaveSlots: () => Promise<void>
) {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn dữ liệu ở ô ${slotId}?`)) {
        await db.deleteGameState(slotId);
        await db.deleteMemoryForSlot(slotId);
        await loadSaveSlots();
    }
}

export async function verifyAndRepairSlot(
    slotId: number,
    dispatch: Dispatch<Action>,
    loadSaveSlots: () => Promise<void>
) {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: `Đang kiểm tra ô ${slotId}...` } });
    try {
        const slots = await db.getAllSaveSlots();
        const slotToVerify = slots.find(s => s.id === slotId);
        if (!slotToVerify?.data) throw new Error("Không có dữ liệu để kiểm tra.");
        const migratedGame = await migrateGameState(slotToVerify.data);
        await db.saveGameState(slotId, { ...migratedGame, version: CURRENT_GAME_VERSION });
        await loadSaveSlots();
        alert(`Ô ${slotId} đã được kiểm tra và cập nhật thành công!`);
    } catch (error) {
        alert(`Ô ${slotId} bị lỗi không thể sửa. Dữ liệu có thể đã bị hỏng nặng.`);
    } finally {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
}

export function quitGame(
    dispatch: Dispatch<Action>,
    cancelSpeech: () => void
) {
    cancelSpeech();
    dispatch({ type: 'QUIT_GAME' });
}
