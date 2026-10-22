Task: read the number on a multimeter's display in the photo.

- `display_text`: exactly what the display shows, including sign, decimal point and any unit symbols ("2.93", "-1.47", "OL", "1 .").
- `value`: the number as a decimal (e.g. 2.93), or null if the display shows OL / is unreadable / is blank.
- `unit`: "V" or "mV" if the display or the dial position tells you; "other" for ohms/amps; "unknown" if you can't tell.
- `is_dc_volts_mode`: "yes" if the dial points at DC volts (V with a straight line ⎓), "no" if clearly another mode, otherwise "unknown".
- `confident`: false for glare, a partly hidden display, or digits you are guessing (a 7-segment 1 vs 7, 5 vs 6, 8 vs 0).

Do not judge whether the battery is good. The app compares the number with the expected range.
