// GENERATED FILE — do not edit.
// Source: public/simulator/corpus/*.json
// Regenerate with: npm run build:corpus
//
// The page imports this instead of fetching, because the venue's
// Content-Security-Policy blocks fetch (default-src 'none', no connect-src).

export const lexicon = [
  {
    "id": "discrimination",
    "label": "discrimination",
    "origin_year": 1866,
    "senses": [
      {
        "from": 1866,
        "to": 1963,
        "gloss": "a distinction drawn on the face of a rule or act",
        "reach": [
          "facial_classification"
        ]
      },
      {
        "from": 1964,
        "to": 2000,
        "gloss": "differential treatment, and practices whose unjustified differential effect is not explained by necessity",
        "reach": [
          "facial_classification",
          "disparate_treatment",
          "disparate_impact"
        ]
      },
      {
        "from": 2001,
        "to": null,
        "gloss": "intentional differential treatment; effects reach the statute only through regulations the individual cannot enforce",
        "reach": [
          "facial_classification",
          "disparate_treatment"
        ],
        "narrowed_by": "Alexander v. Sandoval (2001)"
      }
    ]
  },
  {
    "id": "author",
    "label": "author",
    "origin_year": 1790,
    "senses": [
      {
        "from": 1790,
        "to": 1908,
        "gloss": "the person from whom the work originates",
        "reach": [
          "natural_person",
          "originator"
        ]
      },
      {
        "from": 1909,
        "to": 1977,
        "gloss": "the originator, or an employer for whom the work was made, on an expansive reading of employment",
        "reach": [
          "natural_person",
          "originator",
          "employer_broad"
        ]
      },
      {
        "from": 1978,
        "to": null,
        "gloss": "the originator, unless the work was prepared by an employee in the scope of employment or falls in an enumerated category under a signed writing",
        "reach": [
          "natural_person",
          "originator",
          "employer_narrow"
        ],
        "narrowed_by": "1976 Act, effective 1978; CCNV v. Reid (1989)"
      }
    ]
  },
  {
    "id": "academic_judgment",
    "label": "academic judgment",
    "origin_year": 1900,
    "senses": [
      {
        "from": 1900,
        "to": 1974,
        "gloss": "evaluation of scholarly performance by those competent to evaluate it",
        "reach": [
          "evaluation"
        ]
      },
      {
        "from": 1975,
        "to": null,
        "gloss": "evaluation of scholarly performance, and increasingly any decision an institution characterises as academic rather than disciplinary",
        "reach": [
          "evaluation",
          "characterised_decisions"
        ],
        "narrowed_by": null
      }
    ]
  },
  {
    "id": "discretion",
    "label": "discretion",
    "origin_year": 1800,
    "senses": [
      {
        "from": 1800,
        "to": 1945,
        "gloss": "a power to choose, granted expressly and bounded by the grant",
        "reach": [
          "granted_bounded"
        ]
      },
      {
        "from": 1946,
        "to": 1970,
        "gloss": "a power to choose, presumed reviewable unless the statute withdraws review",
        "reach": [
          "granted_bounded",
          "presumptively_reviewable"
        ]
      },
      {
        "from": 1971,
        "to": null,
        "gloss": "a power to choose, unreviewable only in the rare case where the instrument supplies no law to apply",
        "reach": [
          "granted_bounded",
          "presumptively_reviewable",
          "residual_unreviewable"
        ]
      }
    ]
  },
  {
    "id": "record",
    "label": "record",
    "origin_year": 1900,
    "senses": [
      {
        "from": 1900,
        "to": 1973,
        "gloss": "the documents an institution chooses to keep",
        "reach": [
          "institutional_file"
        ]
      },
      {
        "from": 1974,
        "to": null,
        "gloss": "information directly related to a student and maintained by the institution, subject to inspection and correction",
        "reach": [
          "institutional_file",
          "student_correctable"
        ]
      }
    ]
  },
  {
    "id": "good_standing",
    "label": "good standing",
    "origin_year": 1900,
    "senses": [
      {
        "from": 1900,
        "to": null,
        "gloss": "a status conferred by satisfying published criteria — and, where criteria are unpublished, by whatever the institution says it means",
        "reach": [
          "published_criteria",
          "unpublished_criteria"
        ]
      }
    ]
  }
];

