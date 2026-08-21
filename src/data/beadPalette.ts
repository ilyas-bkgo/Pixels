import { BeadColor, BeadBrand, PatternGrid } from '../types';
import { MARD_PALETTE } from './mardPalette';

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function rgbToLab(rVal: number, gVal: number, bVal: number): [number, number, number] {
  let nr = rVal / 255;
  let ng = gVal / 255;
  let nb = bVal / 255;

  nr = nr > 0.04045 ? Math.pow((nr + 0.055) / 1.055, 2.4) : nr / 12.92;
  ng = ng > 0.04045 ? Math.pow((ng + 0.055) / 1.055, 2.4) : ng / 12.92;
  nb = nb > 0.04045 ? Math.pow((nb + 0.055) / 1.055, 2.4) : nb / 12.92;

  nr *= 100;
  ng *= 100;
  nb *= 100;

  const x = nr * 0.4124564 + ng * 0.3575761 + nb * 0.1804375;
  const y = nr * 0.2126729 + ng * 0.7151522 + nb * 0.0721750;
  const z = nr * 0.0193339 + ng * 0.1191920 + nb * 0.9503041;

  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  const nx = x / refX;
  const ny = y / refY;
  const nz = z / refZ;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(nx);
  const fy = f(ny);
  const fz = f(nz);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [L, a, b];
}

