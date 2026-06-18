# Architecture

Architecture documents describe the intended technical shape of the system. They give deliverable specifications a stable design source so each implementation slice does not optimize only for the nearest local pattern.

## Levels

Use two levels when needed:

- `architecture/project.md`: project-wide system shape, module boundaries, deployment model, integration patterns, data ownership, and cross-cutting technical decisions.
- `architecture/<feature>.md`: feature-level design for a long-lived capability or milestone sequence.

Small projects may start with only one architecture document. Add feature-level architecture when a capability spans multiple deliverables, services, data models, user journeys, or milestone phases.

## Recommended Contents

- Current system context and constraints
- Important module, service, data, or UI boundaries
- Data ownership and integration contracts
- Sequence or flow diagrams for important paths
- Milestone-level implementation sequence when relevant
- Technical decisions with rationale
- Risks and open questions
- Links to governing standards

## Relationship To Specifications

Architecture documents guide implementation strategy. Deliverable specifications define one bounded implementation contract. A specification should link to the relevant architecture section and state the specific decision it depends on.

If implementation reveals an architecture decision is wrong, update the architecture document through normal review. Do not let one deliverable silently fork the intended system shape.

## Relevant Skills

| Skill | How it helps efficiency |
| ----- | ----------------------- |
| `architecture-doc-builder` | Structures system design, module placement, data ownership, sequence flow, and open questions so specs start from stable technical intent. |
| `proposal-builder` | Compares architectural options before the team commits to a costly direction. |
| `spec-builder` | Converts accepted architecture into bounded implementation contracts without re-litigating design decisions. |
| `conformance` | Makes targeted architecture-doc or standards alignment updates when implementation exposes drift. |
| `doc-check` | Checks formatting, links, and doc hygiene after architecture edits. |

## Related Sections

- [Project Document](./project.md)
- [Features and Milestones](./features-and-milestones.md)
- [Specifications](./specifications.md)