export const provisions = [
  {
    "id": "title_vi_601",
    "kind": "statute",
    "cite": "42 U.S.C. § 2000d (Title VI, § 601)",
    "enacted": 1964,
    "text": "No person in the United States shall, on the ground of race, color, or national origin, be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any program or activity receiving Federal financial assistance.",
    "terms": [
      "discrimination",
      "program_or_activity"
    ],
    "confers_private_right": true,
    "tracks": [
      "civil"
    ],
    "note": "Rights-creating text. Reaches intentional discrimination."
  },
  {
    "id": "title_vi_602",
    "kind": "statute",
    "cite": "42 U.S.C. § 2000d-1 (Title VI, § 602)",
    "enacted": 1964,
    "text": "Each Federal department and agency empowered to extend Federal financial assistance is authorized and directed to effectuate the provisions of section 2000d by issuing rules, regulations, or orders of general applicability.",
    "terms": [
      "program_or_activity"
    ],
    "confers_private_right": false,
    "tracks": [
      "civil"
    ],
    "note": "Directs agencies. Regulations issued under it reach effects, but the section is not rights-creating for a private claimant."
  },
  {
    "id": "sec_1983",
    "kind": "statute",
    "cite": "42 U.S.C. § 1983",
    "enacted": 1871,
    "text": "Every person who, under color of any statute, ordinance, regulation, custom, or usage, of any State subjects any citizen to the deprivation of any rights, privileges, or immunities secured by the Constitution and laws, shall be liable to the party injured.",
    "terms": [
      "discrimination"
    ],
    "confers_private_right": true,
    "tracks": [
      "civil",
      "governance"
    ],
    "note": "A vehicle, not a source. It carries only rights another provision already secures."
  },
  {
    "id": "copyright_201",
    "kind": "statute",
    "cite": "17 U.S.C. § 201(a)-(b)",
    "enacted": 1976,
    "text": "Copyright in a work protected under this title vests initially in the author or authors of the work. In the case of a work made for hire, the employer or other person for whom the work was prepared is considered the author, unless the parties have expressly agreed otherwise in a written instrument signed by them.",
    "terms": [
      "author"
    ],
    "confers_private_right": true,
    "tracks": [
      "ip"
    ],
    "note": "Default vests in the human author. The exception requires either employment in the agency sense or a signed writing."
  },
  {
    "id": "state_apa_review",
    "kind": "statute",
    "cite": "State Administrative Procedure Act § 706(2)(A) analogue",
    "enacted": 1946,
    "text": "The reviewing body shall hold unlawful and set aside action found to be arbitrary, capricious, an abuse of discretion, or otherwise not in accordance with law.",
    "terms": [
      "discretion"
    ],
    "confers_private_right": true,
    "tracks": [
      "admin"
    ],
    "note": "Template provision. Replace with the actual review statute for the jurisdiction under study."
  },
  {
    "id": "ferpa",
    "kind": "statute",
    "cite": "20 U.S.C. § 1232g (FERPA)",
    "enacted": 1974,
    "text": "No funds shall be made available to any educational agency or institution which has a policy of denying, or which effectively prevents, parents and students the right to inspect and review the education records of such students.",
    "terms": [
      "record"
    ],
    "confers_private_right": false,
    "tracks": [
      "admin",
      "fiduciary"
    ],
    "note": "Spending-clause condition on the institution, addressed to the funding agency. Not individually enforceable."
  },
  {
    "id": "enabling_act",
    "kind": "charter",
    "cite": "Institutional enabling act / board charter (template)",
    "enacted": 1969,
    "text": "The governing board shall have authority to establish policies for the admission, retention, discipline, and graduation of students, and to delegate such authority as it deems appropriate.",
    "terms": [
      "discretion",
      "good_standing"
    ],
    "confers_private_right": false,
    "tracks": [
      "governance",
      "admin"
    ],
    "supplies_standard": false,
    "note": "Grants the power and supplies no standard for its exercise. This silence is the load-bearing defect in the necessity-silence analysis."
  },
  {
    "id": "tn_divisive_concepts",
    "kind": "statute",
    "cite": "Tenn. Code Ann. § 49-6-1019 (prohibited concepts); related provisions in Title 49, Chapter 7, Part 19",
    "enacted": 2021,
    "text": "⟦OWED: verbatim text not retrieved. Every legal source was blocked by this environment's egress proxy. What follows is a paraphrase from search summaries, not the statute.⟧",
    "paraphrase": "Prohibits a course of instruction from including or promoting an enumerated list of concepts, among them: that one race or sex is inherently superior; that an individual is by virtue of race or sex inherently privileged, racist, sexist or oppressive; that an individual bears responsibility for acts committed by other members of the same race or sex; and that an individual should feel discomfort or guilt on account of race or sex. Enforced by withholding state funds from a district that violates it.",
    "terms": [
      "divisive_concept",
      "discomfort"
    ],
    "confers_private_right": false,
    "tracks": [
      "civil",
      "admin"
    ],
    "reaches": "instruction and training. On the sources available it does not reach exhibition or artistic work, but that boundary is OWED rather than confirmed.",
    "why_it_is_here": "It regulates by naming concepts. The enumerated list reaches explicitly for an affective state — discomfort, guilt — which means the drafters were aiming at the visceral and could only capture vocabulary. The experience the vocabulary pointed at is interstitial and temporal, and no statute names an interval. That gap is the object of study, not a loophole to exploit.",
    "provenance": {
      "basis": "none",
      "note": "PARAPHRASE, NOT TEXT. Sourced from search-result summaries only. Nothing in the simulator scores against this provision until the verbatim text is in the file.",
      "owed": "The verbatim enumerated list from a primary source, the exact sections, the amendment history since 2021, and whether any provision reaches beyond instruction and training.",
      "blocked_by": "egress proxy denied law.justia.com, tennessee.edu, tnstate.edu and law.counselstack.com"
    }
  }
];