export function deltaE(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

// -------------------------------------------------------------
// 1. PERLER BRAND PALETTE
// -------------------------------------------------------------
const rawPerlerColors: Omit<BeadColor, 'rgb' | 'lab' | 'brand'>[] = [
  // Basics
  { id: 'p_white', name: 'White', code: 'P01', hex: '#FFFFFF', category: 'basics' },
  { id: 'p_black', name: 'Black', code: 'P18', hex: '#18181A', category: 'basics' },
  { id: 'p_creme', name: 'Creme', code: 'P02', hex: '#FDF0DA', category: 'basics' },
  { id: 'p_grey', name: 'Grey', code: 'P17', hex: '#878A8D', category: 'basics' },
  { id: 'p_dark_grey', name: 'Dark Grey', code: 'P92', hex: '#4B4D50', category: 'basics' },
  { id: 'p_clear', name: 'Clear / Translucent', code: 'P19', hex: '#E2E6E9', category: 'basics' },

  // Reds & Pinks
  { id: 'p_red', name: 'Red', code: 'P05', hex: '#D62027', category: 'reds_pinks' },
  { id: 'p_cherry', name: 'Cherry', code: 'P180', hex: '#9E1529', category: 'reds_pinks' },
  { id: 'p_cranberry', name: 'Cranberry', code: 'P106', hex: '#800827', category: 'reds_pinks' },
  { id: 'p_raspberry', name: 'Raspberry', code: 'P88', hex: '#B82855', category: 'reds_pinks' },
  { id: 'p_magenta', name: 'Magenta', code: 'P38', hex: '#D62D77', category: 'reds_pinks' },
  { id: 'p_hot_coral', name: 'Hot Coral', code: 'P59', hex: '#FA585C', category: 'reds_pinks' },
  { id: 'p_blush', name: 'Blush', code: 'P63', hex: '#F8B1A8', category: 'reds_pinks' },
  { id: 'p_pink', name: 'Pink', code: 'P06', hex: '#F275A1', category: 'reds_pinks' },
  { id: 'p_bubblegum', name: 'Bubblegum', code: 'P79', hex: '#E8558A', category: 'reds_pinks' },
  { id: 'p_cotton_candy', name: 'Cotton Candy', code: 'P96', hex: '#F6A8C6', category: 'reds_pinks' },
  { id: 'p_flamingo', name: 'Flamingo', code: 'P181', hex: '#F56E75', category: 'reds_pinks' },

  // Yellows & Oranges
  { id: 'p_yellow', name: 'Yellow', code: 'P03', hex: '#FEDD00', category: 'yellows_oranges' },
  { id: 'p_pastel_yellow', name: 'Pastel Yellow', code: 'P56', hex: '#FFF48D', category: 'yellows_oranges' },
  { id: 'p_sunshine', name: 'Sunshine', code: 'P195', hex: '#F8CB38', category: 'yellows_oranges' },
  { id: 'p_cheddar', name: 'Cheddar', code: 'P57', hex: '#FFA800', category: 'yellows_oranges' },
  { id: 'p_orange', name: 'Orange', code: 'P04', hex: '#FF6D00', category: 'yellows_oranges' },
  { id: 'p_tangerine', name: 'Tangerine', code: 'P97', hex: '#FF8833', category: 'yellows_oranges' },
  { id: 'p_butterscotch', name: 'Butterscotch', code: 'P90', hex: '#E79B3D', category: 'yellows_oranges' },
  { id: 'p_apricot', name: 'Apricot', code: 'P188', hex: '#F9AC7D', category: 'yellows_oranges' },

  // Greens
  { id: 'p_light_green', name: 'Light Green / Lime', code: 'P11', hex: '#77C043', category: 'greens' },
  { id: 'p_kiwi_lime', name: 'Kiwi Lime', code: 'P61', hex: '#9ED136', category: 'greens' },
  { id: 'p_prickly_pear', name: 'Prickly Pear', code: 'P183', hex: '#C2D939', category: 'greens' },
  { id: 'p_green', name: 'Green', code: 'P10', hex: '#008C44', category: 'greens' },
  { id: 'p_dark_green', name: 'Dark Green', code: 'P08', hex: '#1C5B36', category: 'greens' },
  { id: 'p_parrot_green', name: 'Parrot Green', code: 'P80', hex: '#00B16A', category: 'greens' },
  { id: 'p_fern', name: 'Fern', code: 'P184', hex: '#447C3B', category: 'greens' },
  { id: 'p_olive', name: 'Olive', code: 'P89', hex: '#586E38', category: 'greens' },
  { id: 'p_sage', name: 'Sage', code: 'P194', hex: '#87A987', category: 'greens' },
  { id: 'p_mint', name: 'Mint', code: 'P207', hex: '#9CE3C6', category: 'greens' },

  // Blues
  { id: 'p_light_blue', name: 'Light Blue', code: 'P09', hex: '#509EE3', category: 'blues' },
  { id: 'p_pastel_blue', name: 'Pastel Blue', code: 'P52', hex: '#99C7EB', category: 'blues' },
  { id: 'p_sky', name: 'Sky', code: 'P187', hex: '#71BCE1', category: 'blues' },
  { id: 'p_turquoise', name: 'Turquoise', code: 'P62', hex: '#00ADC8', category: 'blues' },
  { id: 'p_toothpaste', name: 'Toothpaste', code: 'P58', hex: '#53D3D1', category: 'blues' },
  { id: 'p_blue', name: 'Blue', code: 'P08b', hex: '#0054A6', category: 'blues' },
  { id: 'p_dark_blue', name: 'Dark Blue', code: 'P07', hex: '#0B2C6F', category: 'blues' },
  { id: 'p_cobalt', name: 'Cobalt', code: 'P191', hex: '#1C3F95', category: 'blues' },
  { id: 'p_periwinkle', name: 'Periwinkle', code: 'P70', hex: '#636BB0', category: 'blues' },
  { id: 'p_denim', name: 'Denim', code: 'P190', hex: '#375778', category: 'blues' },
  { id: 'p_robin_egg', name: 'Robin Egg', code: 'P93', hex: '#3AB7B9', category: 'blues' },

  // Purples
  { id: 'p_pastel_lavender', name: 'Pastel Lavender', code: 'P54', hex: '#B599CE', category: 'purples' },
  { id: 'p_lavender', name: 'Lavender', code: 'P60', hex: '#9568B3', category: 'purples' },
  { id: 'p_purple', name: 'Purple', code: 'P13', hex: '#662D91', category: 'purples' },
  { id: 'p_dark_purple', name: 'Dark Purple', code: 'P186', hex: '#441F63', category: 'purples' },
  { id: 'p_plum', name: 'Plum', code: 'P20', hex: '#792B57', category: 'purples' },
  { id: 'p_orchid', name: 'Orchid', code: 'P185', hex: '#CF84C2', category: 'purples' },

  // Browns & Neutrals
  { id: 'p_sand', name: 'Sand', code: 'P91', hex: '#D8B88C', category: 'browns' },
  { id: 'p_fawn', name: 'Fawn', code: 'P193', hex: '#BF8A5C', category: 'browns' },
  { id: 'p_tan', name: 'Tan', code: 'P12', hex: '#A56A44', category: 'browns' },
  { id: 'p_light_brown', name: 'Light Brown', code: 'P21', hex: '#7B4A28', category: 'browns' },
  { id: 'p_brown', name: 'Brown', code: 'P14', hex: '#53311C', category: 'browns' },
  { id: 'p_dark_brown', name: 'Dark Brown', code: 'P189', hex: '#341E14', category: 'browns' },
  { id: 'p_gingerbread', name: 'Gingerbread', code: 'P192', hex: '#874C2A', category: 'browns' },
  { id: 'p_toast', name: 'Toast', code: 'P206', hex: '#D29C6B', category: 'browns' },

  // Pastels & Metallics
  { id: 'p_gold', name: 'Metallic Gold', code: 'P84', hex: '#CCA24C', category: 'pastels_metallics' },
  { id: 'p_silver', name: 'Metallic Silver', code: 'P83', hex: '#A8AFB5', category: 'pastels_metallics' },
  { id: 'p_bronze', name: 'Metallic Bronze', code: 'P85', hex: '#8E5F3B', category: 'pastels_metallics' },
  { id: 'p_copper', name: 'Metallic Copper', code: 'P86', hex: '#B2623D', category: 'pastels_metallics' },
  { id: 'p_glow_green', name: 'Glow Green', code: 'P40', hex: '#D6F2C2', category: 'pastels_metallics' },
];

export const PERLER_PALETTE: BeadColor[] = rawPerlerColors.map((c) => {
  const rgb = hexToRgb(c.hex);
  const lab = rgbToLab(rgb[0], rgb[1], rgb[2]);
  return { ...c, brand: 'perler', rgb, lab };
});

// -------------------------------------------------------------
// 2. HAMA BRAND PALETTE (Midi 5mm)
// -------------------------------------------------------------
const rawHamaColors: Omit<BeadColor, 'rgb' | 'lab' | 'brand'>[] = [
  // Basics
  { id: 'h_01', name: 'White', code: 'H01', hex: '#FFFFFF', category: 'basics' },
  { id: 'h_18', name: 'Black', code: 'H18', hex: '#111111', category: 'basics' },
  { id: 'h_02', name: 'Cream', code: 'H02', hex: '#FFF2DB', category: 'basics' },
  { id: 'h_17', name: 'Grey', code: 'H17', hex: '#898D90', category: 'basics' },
  { id: 'h_71', name: 'Dark Grey', code: 'H71', hex: '#484C4F', category: 'basics' },
  { id: 'h_70', name: 'Light Grey', code: 'H70', hex: '#C2C6C9', category: 'basics' },
  { id: 'h_19', name: 'Clear', code: 'H19', hex: '#EBEFF2', category: 'basics' },

  // Reds & Pinks
  { id: 'h_05', name: 'Red', code: 'H05', hex: '#BA1721', category: 'reds_pinks' },
  { id: 'h_22', name: 'Dark Red', code: 'H22', hex: '#77131B', category: 'reds_pinks' },
  { id: 'h_26', name: 'Flesh / Blush', code: 'H26', hex: '#F9BFAC', category: 'reds_pinks' },
  { id: 'h_06', name: 'Pink', code: 'H06', hex: '#F77099', category: 'reds_pinks' },
  { id: 'h_29', name: 'Claret', code: 'H29', hex: '#942343', category: 'reds_pinks' },
  { id: 'h_30', name: 'Burgundy', code: 'H30', hex: '#581729', category: 'reds_pinks' },
  { id: 'h_48', name: 'Pastel Pink', code: 'H48', hex: '#F9B2CE', category: 'reds_pinks' },
  { id: 'h_37', name: 'Neon Pink', code: 'H37', hex: '#FF2E79', category: 'reds_pinks' },
  { id: 'h_44', name: 'Pastel Red', code: 'H44', hex: '#F97368', category: 'reds_pinks' },

  // Yellows & Oranges
  { id: 'h_03', name: 'Yellow', code: 'H03', hex: '#FFCE00', category: 'yellows_oranges' },
  { id: 'h_43', name: 'Pastel Yellow', code: 'H43', hex: '#FFF275', category: 'yellows_oranges' },
  { id: 'h_04', name: 'Orange', code: 'H04', hex: '#FF5C00', category: 'yellows_oranges' },
  { id: 'h_33', name: 'Neon Orange', code: 'H33', hex: '#FF7F00', category: 'yellows_oranges' },
  { id: 'h_32', name: 'Neon Yellow', code: 'H32', hex: '#EAFF00', category: 'yellows_oranges' },

  // Greens
  { id: 'h_10', name: 'Green', code: 'H10', hex: '#008C3B', category: 'greens' },
  { id: 'h_11', name: 'Light Green', code: 'H11', hex: '#63B834', category: 'greens' },
  { id: 'h_28', name: 'Dark Green', code: 'H28', hex: '#0C4B27', category: 'greens' },
  { id: 'h_47', name: 'Pastel Green', code: 'H47', hex: '#8AE08A', category: 'greens' },
  { id: 'h_36', name: 'Neon Green', code: 'H36', hex: '#39FF14', category: 'greens' },
  { id: 'h_60', name: 'Olive Green', code: 'H60', hex: '#526938', category: 'greens' },

  // Blues
  { id: 'h_08', name: 'Blue', code: 'H08', hex: '#00479E', category: 'blues' },
  { id: 'h_09', name: 'Light Blue', code: 'H09', hex: '#3E95E0', category: 'blues' },
  { id: 'h_46', name: 'Pastel Blue', code: 'H46', hex: '#87C0EB', category: 'blues' },
  { id: 'h_31', name: 'Turquoise', code: 'H31', hex: '#00A3B4', category: 'blues' },
  { id: 'h_49', name: 'Azure', code: 'H49', hex: '#0075A8', category: 'blues' },
  { id: 'h_34', name: 'Neon Blue', code: 'H34', hex: '#0099FF', category: 'blues' },

  // Purples
  { id: 'h_07', name: 'Purple', code: 'H07', hex: '#5E227F', category: 'purples' },
  { id: 'h_45', name: 'Pastel Purple', code: 'H45', hex: '#A37CB8', category: 'purples' },

  // Browns
  { id: 'h_12', name: 'Brown', code: 'H12', hex: '#4F2B14', category: 'browns' },
  { id: 'h_20', name: 'Reddish Brown', code: 'H20', hex: '#77351A', category: 'browns' },
  { id: 'h_21', name: 'Light Brown', code: 'H21', hex: '#9E5B2E', category: 'browns' },
  { id: 'h_27', name: 'Beige', code: 'H27', hex: '#D6AD85', category: 'browns' },

  // Metallics
  { id: 'h_61', name: 'Gold', code: 'H61', hex: '#C29B38', category: 'pastels_metallics' },
  { id: 'h_62', name: 'Silver', code: 'H62', hex: '#A3ACB2', category: 'pastels_metallics' },
  { id: 'h_63', name: 'Bronze', code: 'H63', hex: '#875129', category: 'pastels_metallics' },
];

export const HAMA_PALETTE: BeadColor[] = rawHamaColors.map((c) => {
  const rgb = hexToRgb(c.hex);
  const lab = rgbToLab(rgb[0], rgb[1], rgb[2]);
  return { ...c, brand: 'hama', rgb, lab };
});

// -------------------------------------------------------------
// 3. ARTKAL BRAND PALETTE (S-5mm Series)
// -------------------------------------------------------------
const rawArtkalColors: Omit<BeadColor, 'rgb' | 'lab' | 'brand'>[] = [
  // Basics
  { id: 'a_s01', name: 'Pure White', code: 'S01', hex: '#FFFFFF', category: 'basics' },
  { id: 'a_s02', name: 'Deep Black', code: 'S02', hex: '#121214', category: 'basics' },
  { id: 'a_s36', name: 'Smoke Grey', code: 'S36', hex: '#7E8286', category: 'basics' },
  { id: 'a_s37', name: 'Charcoal Grey', code: 'S37', hex: '#404347', category: 'basics' },
  { id: 'a_s38', name: 'Pearl Mist', code: 'S38', hex: '#D0D4D8', category: 'basics' },
  { id: 'a_s39', name: 'Crystal Clear', code: 'S39', hex: '#E5E9EC', category: 'basics' },

  // Reds & Pinks
  { id: 'a_s03', name: 'Crimson Red', code: 'S03', hex: '#C8102E', category: 'reds_pinks' },
  { id: 'a_s04', name: 'Ruby Dark Red', code: 'S04', hex: '#850C1F', category: 'reds_pinks' },
  { id: 'a_s05', name: 'Scarlet Glow', code: 'S05', hex: '#E63946', category: 'reds_pinks' },
  { id: 'a_s20', name: 'Pastel Rose', code: 'S20', hex: '#FBC4D2', category: 'reds_pinks' },
  { id: 'a_s21', name: 'Bubble Pink', code: 'S21', hex: '#F75C8D', category: 'reds_pinks' },
  { id: 'a_s22', name: 'Hot Neon Pink', code: 'S22', hex: '#FF1493', category: 'reds_pinks' },
  { id: 'a_s23', name: 'Vibrant Magenta', code: 'S23', hex: '#C71585', category: 'reds_pinks' },
  { id: 'a_s40', name: 'Warm Coral', code: 'S40', hex: '#F06E6B', category: 'reds_pinks' },
  { id: 'a_s41', name: 'Salmon Blush', code: 'S41', hex: '#FA9284', category: 'reds_pinks' },

  // Yellows & Oranges
  { id: 'a_s06', name: 'Bright Orange', code: 'S06', hex: '#FF6B00', category: 'yellows_oranges' },
  { id: 'a_s07', name: 'Canary Yellow', code: 'S07', hex: '#FFD700', category: 'yellows_oranges' },
  { id: 'a_s08', name: 'Lemon Yellow', code: 'S08', hex: '#FFF01F', category: 'yellows_oranges' },
  { id: 'a_s09', name: 'Soft Butter', code: 'S09', hex: '#FFF59D', category: 'yellows_oranges' },
  { id: 'a_s44', name: 'Peach Sorbet', code: 'S44', hex: '#FDC49B', category: 'yellows_oranges' },
  { id: 'a_s47', name: 'Electric Orange', code: 'S47', hex: '#FF4500', category: 'yellows_oranges' },

  // Greens
  { id: 'a_s10', name: 'Spring Green', code: 'S10', hex: '#70BF41', category: 'greens' },
  { id: 'a_s11', name: 'Emerald Green', code: 'S11', hex: '#009245', category: 'greens' },
  { id: 'a_s12', name: 'Pine Forest', code: 'S12', hex: '#185936', category: 'greens' },
  { id: 'a_s13', name: 'Avocado Olive', code: 'S13', hex: '#596B32', category: 'greens' },
  { id: 'a_s14', name: 'Moss Green', code: 'S14', hex: '#3B703F', category: 'greens' },
  { id: 'a_s43', name: 'Spearmint', code: 'S43', hex: '#8BE3C3', category: 'greens' },
  { id: 'a_s45', name: 'Neon Toxic Green', code: 'S45', hex: '#44FF00', category: 'greens' },

  // Blues
  { id: 'a_s15', name: 'Sky Blue', code: 'S15', hex: '#68B2E8', category: 'blues' },
  { id: 'a_s16', name: 'Azure Breeze', code: 'S16', hex: '#3D92D0', category: 'blues' },
  { id: 'a_s17', name: 'Cobalt Royal', code: 'S17', hex: '#0055A5', category: 'blues' },
  { id: 'a_s18', name: 'Deep Sapphire', code: 'S18', hex: '#002E7A', category: 'blues' },
  { id: 'a_s19', name: 'Midnight Navy', code: 'S19', hex: '#0A1B3F', category: 'blues' },
  { id: 'a_s42', name: 'Tropical Teal', code: 'S42', hex: '#00B4D8', category: 'blues' },

  // Purples
  { id: 'a_s25', name: 'Royal Violet', code: 'S25', hex: '#5A189A', category: 'purples' },
  { id: 'a_s26', name: 'Lilac Mist', code: 'S26', hex: '#9D4EDD', category: 'purples' },
  { id: 'a_s27', name: 'Soft Orchid', code: 'S27', hex: '#C77DFF', category: 'purples' },
  { id: 'a_s28', name: 'Plum Shadow', code: 'S28', hex: '#6A0572', category: 'purples' },

  // Browns
  { id: 'a_s30', name: 'Desert Sand', code: 'S30', hex: '#DEBA9D', category: 'browns' },
  { id: 'a_s31', name: 'Cookie Dough', code: 'S31', hex: '#C48B5C', category: 'browns' },
  { id: 'a_s32', name: 'Golden Tan', code: 'S32', hex: '#9E6B38', category: 'browns' },
  { id: 'a_s33', name: 'Rich Walnut', code: 'S33', hex: '#583922', category: 'browns' },
  { id: 'a_s34', name: 'Dark Espresso', code: 'S34', hex: '#301B11', category: 'browns' },

  // Metallics
  { id: 'a_s49', name: 'Imperial Gold', code: 'S49', hex: '#C6A13B', category: 'pastels_metallics' },
  { id: 'a_s50', name: 'Sterling Silver', code: 'S50', hex: '#9BA3A9', category: 'pastels_metallics' },
];

export const ARTKAL_PALETTE: BeadColor[] = rawArtkalColors.map((c) => {
  const rgb = hexToRgb(c.hex);
  const lab = rgbToLab(rgb[0], rgb[1], rgb[2]);
  return { ...c, brand: 'artkal', rgb, lab };
});

// -------------------------------------------------------------
// 4. NABBI / FUSE BEAD PALETTE (Scandinavian Standard)
// -------------------------------------------------------------
const rawNabbiColors: Omit<BeadColor, 'rgb' | 'lab' | 'brand'>[] = [
  { id: 'n_white', name: 'Nabbi White', code: 'N01', hex: '#FFFFFF', category: 'basics' },
  { id: 'n_black', name: 'Nabbi Black', code: 'N02', hex: '#161616', category: 'basics' },
  { id: 'n_grey', name: 'Nabbi Grey', code: 'N17', hex: '#82868A', category: 'basics' },
  { id: 'n_light_grey', name: 'Nabbi Light Grey', code: 'N20', hex: '#BDC2C7', category: 'basics' },
  { id: 'n_red', name: 'Nabbi Red', code: 'N05', hex: '#C81B26', category: 'reds_pinks' },
  { id: 'n_dark_red', name: 'Nabbi Dark Red', code: 'N22', hex: '#7A121A', category: 'reds_pinks' },
  { id: 'n_pink', name: 'Nabbi Pink', code: 'N06', hex: '#FA7DA1', category: 'reds_pinks' },
  { id: 'n_light_pink', name: 'Nabbi Light Pink', code: 'N19', hex: '#F9B7CB', category: 'reds_pinks' },
  { id: 'n_orange', name: 'Nabbi Orange', code: 'N04', hex: '#FF6400', category: 'yellows_oranges' },
  { id: 'n_yellow', name: 'Nabbi Yellow', code: 'N03', hex: '#FFD400', category: 'yellows_oranges' },
  { id: 'n_pastel_yellow', name: 'Nabbi Pastel Yellow', code: 'N23', hex: '#FFF27D', category: 'yellows_oranges' },
  { id: 'n_green', name: 'Nabbi Green', code: 'N10', hex: '#008C38', category: 'greens' },
  { id: 'n_light_green', name: 'Nabbi Light Green', code: 'N11', hex: '#68B632', category: 'greens' },
  { id: 'n_dark_green', name: 'Nabbi Dark Green', code: 'N24', hex: '#12542B', category: 'greens' },
  { id: 'n_turquoise', name: 'Nabbi Turquoise', code: 'N15', hex: '#009EB3', category: 'greens' },
  { id: 'n_blue', name: 'Nabbi Blue', code: 'N08', hex: '#004A9E', category: 'blues' },
  { id: 'n_light_blue', name: 'Nabbi Light Blue', code: 'N09', hex: '#4B9EE3', category: 'blues' },
  { id: 'n_dark_blue', name: 'Nabbi Dark Blue', code: 'N07', hex: '#0B2968', category: 'blues' },
  { id: 'n_purple', name: 'Nabbi Purple', code: 'N13', hex: '#642284', category: 'purples' },
  { id: 'n_lilac', name: 'Nabbi Lilac', code: 'N26', hex: '#AC75B8', category: 'purples' },
  { id: 'n_brown', name: 'Nabbi Brown', code: 'N14', hex: '#593219', category: 'browns' },
  { id: 'n_light_brown', name: 'Nabbi Light Brown', code: 'N21', hex: '#8E522C', category: 'browns' },
  { id: 'n_beige', name: 'Nabbi Beige', code: 'N12', hex: '#DBB58E', category: 'browns' },
  { id: 'n_gold', name: 'Nabbi Gold', code: 'N84', hex: '#C29C44', category: 'pastels_metallics' },
  { id: 'n_silver', name: 'Nabbi Silver', code: 'N83', hex: '#9FA5AA', category: 'pastels_metallics' },
];

export const NABBI_PALETTE: BeadColor[] = rawNabbiColors.map((c) => {
  const rgb = hexToRgb(c.hex);
  const lab = rgbToLab(rgb[0], rgb[1], rgb[2]);
  return { ...c, brand: 'nabbi', rgb, lab };
});

// Master lookup
export const BRAND_PALETTES: Record<BeadBrand, BeadColor[]> = {
  mard: MARD_PALETTE,
  perler: PERLER_PALETTE,
  hama: HAMA_PALETTE,
  artkal: ARTKAL_PALETTE,
  nabbi: NABBI_PALETTE,
};

export const BRAND_INFO: Record<
  BeadBrand,
  { name: string; tag: string; description: string; unverified?: boolean; count: number }
> = {
  mard: {
    name: 'MARD 221 (Asian Standard)',
    tag: 'Primary Theme • 221 Colors (9 Series)',
    description: 'Premier 221-color Asian standard palette across 9 series (A1-M15). Optimized for rich skin tones, anime gradients, and vibrant craft palettes.',
    unverified: false,
    count: 221,
  },
  perler: {
    name: 'Perler Beads',
    tag: 'USA Standard (5mm)',
    description: 'The standard classic American fuse bead palette with rich shades.',
    count: 65,
  },
  hama: {
    name: 'Hama Beads',
    tag: 'Midi (5mm)',
    description: 'Official Danish Hama Midi palette with authentic pastel and neon tones.',
    count: 57,
  },
  artkal: {
    name: 'Artkal Beads',
    tag: 'S-Series (5mm)',
    description: 'Vibrant Artkal S-Series palette offering high color fidelity.',
    count: 50,
  },
  nabbi: {
    name: 'Nabbi / Fuse',
    tag: 'Scandinavian (5mm)',
    description: 'Traditional Nordic Nabbi & PhotoPearls palette.',
    count: 25,
  },
};

export const ALL_BEAD_COLORS: BeadColor[] = [
  ...MARD_PALETTE,
  ...PERLER_PALETTE,
  ...HAMA_PALETTE,
  ...ARTKAL_PALETTE,
  ...NABBI_PALETTE,
];

export const COLOR_MAP = new Map<string, BeadColor>(
  ALL_BEAD_COLORS.map((c) => [c.id, c])
);

export const DEFAULT_BEAD_COLOR = MARD_PALETTE[0];

/**
 * Re-matches an existing pattern grid from its current colors to the target brand palette
 * using perceptual CIE Lab Delta-E distance, preserving empty transparent pegboard holes (null).
 */
export function rematchPatternToBrand(
  grid: PatternGrid,
  targetBrand: BeadBrand
): PatternGrid {
  const targetPalette = BRAND_PALETTES[targetBrand];
  const newCells: (string | null)[][] = [];

  for (let y = 0; y < grid.height; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < grid.width; x++) {
      const colorId = grid.cells[y]?.[x];
      if (colorId === null || colorId === undefined) {
        row.push(null);
        continue;
      }

      // Lookup current color lab coordinate
      const currentColor = COLOR_MAP.get(colorId) || DEFAULT_BEAD_COLOR;
      const currentLab = currentColor.lab || rgbToLab(currentColor.rgb[0], currentColor.rgb[1], currentColor.rgb[2]);

      // Find closest color in new target brand palette using Delta-E
      let closest = targetPalette[0];
      let minDistance = Infinity;

      for (let i = 0; i < targetPalette.length; i++) {
        const candidate = targetPalette[i];
        const candLab = candidate.lab || rgbToLab(candidate.rgb[0], candidate.rgb[1], candidate.rgb[2]);
        const dist = deltaE(currentLab, candLab);
        if (dist < minDistance) {
          minDistance = dist;
          closest = candidate;
        }
      }

      row.push(closest.id);
    }
    newCells.push(row);
  }

  return {
    width: grid.width,
    height: grid.height,
    cells: newCells,
  };
}
