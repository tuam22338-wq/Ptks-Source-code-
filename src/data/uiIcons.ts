// FIX: Add React import for ElementType
import type React from 'react';
import {
  GiCauldron, GiBroadsword,
  GiHealthNormal, GiHourglass, GiMagicSwirl, GiPentacle, GiPerspectiveDiceSixFacesRandom,
  GiRunningShoe, GiScrollQuill, GiSparklingSabre, GiStairsGoal, GiStoneTower, GiYinYang,
  GiSpinalCoil, GiMuscularTorso, GiSoulVessel, GiBoltSpellCast, GiHeartTower, GiScales,
  GiMountainCave, GiDoubleDragon, GiTalk, GiBed, GiSprout, GiStoneBlock, GiHerbsBundle,
  GiGoldBar, GiTreeBranch, GiWaterDrop, GiFire, GiGroundbreaker,
  GiChestArmor, GiLegArmor, GiBoots, GiRing, GiNecklace
} from 'react-icons/gi';
import { FaSun, FaMoon, FaShieldAlt, FaStore } from 'react-icons/fa';

export const UI_ICONS: { [key: string]: React.ElementType } = {
  GiCauldron, GiBroadsword, GiHealthNormal, GiHourglass, GiMagicSwirl,
  GiPentacle, GiPerspectiveDiceSixFacesRandom, GiRunningShoe, GiScrollQuill,
  GiSparklingSabre, GiStairsGoal, GiStoneTower, GiYinYang, GiSpinalCoil,
  GiMuscularTorso, GiSoulVessel, GiBoltSpellCast, GiHeartTower, GiScales,
  GiMountainCave, GiDoubleDragon, GiTalk, GiBed, GiSprout, GiStoneBlock,
  GiHerbsBundle, GiGoldBar, GiTreeBranch, GiWaterDrop, GiFire,
  GiGroundbreaker, GiChestArmor, GiLegArmor, GiBoots, GiRing, GiNecklace,
  FaSun, FaMoon, FaShieldAlt, FaStore
};