export const precedents = [
  {
    "id": "sandoval",
    "short": "Sandoval",
    "cite": "Alexander v. Sandoval, 532 U.S. 275 (2001)",
    "year": 2001,
    "favours": "respondent",
    "tracks": [
      "civil"
    ],
    "covers": [
      "civil.private_right"
    ],
    "holding": "Section 601 reaches only intentional discrimination, and no private right of action exists to enforce disparate-impact regulations promulgated under section 602.",
    "rationale": "Rights of action are created by Congress, not inferred by courts. Section 601's rights-creating text does not carry over to regulations issued under a section that speaks to agencies rather than to persons.",
    "rationale_scope": "broad",
    "reliance": 0.85,
    "workability": 0.8,
    "erosion": 0.15,
    "factual_change": 0.2,
    "distinguishable_on": [
      {
        "fact": "intent_evidence_present",
        "value": true,
        "note": "Where intentional treatment is pleaded and supported, the claim proceeds under § 601 and Sandoval does not reach it."
      }
    ]
  },
  {
    "id": "gonzaga",
    "short": "Gonzaga",
    "cite": "Gonzaga University v. Doe, 536 U.S. 273 (2002)",
    "year": 2002,
    "favours": "respondent",
    "tracks": [
      "admin",
      "fiduciary"
    ],
    "covers": [
      "records.private_right"
    ],
    "holding": "FERPA's nondisclosure provisions create no personal rights enforceable under § 1983.",
    "rationale": "Spending-clause conditions phrased as directions to the funding agency, and focused on institutional policy rather than individual entitlement, do not confer individual rights.",
    "rationale_scope": "broad",
    "reliance": 0.8,
    "workability": 0.85,
    "erosion": 0.1,
    "factual_change": 0.15,
    "distinguishable_on": []
  },
  {
    "id": "ewing",
    "short": "Ewing",
    "cite": "Regents of the University of Michigan v. Ewing, 474 U.S. 214 (1985)",
    "year": 1985,
    "favours": "respondent",
    "tracks": [
      "admin"
    ],
    "covers": [
      "admin.academic_deference"
    ],
    "holding": "A genuinely academic decision is overturned only where it is such a substantial departure from accepted academic norms as to show that no professional judgment was actually exercised.",
    "rationale": "Courts lack the competence to re-grade, and the faculty's evaluative role is central to the institution's function.",
    "rationale_scope": "narrow",
    "reliance": 0.7,
    "workability": 0.6,
    "erosion": 0.3,
    "factual_change": 0.35,
    "distinguishable_on": [
      {
        "fact": "decision_was_disciplinary",
        "value": true,
        "note": "Deference attaches to evaluation of scholarship. A decision that is disciplinary in substance does not become academic by being labelled so."
      },
      {
        "fact": "stated_reason_shifted",
        "value": true,
        "note": "A shifting rationale is evidence that no professional judgment was exercised, which is the Ewing exception rather than an exception to it."
      }
    ]
  },
  {
    "id": "horowitz",
    "short": "Horowitz",
    "cite": "Board of Curators v. Horowitz, 435 U.S. 78 (1978)",
    "year": 1978,
    "favours": "respondent",
    "tracks": [
      "admin"
    ],
    "covers": [
      "admin.process_owed"
    ],
    "holding": "Dismissal for academic reasons requires less procedural protection than dismissal for disciplinary reasons, and no hearing is constitutionally required.",
    "rationale": "Academic evaluation is subjective and evaluative rather than adversarial, so the adversarial apparatus adds little.",
    "rationale_scope": "narrow",
    "reliance": 0.65,
    "workability": 0.55,
    "erosion": 0.35,
    "factual_change": 0.4,
    "distinguishable_on": [
      {
        "fact": "decision_was_disciplinary",
        "value": true,
        "note": "Horowitz expressly reserves disciplinary decisions to the Goss line."
      }
    ]
  },
  {
    "id": "goss",
    "short": "Goss",
    "cite": "Goss v. Lopez, 419 U.S. 565 (1975)",
    "year": 1975,
    "favours": "claimant",
    "tracks": [
      "admin"
    ],
    "covers": [
      "admin.process_owed"
    ],
    "holding": "Where a state confers an entitlement to education, it may not withdraw it for misconduct without notice of the charges and an opportunity to respond.",
    "rationale": "A state-created entitlement is property; process is what makes the deprivation lawful, and the cost of minimal process is slight.",
    "rationale_scope": "broad",
    "reliance": 0.8,
    "workability": 0.85,
    "erosion": 0.1,
    "factual_change": 0.1,
    "distinguishable_on": []
  },
  {
    "id": "accardi",
    "short": "Accardi",
    "cite": "United States ex rel. Accardi v. Shaughnessy, 347 U.S. 260 (1954)",
    "year": 1954,
    "favours": "claimant",
    "tracks": [
      "admin",
      "governance"
    ],
    "covers": [
      "admin.own_rules",
      "governance.warrant"
    ],
    "holding": "A body is bound by the regulations it has itself promulgated for so long as they remain in force.",
    "rationale": "The authority to make a rule and the authority to ignore it are not the same authority. Having bound itself, the body must be held to the binding.",
    "rationale_scope": "broad",
    "reliance": 0.75,
    "workability": 0.8,
    "erosion": 0.1,
    "factual_change": 0.1,
    "distinguishable_on": []
  },
  {
    "id": "state_farm",
    "short": "State Farm",
    "cite": "Motor Vehicle Mfrs. Ass'n v. State Farm Mutual, 463 U.S. 29 (1983)",
    "year": 1983,
    "favours": "claimant",
    "tracks": [
      "admin"
    ],
    "covers": [
      "admin.reasoned_decision"
    ],
    "holding": "Action is arbitrary and capricious where the decider failed to consider an important aspect of the problem or gave an explanation that runs counter to the evidence; the decision stands or falls on the reasons given at the time.",
    "rationale": "Review of reasons is the only mechanism that makes delegated power answerable; counsel's later rationalisation is not the decision under review.",
    "rationale_scope": "broad",
    "reliance": 0.85,
    "workability": 0.8,
    "erosion": 0.1,
    "factual_change": 0.15,
    "distinguishable_on": []
  },
  {
    "id": "overton_park",
    "short": "Overton Park",
    "cite": "Citizens to Preserve Overton Park v. Volpe, 401 U.S. 402 (1971)",
    "year": 1971,
    "favours": "claimant",
    "tracks": [
      "admin",
      "governance"
    ],
    "covers": [
      "admin.reviewability",
      "governance.warrant"
    ],
    "holding": "The exception for action committed to discretion is very narrow, applicable only where the instrument is drawn so that there is no law to apply.",
    "rationale": "The presumption is in favour of review; unreviewability must be shown from the instrument, not assumed from the subject matter.",
    "rationale_scope": "broad",
    "reliance": 0.8,
    "workability": 0.7,
    "erosion": 0.2,
    "factual_change": 0.2,
    "distinguishable_on": []
  },
  {
    "id": "reid",
    "short": "Reid",
    "cite": "Community for Creative Non-Violence v. Reid, 490 U.S. 730 (1989)",
    "year": 1989,
    "favours": "claimant",
    "tracks": [
      "ip"
    ],
    "covers": [
      "ip.authorship"
    ],
    "holding": "Whether a work is made for hire turns on common-law agency; absent employment in that sense, or a signed writing in an enumerated category, copyright vests in the author who created it.",
    "rationale": "The statutory categories are exclusive, and the writing requirement exists so that ownership is settled in advance rather than reconstructed afterwards.",
    "rationale_scope": "broad",
    "reliance": 0.85,
    "workability": 0.8,
    "erosion": 0.1,
    "factual_change": 0.15,
    "distinguishable_on": []
  },
  {
    "id": "donald_uka",
    "short": "Donald v. UKA",
    "cite": "Beulah Mae Donald v. United Klans of America, Inc. (S.D. Ala. 1987)",
    "year": 1987,
    "favours": "claimant",
    "tracks": [
      "civil",
      "governance"
    ],
    "covers": [
      "forum.tort",
      "governance.warrant",
      "civil.intent"
    ],
    "holding": "An organisation is liable in tort for acts its members commit in furtherance of the organisation's own stated principles. A jury returned $7 million against the United Klans of America; the judgment exceeded its assets and the organisation conveyed the deed to its national headquarters to the claimant.",
    "rationale": "Agency theory. The defendant's own structure — its hierarchy, its stated principles, its claim to be an organisation at all — is what makes it answerable for what its members did in service of it. The instrument of liability is the respondent's own account of itself.",
    "rationale_scope": "broad",
    "reliance": 0.7,
    "workability": 0.8,
    "erosion": 0.1,
    "factual_change": 0.15,
    "distinguishable_on": [],
    "why_it_matters_here": "This is the governance paradox answered in practice rather than in theory. A criminal prosecution reached two individuals and left the organisation intact. The tort action reached the organisation and ended it — without asking any authority to concede anything, because a tort judgment does not request a remedy, it executes against assets. The remedy was not a grant. It was a building.",
    "provenance": {
      "basis": "sourced",
      "sources": [
        "https://www.splcenter.org/resources/civil-rights-case-docket/donald-v-united-klans-america/",
        "https://www.tortmuseum.org/online-tour/donald-v-united-klans-of-america/",
        "https://en.wikipedia.org/wiki/Beulah_Mae_Donald"
      ],
      "confirmed": "Michael Donald lynched in Mobile, Alabama, March 1981. Civil suit brought by his mother with the Southern Poverty Law Center on an agency theory against the corporate UKA and its Imperial Wizard. Trial February 1987 before Judge Alex Howard; all-white jury; $7 million verdict. Judgment bankrupted the UKA, which conveyed its Tuscaloosa headquarters to Beulah Mae Donald.",
      "discrepancy": "One secondary source dates the deed transfer to May 1986, which precedes the February 1987 verdict and cannot be right as stated. The transfer date is recorded here as OWED rather than asserted.",
      "owed": "The docket number, the reported opinion if any, and the actual date of the conveyance, from a primary source. Nothing here rests on the transfer date."
    }
  }
];

