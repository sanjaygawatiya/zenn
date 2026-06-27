# Zenn Educational Animation Engine (ZEAE)
## Master Review Framework (MRF) v1.0

```text
Document ID: ZEAE-DOC-05
Document Name: Master Review Framework
Version: 1.0 Draft
Phase: Phase 4
Previous Document: 04_knowledge_base_architecture.md
Next Document: 06_storyboard_blueprint_specification.md
```

---

## 1. Objectives & The Judge Paradigm

The **Master Review Framework (MRF)** defines the rules of evaluation for all output artifacts in the Zenn Educational Animation Engine (ZEAE). 

Under the MRF, reviewer agents must operate strictly under the **Judge Paradigm**:
1. **No Subjective Opinions**: Reviewers are forbidden from rendering subjective design critiques (e.g. "this looks bad"). Every issue raised must prove non-compliance against a specific, documented rule in the active specifications.
2. **Spec-Gated Decisions**: Reviewers are not designers; they do not dictate style. They verify that the developer, planner, or renderer has stayed within the boundaries of the Constitution, VLS, Reference Specifications, and KB constraints.
3. **Evidence Requirement**: Every failure condition must be backed by quantitative evidence showing the delta between expected and measured values.

---

## 2. Quantitative Scoring Model & Formulas

Every reviewed artifact is graded on a scale of `1.0` (Critical failure) to `5.0` (Perfect compliance). The cumulative score is calculated using an architectural weighting model.

### Architectural Weights

Visual elements, code structures, and specifications are weighted by their importance to project integrity:

| Rule Category | Weight ($w_c$) | Target Domain |
| :--- | :---: | :--- |
| **Constitution** | `5.0` | Absolute constitutional alignment |
| **Operating System** | `4.0` | State machine and process limits |
| **Visual Language Rules (VLS)** | `3.5` | Composition, color, and margins |
| **Reference Analysis Rules** | `3.0` | Ingestion pipeline format alignment |
| **Knowledge Base Integrity** | `3.0` | Graph node provenance and updates |
| **Storyboard Rules** | `2.5` | Layouts, scene schemas, and timings |
| **Engine Architecture** | `2.5` | Module decoupled interfaces |
| **Rendering Standards** | `2.0` | Output formats and audio sync |
| **Performance** | `1.5` | Frame execution and compilation speeds |
| **Formatting** | `1.0` | Linter rules and spacing |

### Cumulative Score Equation
$$\text{Cumulative Score} = \frac{\sum_{i=1}^{n} (s_i \cdot w_i)}{\sum_{i=1}^{n} w_i}$$

Where:
- $s_i$: The raw score ($1.0$ to $5.0$) assigned to rule check $i$.
- $w_i$: The architectural category weight mapping category of rule $i$.

### PASS / FAIL Criteria
* **PASS**: Cumulative Score $\ge 4.0$ **AND** zero `BLOCKER` issues open.
* **FAIL**: Cumulative Score $< 4.0$ **OR** one or more `BLOCKER` issues open.
* **INSUFFICIENT_EVIDENCE**: The reviewer cannot gather enough telemetry or analysis to evaluate a rule. This state blocks pipeline progression and triggers a manual human override or additional test logging.

---

## 3. Severity & Issue Classifications

Issues identified during evaluation are grouped into three severity tiers.

1. **BLOCKER (Veto Severity)**:
   - *Definition*: Violations of the Project Constitution, structural type safety breaches, or circular dependency clashing.
   - *Impact*: Instantly triggers `FAIL` regardless of other scores. Halts workspace progression.
2. **MAJOR (Warning Severity)**:
   - *Definition*: Deviations from VLS boundaries (e.g. subject scale occupies 20% instead of VLS target 50%), caption length breaches, or timestamp overlaps.
   - *Impact*: Lowers the maximum possible cumulative score to `3.5`. Requires mandatory code rewrite or design adjustment.
3. **MINOR (Advisory Severity)**:
   - *Definition*: Non-blocking code lint deviations, stylistic suggestions, or file naming casing issues.
   - *Impact*: Reduces the check score slightly but does not halt progress.

---

## 4. Resilient Workspace Escalation Levels

To prevent infinite loops during automated AI refactoring runs, the workspace applies a 5-tier escalation path for consecutive review failures.

```
[Failure 1] ➔➔➔➔➔➔ [Failure 2] ➔➔➔➔➔➔ [Failure 3] ➔➔➔➔➔➔ [Failure 4] ➔➔➔➔➔➔ [Failure 5]
  Auto-Fix          Suggestions       Arch Review       Human Decision     Workspace Lock
```

1. **Failure 1: Auto-Fix**: The reviewer runs automated formatting and lint fixes (e.g., Prettier/ESLint corrections).
2. **Failure 2: Suggestions**: The reviewer outputs a detailed issue report with step-by-step remediation advice for the developer agent.
3. **Failure 3: Architecture Review**: The Architecture Reviewer agent is pulled in to verify if the issue stems from an API mismatch or outdated design blueprint.
4. **Failure 4: Human Decision Required**: The system pauses execution, writes a telemetry log, and sends a notification asking for human owner intervention.
5. **Failure 5: Workspace Lock**: The workspace is locked. All automated agents are suspended until the human owner commits a fix and resets the lock state.

