import type { GameState, MechanicalIntent } from '../types';
// FIX: Replaced RANK_ORDER with ABILITY_RANK_ORDER and REALM_RANK_CAPS with TIER_RANK_CAPS to match the correct types for validation.
import { ABILITY_RANK_ORDER, QUALITY_ORDER, REALM_RANK_CAPS, DEFAULT_ATTRIBUTE_DEFINITIONS } from '../constants';

/**
 * Pillar 3: The Mechanical Filter / "Thiên Đạo Giám Sát"
 * Post-processes data from the AI's mechanical intent to ensure game balance.
 * It caps item/technique ranks and stat gains based on the player's current realm.
 * This acts as a "Heavenly Dao" that prevents the player from becoming overpowered too quickly.
 */
export const validateMechanicalChanges = (
    intent: MechanicalIntent,
    gameState: GameState
): { validatedIntent: MechanicalIntent, validationNotifications: string[] } => {
    if (!intent) {
        return { validatedIntent: {}, validationNotifications: [] };
    }
    const validatedIntent = JSON.parse(JSON.stringify(intent));
    const validationNotifications: string[] = [];
    const { playerCharacter, realmSystem } = gameState;
    // FIX: Access cultivation property
    const playerRealmId = playerCharacter.cultivation.currentRealmId;

    const caps = REALM_RANK_CAPS[playerRealmId];
    if (caps) {
        // FIX: Use ABILITY_RANK_ORDER
        const maxRankIndex = ABILITY_RANK_ORDER.indexOf(caps.maxRank);
        const maxQualityIndex = QUALITY_ORDER.indexOf(caps.maxQuality);

        if (validatedIntent.itemsGained) {
            validatedIntent.itemsGained.forEach((item: any) => {
                const currentQualityIndex = QUALITY_ORDER.indexOf(item.quality);
                if (currentQualityIndex > maxQualityIndex) {
                    const originalQuality = item.quality;
                    item.quality = caps.maxQuality;
                    validationNotifications.push(`Vật phẩm "${item.name}" (${originalQuality}) ẩn chứa sức mạnh kinh người, nhưng với cảnh giới hiện tại, bạn chỉ có thể cảm nhận được uy lực ở mức ${caps.maxQuality}.`);
                }
            });
        }

        if (validatedIntent.newTechniques) {
            validatedIntent.newTechniques.forEach((tech: any) => {
                // FIX: Use ABILITY_RANK_ORDER
                const currentRankIndex = ABILITY_RANK_ORDER.indexOf(tech.rank);
                if (currentRankIndex > maxRankIndex) {
                    const originalRank = tech.rank;
                    tech.rank = caps.maxRank;
                    validationNotifications.push(`Công pháp "${tech.name}" (${originalRank}) quá cao thâm. Bạn cố gắng lĩnh ngộ nhưng chỉ có thể nắm được những huyền ảo ở tầng thứ ${caps.maxRank}.`);
                }
            });
        }
    }

    if (validatedIntent.statChanges) {
        const realm = realmSystem.find(r => r.id === playerRealmId);
        // FIX: Access cultivation property
        const currentStageIndex = realm?.stages.findIndex(s => s.id === playerCharacter.cultivation.currentStageId);
        
        let qiCap = 5000;
        if (realm && currentStageIndex !== undefined && currentStageIndex < realm.stages.length - 1) {
            const currentStage = realm.stages[currentStageIndex];
            const nextStage = realm.stages[currentStageIndex + 1];
            const qiToNext = nextStage.qiRequired - currentStage.qiRequired;
            qiCap = Math.max(5000, Math.floor(qiToNext * 0.3));
        }

        validatedIntent.statChanges.forEach((change: any) => {
            const attrDef = gameState.attributeSystem.definitions.find(def => def.id === change.attribute);
            if (change.attribute === 'spiritualQi' && change.change > qiCap) {
                const originalChange = change.change;
                change.change = qiCap;
                validationNotifications.push(`Luồng linh khí thu được (${originalChange.toLocaleString()}) quá hùng hậu. Kinh mạch của bạn chỉ có thể chịu được ${change.change.toLocaleString()} điểm, phần còn lại đã tiêu tán.`);
            } else if (attrDef && attrDef.type === 'PRIMARY' && change.change > 3) {
                const originalChange = change.change;
                change.change = 3;
                validationNotifications.push(`Cơ thể bạn được một luồng năng lượng kỳ lạ gột rửa, ${attrDef.name} tăng lên. Tuy nhiên, do căn cơ chưa vững, bạn chỉ hấp thụ được ${change.change} điểm (nguyên gốc ${originalChange}).`);
            } else if (attrDef && attrDef.type !== 'PRIMARY' && change.attribute !== 'spiritualQi' && change.change > 10) {
                const originalChange = change.change;
                change.change = 10;
                validationNotifications.push(`Một luồng năng lượng kỳ lạ gột rửa cơ thể, ${attrDef.name} tăng lên. Do căn cơ chưa vững, bạn chỉ hấp thụ được ${change.change} điểm (nguyên gốc ${originalChange}).`);
            }
        });
    }

    if (validatedIntent.timeJump) {
        const { years = 0, seasons = 0, days = 0 } = validatedIntent.timeJump;
        const totalDaysJump = (years * 120) + (seasons * 30) + days; // Using simplified days per season/year
        const oneYearInDays = 120;
        if (totalDaysJump > oneYearInDays) {
            validatedIntent.timeJump = { years: 1, seasons: 0, days: 0 };
            validationNotifications.push(`Dòng thời gian hỗn loạn, bạn cảm thấy mình đã trải qua một thời gian dài, nhưng khi định thần lại, dường như chỉ mới một năm trôi qua.`);
        }
    }

    return { validatedIntent, validationNotifications };
};