export const conditions = [
  {
    "id": "civil.intentional",
    "track": "civil",
    "provision": "title_vi_601",
    "standard": "preponderance",
    "covers": [
      "civil.intent"
    ],
    "statement": "The adverse action was taken on the ground of race, in a program receiving federal financial assistance.",
    "elements": [
      {
        "id": "funding",
        "statement": "the respondent operates a program or activity receiving federal financial assistance",
        "principles": [
          "equal_protection"
        ],
        "covers": [
          "civil.intent"
        ],
        "test": {
          "fact": "federal_funding"
        }
      },
      {
        "id": "adverse",
        "statement": "an adverse action was taken against the claimant",
        "principles": [
          "equal_protection",
          "procedural_regularity"
        ],
        "covers": [
          "civil.intent"
        ],
        "test": {
          "fact": "adverse_action"
        }
      },
      {
        "id": "reach",
        "statement": "the statutory term reaches the theory pleaded",
        "term": "discrimination",
        "principles": [
          "equal_protection"
        ],
        "covers": [
          "civil.intent"
        ],
        "test": {
          "term": "discrimination",
          "reach": "disparate_treatment"
        }
      },
      {
        "id": "ground",
        "statement": "race was a ground of the action, shown by differential treatment of comparators together with a rationale that shifted",
        "principles": [
          "equal_protection",
          "institutional_candor",
          "non_arbitrariness"
        ],
        "covers": [
          "civil.intent"
        ],
        "test": {
          "all": [
            {
              "fact": "race_known_to_decisionmaker"
            },
            {
              "any": [
                {
                  "fact": "comparator_treatment_differs"
                },
                {
                  "fact": "stated_reason_shifted"
                }
              ]
            }
          ]
        }
      }
    ]
  },
  {
    "id": "civil.impact",
    "track": "civil",
    "provision": "title_vi_602",
    "standard": "preponderance",
    "covers": [
      "civil.private_right.disparate_impact"
    ],
    "statement": "A facially neutral practice produced an unjustified racial disparity, actionable by this claimant.",
    "elements": [
      {
        "id": "practice",
        "statement": "a specific facially neutral practice is identified",
        "principles": [
          "equal_protection"
        ],
        "covers": [
          "civil.private_right.disparate_impact"
        ],
        "test": {
          "fact": "neutral_practice_identified"
        }
      },
      {
        "id": "disparity",
        "statement": "the practice produced a racial disparity the respondent has not justified by necessity",
        "principles": [
          "equal_protection",
          "non_arbitrariness"
        ],
        "covers": [
          "civil.private_right.disparate_impact"
        ],
        "test": {
          "all": [
            {
              "fact": "statistical_disparity"
            },
            {
              "not": {
                "fact": "necessity_shown"
              }
            }
          ]
        }
      },
      {
        "id": "reach",
        "statement": "the statutory term reaches effects as well as intent",
        "term": "discrimination",
        "principles": [
          "equal_protection",
          "remedial_completeness"
        ],
        "covers": [
          "civil.private_right.disparate_impact"
        ],
        "test": {
          "term": "discrimination",
          "reach": "disparate_impact"
        }
      },
      {
        "id": "forum",
        "statement": "the provision relied on affords this claimant a private right of action",
        "principles": [
          "remedial_completeness"
        ],
        "covers": [
          "civil.private_right.disparate_impact"
        ],
        "test": {
          "provision": "title_vi_602",
          "confers_private_right": true
        }
      }
    ]
  },
  {
    "id": "admin.reasoned",
    "track": "admin",
    "provision": "state_apa_review",
    "standard": "arbitrary_capricious",
    "covers": [
      "admin.reasoned_decision",
      "admin.reviewability",
      "admin.academic_deference"
    ],
    "statement": "The decision was taken without a reason given at the time that the record will bear.",
    "elements": [
      {
        "id": "reviewable",
        "statement": "there is law to apply, so the decision is reviewable rather than committed to discretion",
        "term": "discretion",
        "principles": [
          "non_arbitrariness"
        ],
        "covers": [
          "admin.reviewability"
        ],
        "test": {
          "term": "discretion",
          "reach": "presumptively_reviewable"
        }
      },
      {
        "id": "no_contemporaneous_reason",
        "statement": "no reason was stated at the time, or the reason stated has since been replaced",
        "principles": [
          "non_arbitrariness",
          "institutional_candor"
        ],
        "covers": [
          "admin.reasoned_decision"
        ],
        "test": {
          "any": [
            {
              "fact": "stated_reason_shifted"
            },
            {
              "not": {
                "fact": "basis_disclosed"
              }
            }
          ]
        }
      },
      {
        "id": "not_academic",
        "statement": "the decision is disciplinary in substance and does not attract academic deference merely by its label",
        "term": "academic_judgment",
        "principles": [
          "procedural_regularity"
        ],
        "covers": [
          "admin.academic_deference"
        ],
        "test": {
          "fact": "decision_was_disciplinary"
        }
      }
    ]
  },
  {
    "id": "admin.own_rules",
    "track": "admin",
    "provision": "state_apa_review",
    "standard": "preponderance",
    "covers": [
      "admin.own_rules",
      "admin.process_owed"
    ],
    "statement": "The respondent departed from a process it had published and was bound to follow.",
    "elements": [
      {
        "id": "published",
        "statement": "the process relied on was published, or was a settled practice on which reliance was induced",
        "principles": [
          "self_binding",
          "reliance"
        ],
        "covers": [
          "admin.own_rules"
        ],
        "test": {
          "any": [
            {
              "institution": "published_policy",
              "ref": "grievance_procedure"
            },
            {
              "institution": "settled_practice",
              "ref": "advisor_review_before_action"
            }
          ]
        }
      },
      {
        "id": "departure",
        "statement": "the respondent departed from it in this case",
        "principles": [
          "self_binding",
          "procedural_regularity"
        ],
        "covers": [
          "admin.own_rules"
        ],
        "test": {
          "fact": "policy_departure"
        }
      },
      {
        "id": "not_harmless",
        "statement": "the departure bore on the outcome",
        "principles": [
          "procedural_regularity",
          "remedial_completeness"
        ],
        "covers": [
          "admin.process_owed"
        ],
        "test": {
          "not": {
            "fact": "outcome_would_be_same"
          }
        }
      }
    ],
    "vehicle_note": "The enabling act and the published grievance procedure supply the rule; the review statute supplies the forum. Accardi binds the body to its own rule, but it is not itself a right of action."
  },
  {
    "id": "ip.authorship",
    "track": "ip",
    "provision": "copyright_201",
    "standard": "preponderance",
    "covers": [
      "ip.authorship"
    ],
    "statement": "Copyright in the work vested in the claimant and was not transferred.",
    "elements": [
      {
        "id": "created",
        "statement": "the claimant created the work",
        "principles": [
          "authorial_ownership"
        ],
        "covers": [
          "ip.authorship"
        ],
        "test": {
          "fact": "work_authored_by_claimant"
        }
      },
      {
        "id": "author_reach",
        "statement": "the statutory term \"author\" reaches the claimant rather than the institution",
        "term": "author",
        "principles": [
          "authorial_ownership",
          "textual_fidelity"
        ],
        "covers": [
          "ip.authorship"
        ],
        "test": {
          "term": "author",
          "reach": "originator"
        }
      },
      {
        "id": "no_writing",
        "statement": "no signed written instrument transfers ownership, and the claimant was not an employee in the agency sense",
        "principles": [
          "authorial_ownership",
          "textual_fidelity"
        ],
        "covers": [
          "ip.authorship"
        ],
        "test": {
          "all": [
            {
              "not": {
                "fact": "written_assignment"
              }
            },
            {
              "not": {
                "fact": "employment_agency_relationship"
              }
            }
          ]
        }
      }
    ]
  },
  {
    "id": "fiduciary.candor",
    "track": "fiduciary",
    "provision": "ferpa",
    "standard": "preponderance",
    "covers": [
      "records.private_right",
      "admin.own_rules"
    ],
    "statement": "The respondent owed and breached a duty to disclose the basis on which it acted.",
    "elements": [
      {
        "id": "duty",
        "statement": "the respondent stood in a relationship of trust and control over the claimant's record and standing",
        "principles": [
          "institutional_candor",
          "reliance"
        ],
        "covers": [
          "records.private_right"
        ],
        "test": {
          "all": [
            {
              "fact": "institution_controls_record"
            },
            {
              "fact": "reliance_induced"
            }
          ]
        }
      },
      {
        "id": "record_reach",
        "statement": "the material withheld is a record the claimant may inspect and seek to correct",
        "term": "record",
        "principles": [
          "institutional_candor"
        ],
        "covers": [
          "records.private_right"
        ],
        "test": {
          "term": "record",
          "reach": "student_correctable"
        }
      },
      {
        "id": "breach",
        "statement": "the basis for the action was not disclosed",
        "principles": [
          "institutional_candor",
          "non_arbitrariness"
        ],
        "covers": [
          "records.private_right"
        ],
        "test": {
          "not": {
            "fact": "basis_disclosed"
          }
        }
      }
    ]
  },
  {
    "id": "fiduciary.common_law",
    "track": "fiduciary",
    "provision": "state_apa_review",
    "standard": "preponderance",
    "covers": [
      "fiduciary.duty"
    ],
    "statement": "Independently of any statute, the respondent owed a duty of care and candor arising from its control over the claimant's standing, and breached it.",
    "note": "The alternative pleading. fiduciary.candor routes through FERPA and dies at Gonzaga; this route does not depend on a spending-clause statute at all, which is the point of running both.",
    "elements": [
      {
        "id": "relationship",
        "statement": "the respondent held discretionary control over an interest of the claimant's that the claimant could not protect independently",
        "principles": [
          "institutional_candor",
          "reliance"
        ],
        "covers": [
          "fiduciary.duty"
        ],
        "test": {
          "all": [
            {
              "fact": "institution_controls_record"
            },
            {
              "institution": "discretion_above",
              "value": 0.5
            }
          ]
        }
      },
      {
        "id": "induced_reliance",
        "statement": "the respondent induced reliance on its published commitments",
        "principles": [
          "reliance",
          "self_binding"
        ],
        "covers": [
          "fiduciary.duty"
        ],
        "test": {
          "all": [
            {
              "fact": "reliance_induced"
            },
            {
              "institution": "published_policy",
              "ref": "nondiscrimination_statement"
            }
          ]
        }
      },
      {
        "id": "breach_candor",
        "statement": "the respondent acted against that interest without disclosing the basis",
        "principles": [
          "institutional_candor",
          "non_arbitrariness"
        ],
        "covers": [
          "fiduciary.duty"
        ],
        "test": {
          "all": [
            {
              "fact": "adverse_action"
            },
            {
              "not": {
                "fact": "basis_disclosed"
              }
            }
          ]
        }
      }
    ]
  },
  {
    "id": "governance.warrant",
    "track": "governance",
    "provision": "state_apa_review",
    "standard": "preponderance",
    "covers": [
      "governance.warrant"
    ],
    "statement": "The respondent holds its authority on terms it did not keep, and the relief sought is an exercise of that authority rather than a surrender of it.",
    "elements": [
      {
        "id": "conferred_on_terms",
        "statement": "the authority was conferred subject to stated purposes and published commitments",
        "principles": [
          "self_binding",
          "procedural_regularity"
        ],
        "covers": [
          "governance.warrant"
        ],
        "test": {
          "any": [
            {
              "institution": "published_policy",
              "ref": "nondiscrimination_statement"
            },
            {
              "fact": "charter_states_purpose"
            }
          ]
        }
      },
      {
        "id": "departure_from_warrant",
        "statement": "the exercise complained of departed from those terms",
        "principles": [
          "self_binding",
          "institutional_candor"
        ],
        "covers": [
          "governance.warrant"
        ],
        "test": {
          "fact": "policy_departure"
        }
      },
      {
        "id": "standardless",
        "statement": "the enabling act supplies no standard by which the exercise could have been guided or reviewed",
        "principles": [
          "non_arbitrariness",
          "institutional_candor"
        ],
        "covers": [
          "governance.warrant",
          "admin.reviewability"
        ],
        "test": {
          "all": [
            {
              "not": {
                "institution": "enabling_standard"
              }
            },
            {
              "institution": "has_conflict"
            }
          ]
        }
      }
    ],
    "vehicle_note": "Pleaded as review of a standardless exercise, not as a challenge to the charter itself. See the paradox layer analysis."
  }
];

