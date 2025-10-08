// FIX: Content has been moved to RealmEditorModal.tsx to fix module errors. This file now re-exports.
// @google-genai-fix: Re-export from ProgressionSystemEditorModal to consolidate logic and fix circular dependencies. The chain will be TierEditorModal -> RealmEditorModal -> ProgressionSystemEditorModal.
export { default } from './ProgressionSystemEditorModal';
