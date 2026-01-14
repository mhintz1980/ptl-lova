# Customer Color Assignments

Use these colors to visually group jobs by customer on the Schedule page.
Edit this file to customize the colors to your preference.

| Customer           | Color Name | Hex Code  | CSS Class        |
| ------------------ | ---------- | --------- | ---------------- |
| United Rentals     | Blue       | `#3B82F6` | `bg-blue-500`    |
| Sunbelt Rentals    | Amber      | `#F59E0B` | `bg-amber-500`   |
| Herc Rentals       | Emerald    | `#10B981` | `bg-emerald-500` |
| Valencourt         | Purple     | `#8B5CF6` | `bg-violet-500`  |
| Rain For Rent      | Cyan       | `#06B6D4` | `bg-cyan-500`    |
| Equipment Share    | Rose       | `#F43F5E` | `bg-rose-500`    |
| H&E Equipment      | Orange     | `#F97316` | `bg-orange-500`  |
| Carter CAT         | Yellow     | `#EAB308` | `bg-yellow-500`  |
| Ring Power CAT     | Lime       | `#84CC16` | `bg-lime-500`    |
| Thompson CAT       | Teal       | `#14B8A6` | `bg-teal-500`    |
| Texas First CAT    | Indigo     | `#6366F1` | `bg-indigo-500`  |
| Yancey CAT         | Pink       | `#EC4899` | `bg-pink-500`    |
| Pioneer Pump       | Sky        | `#0EA5E9` | `bg-sky-500`     |
| Nat. Tank & Equip. | Fuchsia    | `#D946EF` | `bg-fuchsia-500` |
| SunState           | Slate      | `#64748B` | `bg-slate-500`   |

---

## How Colors Are Generated

New customers not in this list will automatically get a color derived from hashing their name.
The algorithm uses HSL color space with:

- **Hue**: Hash(customer name) % 360
- **Saturation**: 65%
- **Lightness**: 55%

To add a custom color for a new customer, add a row to the table above.

---

## Usage

The `customerColors.ts` module reads this configuration and applies:

1. **Left border stripe** (4px) on calendar pills in swimlane view
2. **Swimlane header** background tint when grouping is enabled
3. **Legend chip** color in the grouping legend

---

## Preview Palette

```
█ Blue       - United Rentals
█ Amber      - Sunbelt Rentals
█ Emerald    - Herc Rentals
█ Purple     - Valencourt
█ Cyan       - Rain For Rent
█ Rose       - Equipment Share
█ Orange     - H&E Equipment
█ Yellow     - Carter CAT
█ Lime       - Ring Power CAT
█ Teal       - Thompson CAT
█ Indigo     - Texas First CAT
█ Pink       - Yancey CAT
█ Sky        - Pioneer Pump
█ Fuchsia    - Nat. Tank & Equip.
█ Slate      - SunState
```