export const passages = [
  {
    "kind": "complaint_to_docket",
    "requested": "that the grievance be treated as a grievance",
    "produced": "an acknowledgement, and then a reclassification to an informal process with no findings",
    "glitch": "substituted",
    "interval_days": 46,
    "decays": [
      "salience",
      "capacity"
    ],
    "sustains": [
      "documentation_practice"
    ],
    "note": "The first passage and the cheapest place for an institution to end a matter: not by deciding it, by re-describing it."
  },
  {
    "kind": "request_to_record",
    "requested": "the comparator files and the contemporaneous notes of the decision meeting",
    "produced": null,
    "glitch": "null_return",
    "interval_days": 210,
    "decays": [
      "evidence",
      "memory",
      "standing",
      "capacity"
    ],
    "sustains": [
      "community",
      "documentation_practice"
    ],
    "note": "The passage the whole claim rests on. The retention schedule in the institution profile permits destruction of exactly these files, which is why the null return is a finding about the schedule rather than about the request."
  },
  {
    "kind": "record_to_finding",
    "requested": "a determination on the documents that were produced",
    "produced": "a decision letter stating a ground not raised in the proceeding",
    "glitch": "reconstructed",
    "interval_days": 120,
    "decays": [
      "memory",
      "salience"
    ],
    "sustains": [
      "community",
      "public_record"
    ],
    "note": "A rationale that postdates the decision it explains gets none of the deference a contemporaneous one would. See admin.reasoned."
  },
  {
    "kind": "finding_to_remedy",
    "requested": "reinstatement, correction of the record, and an accounting for the work",
    "produced": "correction of the record only",
    "glitch": "partial",
    "interval_days": 90,
    "decays": [
      "standing",
      "capacity"
    ],
    "sustains": [
      "counsel",
      "institutional_ally"
    ],
    "note": "Being right is not being restored. The remedy that arrives is usually the cheapest one on the list."
  },
  {
    "kind": "remedy_to_repair",
    "requested": "the interval closed — standing restored and the years accounted for",
    "produced": null,
    "glitch": "timed_out",
    "interval_days": 365,
    "decays": [
      "capacity",
      "salience",
      "standing"
    ],
    "sustains": [
      "community"
    ],
    "note": "Nobody supervises this passage. It is not in anyone's jurisdiction and it is where the actual loss sits."
  }
];

