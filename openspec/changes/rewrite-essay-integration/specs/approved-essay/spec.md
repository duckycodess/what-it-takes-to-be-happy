## ADDED Requirements

### Requirement: Approved narrative is canonical
The website SHALL present all 45 s088–s132 scenes in approved authored order with exact headings, narrator blocks and dialogue, caveats, claim-level numbered citation labels, and only approved shared interface text; no renderer-added bridge, caption or repetitive apparatus may appear.

#### Scenario: Every reading route
- **WHEN** a reader uses scene, continuous, scriptless or print presentation
- **THEN** every essential block matches the approved Markdown in authored order, with no missing or additional narrative sentence.

### Requirement: Generated art is an inspected prerequisite
Each illustrated scene SHALL use only its declared generated artwork and exact alternative text; all depicted members' names and all dialogue SHALL remain selectable browser text, with frameless reflow and no overlap at phone/desktop widths.

#### Scenario: An essential asset is missing
- **WHEN** A02–A18 lack selected image, prompt, completed manifest, dimensions or checksum
- **THEN** validation/build/signoff refuse to claim the integration is complete; no substitute authored production drawing is displayed as final.

### Requirement: Landing and text-only scenes contain only approved material
The landing SHALL contain only the approved title, A01, Begin and Sources & Credits. No progress score, reading-time promise, byline or subtitle SHALL display. Theory and source-heavy scenes declared `text` SHALL not receive decorative illustrations.

#### Scenario: Landing and theory scene
- **WHEN** a visitor opens the landing and then a declared text scene
- **THEN** only the approved landing elements and that scene's text appear, without supplementary narration or artwork.

### Requirement: Reader movement is complete and optional interactions remain optional
Next/Back SHALL traverse the 45 scenes with landing and ending behavior as approved; chapters revisit approved anchors, continuous and print include the full argument, and the two comparisons SHALL not hide essential text.

#### Scenario: Keyboard or reduced-motion reader
- **WHEN** a visitor advances via keyboard, switches comparison states or requests reduced motion
- **THEN** the same essential argument and explanatory states remain available without generic entrance effects or forced reveal.
