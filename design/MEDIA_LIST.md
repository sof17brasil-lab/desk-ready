# Media list

Everything the site needs, where it goes, and where it comes from.
Save photos into `design/media/photos/` with the exact file name below. Claude Code converts them to WebP and copies them to `web/public/media/`.

## Photos (final, all already in design/media/photos/)
Credit line everywhere: "Photos: Unsplash". No photographer names (Sofia's choice). Sofia's own image is credited "Truck image: Sofia Mota".
All photos display in black and white (CSS `filter: grayscale(1)`).

| File | Used in | Edit made |
|---|---|---|
| `hero-truck-branded.webp` | Home: truck that drives through the title | Sofia's own image; cut out, turned to face right. Only 733 px wide |
| `p1-winter-highway-truck.jpg` | Home: winter band. Winter page: stacking card "Before booking" | License plate blurred |
| `p2-steel-drums.jpg` | Winter page: horizontal card "Drums and totes · 55 and 275 gal" | None |
| `p4-bulk-tank-trailer.jpg` | Winter page: horizontal card "Bulk · tank truck" | Cropped to remove carrier name, web address, phone, plate. 1273 px wide: card size only |
| `p9-closing-band-aerial-terminal.jpg` | Home: closing band. Winter page: horizontal card "Every load starts at a dock" | None |
| `p7-cold-snap-street.jpg` | Winter page: stacking card "Cold snap in transit" | Small sticker blurred |
| `p8-arrived-cold.jpg` | Winter page: stacking card "Arrived cold" | Cropped to remove grille badge and trailer lettering |

No totes, rail, or desk photos: the totes share the drums card, rail is mentioned in text only, and "Before booking" uses the highway photo. Winter and Method pages end with a solid black band (no photo).

Not used: red mountain truck (brand on grille), snow groomer (not freight), Philadelphia street (signs), Uber Truck press-style photo.

## 3. Made by Claude Code from code (no download)

| Item | Used for | Notes |
|---|---|---|
| All charts (dumbbell, heat map, coldest-day strips) | Winter page sections 02 to 04 | SVG from web/public/data/*.json |
| Grid background on the sticky panels | Home: the four problem panels | CSS only, from the smooth-scroll component |
| Icons (truck, clock, warehouse, shield, thermometer, phone) | Problem panels, playbook cards | lucide-react, already allowed by your component prompts |
| Favicon | Browser tab | Simplified truck from tank-truck.svg, SVG |
| Share image `og-image.png` 1200 x 630 | Preview when the link is posted on LinkedIn or in email | Title "Why carriers say no", the 78% figure, your name. White background, your colors |

## 4. You provide (optional)

| Item | Where | Notes |
|---|---|---|
| Your color screenshot (the "clean look" you mentioned) | `screenshots/reference/clean-look.png` | Claude Code copies its colors exactly |
| 2 to 3 screenshots of mvplogistics.eu | `screenshots/reference/` | For layout feel only |
| Headshot | `design/media/photos/headshot.jpg` | Only if you want a small "About Sofia" in the footer |

## 5. Made after the site is live (for applying)

| Item | Use |
|---|---|
| 4 screenshots: home and winter page, desktop and phone | README on GitHub, LinkedIn post |
| 60 to 90 second screen recording (MP4) walking through one load check | Send to Eden or a recruiter; link from the README |
| 10 second GIF of the truck intro | Top of the README |

## Credits
| Item | Credit |
|---|---|
| Hero truck image | Sofia Mota |
| All other photos | Unsplash (Unsplash License) |
| Tank-truck and top-view truck drawings (backups) | Original, made for this project |