---

## 5. Review Dimensions & Agent Mapping

Reviews are categorized into ten distinct dimensions, mapped to specialized reviewer agents.

| Review Dimension | Primary Reviewer Agent | Specifications Enforced |
| :--- | :--- | :--- |
| **Architecture** | Architecture Reviewer | `01_operating_system.md`, `docs/adr/*.md` |
| **Code** | Code Reviewer | Type safety, lint configs, code performance |
| **Knowledge** | Knowledge Base Reviewer | `04_knowledge_base_architecture.md`, `corpus.json` |
| **Storyboard** | Storyboard Reviewer | `02_visual_language_system.md` archetypes |
| **Visual** | Visual Reviewer | VLS composition, colors, text contrast |
| **Animation** | Video QA Reviewer | Motion easing, VLS motion budgets |
| **Audio** | Video QA Reviewer | Narration timing, sound sync metrics |
| **Rendering** | Video QA Reviewer | Output dimensions, constant frame rate |
| **Regression** | QA Tester | Automated test suites, legacy builds |
| **Release** | Release Manager | Manifest matching, metadata, tag verification |

---

## 6. Review Traceability & Permanent Registry

Every completed review run generates a unique, permanent trace ID tracking its history.

### Trace ID Schema
```text
RV-YYYY-NNNNNN
```
Where:
- `RV`: Review Prefix.
- `YYYY`: Calendar year.
- `NNNNNN`: Sequential numeric counter.

All approved blueprints, code files, and release video manifests must include their trace ID in their metadata headers:
```json
{
  "approvedBy": "RV-2026-000184"
}
```

### Review Revision History
The Knowledge Base logs every trace sequence (`Revision 1 (FAIL) ➔ Revision 2 (FAIL) ➔ Revision 3 (PASS)`). This provides the engine with historical data to identify which rules trigger the most failures and prioritize refactoring.

---

## 7. Reviewer Reliability Metrics

To ensure reviewers remain accurate, the system logs reliability parameters against human-reviewed baselines.

- **Reliability Metric ($R_{reviewer}$)**: The ratio of correct automated classifications to total reviews.
- **False Positive Rate ($F_{positive}$)**: Ratio of correct layouts flagged as failing.
- **False Negative Rate ($F_{negative}$)**: Ratio of failing layouts passed by the agent.

Automated reviewers are suspended and flagged for calibration if:
$$R_{reviewer} < 0.95 \quad \text{or} \quad F_{negative} > 0.02$$

---

## 8. Uniform Report Specifications

Every review report must follow this exact Markdown format.

```markdown
# [Dimension] Review Report: [Trace ID]

## 1. Metadata
- **Review Trace ID**: [RV-YYYY-NNNNNN]
- **Date**: [YYYY-MM-DD]
- **Dimension**: [Architecture | Code | Storyboard | Visual | Video QA | Regression]
- **Target Artifact**: [Filename with markdown link scheme]
- **State**: [PASS | FAIL | INSUFFICIENT_EVIDENCE]
- **Cumulative Score**: [X.XX / 5.0]
- **Reviewer Confidence**: [0.XX]

## 2. Revision History
- **Revision 1**: [Trace ID] - FAIL (Score: 2.8)
- **Revision 2**: [Trace ID] - PASS (Score: 4.2)

## 3. Score Breakdown
- **Category A (Weight W)**: [X.X]
- **Category B (Weight W)**: [X.X]

## 4. Evaluation Checklist
- [ ] **Checklist Item 1**: [PASS | FAIL | INSUFFICIENT_EVIDENCE] - [Rule reference]
- [ ] **Checklist Item 2**: [PASS | FAIL | INSUFFICIENT_EVIDENCE] - [Rule reference]

## 5. Issue Evidence Logs
| Issue ID | Rule ID | Expected Value | Measured Value | Evidence Context | Severity | Remediation Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MRF-001** | VLS-COMP-001 | `35% - 55%` | `22.4%` | Scale delta on scene 04 | Major | Increase subject scale |

## 6. Sign-off
- **Automated Agent Signature**: [Agent Name]
- **Reviewer Reliability Rating**: [0.XX]
```

---

## 9. Regression Validation Rules

To prevent downstream modifications from breaking historical builds, the following regression checks run during every testing cycle:

1. **Static Test Suite**: The QA Tester runs automated tests across all unmodified source code components.
2. **Visual Diff Testing**: The Video QA Reviewer compares rendered keyframe pixel differences against historical baselines ($T_{diff}$). Any structural layout shift delta $> 1.5\%$ triggers an automated `FAIL`.
3. **Metadata Validation**: The Release Manager runs validator scripts verifying that no modified JSON files violate their parent schemas in `reference/` or `knowledge_base/`.
