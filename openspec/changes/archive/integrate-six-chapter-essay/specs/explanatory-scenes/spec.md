# Spec Delta

## Purpose

Scenes and supplementary disclosures help readers see changes in circumstance and emotion while text alone continues to explain every essential point.

## ADDED Requirements

### Requirement: Authored explanatory scenes
At least 86 of the 87 beats SHALL display original artwork with cast identities and emotional states consistent with the explanation; s087 SHALL be an explicitly declared text-only source handoff. An undrawn beat MUST declare whether its art is pending or intentionally text-only, and final content MUST NOT include pending art or a pending-art frame. A meaningful static description SHALL explain each visual contribution; member names SHALL remain browser text above heads rather than image lettering. Invented friends SHALL be visibly and accessibly identified as fictional illustrations, not given member-like nametags.

#### Scenario: Conditions revealed
- **WHEN** an earlier joyful scene returns to expose its hidden conditions
- **THEN** the visual progression makes the changed explanation intelligible while the narrator and description retain the same meaning with reduced motion or no animation

#### Scenario: Text-only register
- **WHEN** a beat is intentionally a source-register handoff rather than an illustrated situation
- **THEN** its text and source labels are readable without a broken or pending-art frame

### Requirement: Supplementary interactions stay optional
Any expandable comparison or detail SHALL add context rather than the sole essential perspective or limitation, remain keyboard/touch reachable, and preserve progression and focus.

#### Scenario: Ignore a detail
- **WHEN** a visitor leaves all panels closed and presses Next
- **THEN** the main argument remains complete and the next beat is reached without a gate

#### Scenario: Open detail and switch view
- **WHEN** a visitor opens a detail then switches between presentation and continuous reading
- **THEN** the detail remains supplementary and its user-selected state and the current beat remain coherent
