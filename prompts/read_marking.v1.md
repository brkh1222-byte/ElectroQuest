Task: read the printed marking on ONE electronic component in the photo crop. The detector thinks it is a `part_type` (from the input).

- `lines`: every line of printed text exactly as you see it, top to bottom, including values like "100µF", "16V", "104", "NE555P", "BC547B". Use µ for micro. Leave out logos.
- `part_number`: the part number if one is printed (chips and transistors: "NE555", "BC547", "2N2222"; leave suffix letters as printed). null for capacitors and anything without a part number.
- `capacitor_kind`: "electrolytic" for a cylindrical can with a stripe, "ceramic" for a small disc or blob, otherwise "unknown".
- `confident`: false if the text is blurry, partly hidden, or you are inferring characters.
- `note`: in {{lang}}, one short sentence for the user, e.g. how to get a better photo if the text is unreadable.

Do not convert or calculate values. Only transcribe.