export const claim = {
  "id": "template-education-civil-ip-fiduciary",
  "title": "Template case: adverse academic action with civil-rights, authorship, fiduciary, and governance dimensions",
  "disclaimer": "This is a parameterised template, not a record of any real proceeding. Every fact below is a dial. Replace the values, strengths, and sources with the actual record before drawing any conclusion about a real matter.",
  "year": 2026,
  "remedy": "reinstatement, correction of the record, an accounting for the work, and compensation for the interval",
  "instrument": "the respondent's charter, its published nondiscrimination statement, and its grievance procedure",
  "attacks": [
    {
      "layer": "constitutive",
      "weight": 1,
      "statement": "The respondent's authority over the claimant's standing was never legitimately held"
    },
    {
      "layer": "competence",
      "weight": 1,
      "statement": "The particular decision was taken without a stated, reviewable basis"
    }
  ],
  "relief_requires_disavowal": true,
  "facts": {
    "federal_funding": {
      "value": true,
      "strength": 0.95,
      "source": "published federal award data"
    },
    "adverse_action": {
      "value": true,
      "strength": 0.9,
      "source": "the decision letter"
    },
    "race_known_to_decisionmaker": {
      "value": true,
      "strength": 0.8,
      "source": "in-person proceedings"
    },
    "comparator_treatment_differs": {
      "value": true,
      "strength": 0.6,
      "source": "comparator files, partial"
    },
    "stated_reason_shifted": {
      "value": true,
      "strength": 0.75,
      "source": "successive letters give different grounds"
    },
    "intent_evidence_present": {
      "value": true,
      "strength": 0.6
    },
    "neutral_practice_identified": {
      "value": true,
      "strength": 0.7
    },
    "statistical_disparity": {
      "value": true,
      "strength": 0.55,
      "source": "small-N institutional data"
    },
    "necessity_shown": {
      "value": false,
      "strength": 0.6
    },
    "decision_was_disciplinary": {
      "value": true,
      "strength": 0.7,
      "note": "the decision was labelled academic but proceeded on allegations of conduct"
    },
    "basis_disclosed": {
      "value": false,
      "strength": 0.85
    },
    "policy_departure": {
      "value": true,
      "strength": 0.8,
      "source": "grievance procedure §4 not followed"
    },
    "outcome_would_be_same": {
      "value": false,
      "strength": 0.5
    },
    "work_authored_by_claimant": {
      "value": true,
      "strength": 0.9
    },
    "written_assignment": {
      "value": false,
      "strength": 0.85
    },
    "employment_agency_relationship": {
      "value": false,
      "strength": 0.7
    },
    "institution_controls_record": {
      "value": true,
      "strength": 0.95
    },
    "reliance_induced": {
      "value": true,
      "strength": 0.7
    },
    "charter_states_purpose": {
      "value": true,
      "strength": 0.85
    },
    "exhausted": {
      "value": true,
      "strength": 0.7
    },
    "within_limitations": {
      "value": true,
      "strength": 0.8
    }
  }
};

export const institution = {
  "id": "respondent-institution",
  "name": "the respondent institution",
  "note": "A template profile. `regime` is inferred from policy_density and conflicts when omitted. Set it explicitly to force a regime.",
  "policy_density": 0.35,
  "discretion": 0.75,
  "enabling_act": "enabling_act",
  "enabling_act_supplies_standard": false,
  "published_policies": [
    "grievance_procedure",
    "nondiscrimination_statement"
  ],
  "settled_practices": [
    "advisor_review_before_action"
  ],
  "conflicts": [
    {
      "between": [
        "grievance_procedure",
        "academic_integrity_policy"
      ],
      "note": "One requires advisor review before any action; the other authorises immediate action by the chair. Both cannot be followed in the same case."
    },
    {
      "between": [
        "records_retention_schedule",
        "nondiscrimination_statement"
      ],
      "note": "The retention schedule permits destruction of the comparator files the nondiscrimination process would need in order to function."
    }
  ]
};

export const corpus = { lexicon, provisions, precedents, conditions, passages, claim, institution };
export default corpus;
