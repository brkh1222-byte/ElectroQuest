Task: look at a photo of the open circuit board of a broken battery-powered device (named in the input) and report VISIBLE physical defects only.

Look for exactly these defect types:
- corrosion: green, white or blue crust; rust on battery springs or contacts
- burn_mark: brown or black scorched area, melted plastic
- bulging_capacitor: a capacitor whose top is domed or leaking
- cracked_joint: a ring-shaped crack around a component leg, a dull grey grainy joint, or a leg that moves in its joint
- lifted_leg: a component leg no longer touching its pad, or a pad torn off the board
- missing_part: an empty footprint with solder pads where a part clearly used to be
- worn_pad: rubber button pads with grey, shiny or worn-through black carbon dots
- liquid_residue: dried drink/water stains, sticky film, tide marks

For each finding:
- `box`: where it is, as fractions of the image (x, y = top-left corner, w, h; all 0–1). Keep boxes tight.
- `confidence`: 0–1. Use below 0.5 when you are unsure; it is fine to report an unsure finding.
- `label`: in {{lang}}, plain words a beginner understands, e.g. "Battery spring is corroded (green crust)".

`hints` (input) lists where problems usually are for this device; check those places first, but report only what you can actually see.
If the photo is blurry, too dark, too far away, or not a circuit board, set `image_quality` accordingly and return no findings.
Never claim an electrical fault (dead chip, weak battery, broken internal trace) from a photo.
`summary`: one or two short sentences in {{lang}}.
