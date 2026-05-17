export type DS160Field = {
  label: string;
  guidance: string;
  gotcha?: string;
};

export type DS160Section = {
  id: string;
  title: string;
  subtitle?: string;
  fields: DS160Field[];
};

export const DS160_LAST_REVIEWED = "May 2026";

export const DS160_CHECKLIST: { id: string; label: string; hint?: string }[] = [
  { id: "passport", label: "Valid passport", hint: "Number, issue date, expiration date, place of issue" },
  { id: "i797", label: "I-797 / I-129 receipt notice", hint: "Receipt number (EAC/WAC/SRC/LIN/IOE) and petition validity dates" },
  { id: "employer", label: "Employer details", hint: "Legal name, address, phone, your start date and salary" },
  { id: "us-address", label: "US address where you'll stay", hint: "Hotel, employer office, or relative's address — must be a real US address" },
  { id: "travel-history", label: "Prior US travel dates", hint: "Approximate arrival + length of each visit in the last 5 years" },
  { id: "visa-history", label: "Prior US visa numbers", hint: "Old visa stamps, prior denial codes (214(b), 221(g)) if any" },
  { id: "family", label: "Family info", hint: "Parents' names + DOBs, spouse details, children's details if any" },
  { id: "education", label: "Education history", hint: "Schools attended after age 14, with addresses and dates" },
  { id: "social", label: "Social media handles (last 5 years)", hint: "Required for every platform you've used" },
  { id: "photo", label: "Digital photo (5MB max, 600x600+)", hint: "Recent, white background, no glasses" },
];

export const DS160_GOTCHAS: { title: string; body: string }[] = [
  {
    title: "20-minute timeout will erase your work",
    body: "If you're idle for 20 minutes, the session expires and all data is lost. Hit Save at the bottom of the page often, and download a local copy ('Save Application to File') if you'll step away.",
  },
  {
    title: "Names must match your passport exactly",
    body: "Surname and Given Name fields should be identical to your passport's machine-readable zone. If you've used another name on transcripts (maiden, prior surname), declare it under 'Other names used'.",
  },
  {
    title: "No accents or special characters",
    body: "The form does not accept ñ, é, ü, ç. Type names like Muñoz as Munoz unless a field specifically requests the native alphabet.",
  },
  {
    title: "Native alphabet → 'Does Not Apply'",
    body: "For 'Full Name in Native Alphabet', most Indian applicants should select 'Does Not Apply' even if you have a native script — the field is for scripts the consulate recognizes natively.",
  },
  {
    title: "Aadhaar is NOT the National Identification Number",
    body: "Leave the National ID field as 'Does Not Apply'. Aadhaar is not what they're asking for.",
  },
  {
    title: "Print the confirmation page immediately",
    body: "After submission, print the DS-160 confirmation page with the barcode. You cannot reprint the form itself after logout — only the confirmation. You must carry the confirmation to OFC and interview.",
  },
];

export const DS160_SECTIONS: DS160Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    subtitle: "Before you click anything on ceac.state.gov",
    fields: [
      {
        label: "Pick your consulate location",
        guidance: "Choose the consulate where you'll have your interview based on your state of residence in India. Mumbai, Delhi, Chennai, Hyderabad, and Kolkata are the options; Hyderabad handles AP/Telangana, Chennai handles TN/Kerala, etc.",
        gotcha: "Once you generate the application ID, the location is locked in. Double-check before clicking Continue.",
      },
      {
        label: "Application ID + security question",
        guidance: "Write down your Application ID the moment it's shown. Pick a security question and answer you'll remember in 6 months — you'll need both to resume the application after any logout or timeout.",
        gotcha: "There is no 'forgot password' for this ID. Lose it and you start a brand-new application from scratch.",
      },
    ],
  },
  {
    id: "personal-1",
    title: "Personal Information 1",
    subtitle: "Name, gender, DOB, place of birth",
    fields: [
      {
        label: "Surname / Given Name",
        guidance: "Type them exactly as printed on the passport bio page — no abbreviations, no shortened forms, no extra spaces.",
        gotcha: "If your passport puts your full name in 'Given Name' and leaves Surname blank, mirror that exactly. Mismatches here are the #1 cause of administrative processing delays.",
      },
      {
        label: "Full Name in Native Alphabet",
        guidance: "Select 'Does Not Apply' for most Indian applicants.",
      },
      {
        label: "Have you ever used other names?",
        guidance: "Say 'No' unless you've actually used a different name on official documents — maiden name, prior surname, name on academic transcripts that differs from the passport.",
        gotcha: "If your degree certificate or work documents use a different spelling/order than your passport, declare that variant here. Consular officers cross-check.",
      },
      {
        label: "Telecode representation",
        guidance: "'Does Not Apply' — this is only for applicants whose native name uses Chinese telegraphic code.",
      },
      {
        label: "Sex / Marital Status / Date of Birth / City and Country of Birth",
        guidance: "All as per passport. City of birth = the city printed on your passport, not your current residence.",
      },
    ],
  },
  {
    id: "personal-2",
    title: "Personal Information 2",
    subtitle: "Nationality, national ID, SSN, taxpayer ID",
    fields: [
      {
        label: "Country / Region of Origin (Nationality)",
        guidance: "Your current passport-issuing country.",
      },
      {
        label: "Other nationalities held",
        guidance: "Select 'No' unless you actually hold a second passport. OCI is not another nationality.",
      },
      {
        label: "National Identification Number",
        guidance: "Select 'Does Not Apply'.",
        gotcha: "Aadhaar, PAN, and Voter ID are NOT the National Identification Number for DS-160 purposes. Leave this as Does Not Apply.",
      },
      {
        label: "US Social Security Number / Taxpayer ID Number",
        guidance: "Only fill in if you have ever been issued one (prior US work, prior visa). Otherwise 'Does Not Apply'.",
      },
    ],
  },
  {
    id: "address",
    title: "Address & Phone",
    subtitle: "Home, mailing, phone numbers, email",
    fields: [
      {
        label: "Home Address",
        guidance: "Your current residential address in India (or country of residence). This should match your passport address; if it doesn't because you've moved, use the current actual address.",
      },
      {
        label: "Mailing Address",
        guidance: "Select 'Same as Home Address' unless your mail genuinely goes somewhere else.",
      },
      {
        label: "Primary / Secondary / Work Phone",
        guidance: "Enter at least your primary mobile in international format (e.g., +91-XXXXXXXXXX). For work phone use your current employer in India; if currently unemployed select 'Does Not Apply'.",
      },
      {
        label: "Email Address",
        guidance: "Use an email you actively monitor — the consulate uses this for 221(g) follow-ups and administrative processing requests.",
      },
      {
        label: "Additional phone numbers / email addresses used in the last 5 years",
        guidance: "List every personal email and phone number you've used in the last 5 years, even old/inactive ones. Required.",
        gotcha: "This is one of the most undercounted fields. List the alumni email, the old Gmail, the work phone from your prior job. Officers can verify.",
      },
      {
        label: "Social Media Presence (last 5 years)",
        guidance: "For each platform (Facebook, Instagram, X/Twitter, LinkedIn, etc.), enter the handle/username (not URL, no @). If you've never used a platform, leave it.",
        gotcha: "Skipping a platform you actively use is treated as misrepresentation. List handles even for accounts you rarely post on.",
      },
    ],
  },
  {
    id: "passport",
    title: "Passport",
    subtitle: "Passport details for the current valid book",
    fields: [
      {
        label: "Passport / Travel Document Type",
        guidance: "Select 'Regular'.",
      },
      {
        label: "Passport Number",
        guidance: "Exactly as on the passport bio page. No spaces.",
      },
      {
        label: "Passport Book Number",
        guidance: "Select 'Does Not Apply' for Indian passports — there is no separate book number.",
      },
      {
        label: "Country / Authority that issued / City / Country issued in",
        guidance: "All as per the passport. Issuing authority for Indian passports is typically the regional Passport Office (e.g., Mumbai, Hyderabad).",
      },
      {
        label: "Issuance / Expiration Date",
        guidance: "From the passport bio page.",
        gotcha: "Your passport must be valid for at least 6 months beyond your intended US stay. If you're close to expiry, renew before applying.",
      },
      {
        label: "Have you ever lost or had your passport stolen?",
        guidance: "Answer truthfully. If yes, provide the police report or replacement details — this is verified.",
      },
    ],
  },
  {
    id: "travel",
    title: "Travel",
    subtitle: "Purpose of trip, dates, US address",
    fields: [
      {
        label: "Purpose of Trip to the US",
        guidance: "Select 'Temporary Employee (H)' for H-1B applicants, then 'H1B - Specialty Occupation' as the specific purpose. For H-4 dependents, select 'Spouse/Child of an H' and 'H-4'.",
      },
      {
        label: "Have you made specific travel plans?",
        guidance: "Select 'No' unless you have flight tickets booked. Most applicants select No — you don't book flights before the visa is approved.",
      },
      {
        label: "Intended Date of Arrival in US",
        guidance: "For H-1B: pick a realistic date around or after your I-129 petition's validity start date and your planned employment start. For H-4: same as your H-1B principal's arrival, or after.",
        gotcha: "Don't enter a date before your I-797 validity start date or before your employment start date. Officers check this against your petition.",
      },
      {
        label: "Intended Length of Stay",
        guidance: "Enter the validity period of your H-1B petition (typically 3 years initial, up to 6 years total). For H-4, match the principal's validity.",
      },
      {
        label: "Address Where You Will Stay in the US",
        guidance: "Use your US employer's worksite address, your apartment if you've already leased one, or a hotel/extended-stay if not yet decided. It must be a real, complete US address.",
        gotcha: "Do not leave this blank or put 'TBD'. A complete address is required even if your actual housing isn't finalized.",
      },
      {
        label: "Person/Entity Paying for Your Trip",
        guidance: "For H-1B: select 'Other Company/Organization' and enter your US employer (the petitioner). Your employer is paying for the visa per H-1B rules. For H-4: select 'Other Person' and enter the H-1B principal's name + relationship.",
      },
    ],
  },
  {
    id: "companions",
    title: "Travel Companions",
    subtitle: "Family or group travelers",
    fields: [
      {
        label: "Are there other persons traveling with you?",
        guidance: "For H-1B principals filing alone: 'No'. For H-1B + H-4 families filing together: 'Yes' and list each dependent (spouse, children). For H-4 dependents: list your H-1B spouse and any siblings.",
        gotcha: "This is the opposite of F-1 advice. H-4 dependents are normal and expected — declare them when applicable.",
      },
    ],
  },
  {
    id: "previous-us-travel",
    title: "Previous US Travel",
    subtitle: "Past visits, prior visas, prior denials",
    fields: [
      {
        label: "Have you ever been in the US?",
        guidance: "Say 'Yes' if you've ever visited, including F-1 student years, prior H-1B, B1/B2 trips, layovers don't count. For each visit, give approximate arrival date and length of stay.",
      },
      {
        label: "Have you ever been issued a US visa?",
        guidance: "Say 'Yes' if you've ever had a US visa stamped, even if you never traveled on it. Provide the visa number (printed on the visa itself).",
      },
      {
        label: "Have you ever been refused a US visa?",
        guidance: "Say 'Yes' if you've ever been refused — including 214(b) and 221(g). Enter the section of law (e.g., 214(b), 221(g)) in the explanation. If you don't remember the section, say 'Reason unknown — do not recall'.",
        gotcha: "A 221(g) administrative processing slip counts as a refusal for DS-160 purposes, even if the visa was later issued. When in doubt, declare and explain.",
      },
      {
        label: "Has anyone ever filed an immigrant petition for you?",
        guidance: "Say 'Yes' if a family-based or employment-based I-130/I-140/I-526 has ever been filed for you, even if withdrawn or denied. Most H-1B applicants without a green card process say 'No'.",
        gotcha: "If your employer has filed a PERM and I-140 for you, that's a 'Yes'. Hiding it is misrepresentation.",
      },
      {
        label: "Driver's license / SSN from prior US stay",
        guidance: "If you held a US driver's license or SSN during a prior stay (F-1 OPT, prior H-1B), provide the details. Otherwise 'Does Not Apply'.",
      },
    ],
  },
  {
    id: "us-contact",
    title: "US Point of Contact",
    subtitle: "Who to contact upon arrival",
    fields: [
      {
        label: "Contact Person or Organization in the US",
        guidance: "For H-1B: enter your petitioner / US employer. Contact person = your HR contact, manager, or the company itself (use 'Organization' name). Address and phone are your employer's. For H-4: use your H-1B principal's employer if you don't have your own US contact yet.",
        gotcha: "Don't list a friend or relative as the primary contact unless your situation truly has no employer contact. The petitioner is the expected answer.",
      },
      {
        label: "Relationship to You",
        guidance: "Select 'Employer' for the petitioning company. For H-4, select 'Spouse' / 'Parent' / 'Relative' as appropriate.",
      },
    ],
  },
  {
    id: "family",
    title: "Family",
    subtitle: "Parents, spouse, relatives in the US",
    fields: [
      {
        label: "Father's / Mother's Surname, Given Name, Date of Birth",
        guidance: "As per their passports if available. If parents don't have passports, follow the format Given Name + Middle Name in 'Given Name' and surname in 'Surname'.",
      },
      {
        label: "Is your father / mother in the US?",
        guidance: "Say 'Yes' only if they currently reside in the US. Specify their status (US citizen, LPR, H-1B, etc.).",
      },
      {
        label: "Immediate relatives in the US (other than parents/spouse)",
        guidance: "'Immediate' here means siblings. List a sibling in the US with their status. Cousins, uncles, aunts are NOT immediate relatives.",
        gotcha: "Be honest about siblings. Officers cross-check via prior applications.",
      },
      {
        label: "Other relatives in the US",
        guidance: "Mention first cousins or relatives whose home you or your immediate family have actually visited. Distant cousins you've never met can be skipped.",
      },
      {
        label: "Spouse details (if married)",
        guidance: "Full name as per spouse's passport, DOB, nationality, city/country of birth, and address. If spouse is the H-1B principal and you're filing H-4, enter their details fully.",
      },
    ],
  },
  {
    id: "work-present",
    title: "Work / Education / Training — Present",
    subtitle: "Current primary occupation",
    fields: [
      {
        label: "Primary Occupation",
        guidance: "For H-1B applicants: select 'Computer Science' / 'Engineer' / 'Business' / etc. matching your field. Then enter your current employer (in India or wherever you currently work), full address, phone, and your monthly salary in local currency.",
      },
      {
        label: "Briefly describe your duties",
        guidance: "2–3 sentences describing what you actually do day-to-day. Keep it consistent with your H-1B petition's job description.",
      },
      {
        label: "If currently a student",
        guidance: "Select 'Student' as occupation and enter your current institution's full address, phone, and program details.",
      },
    ],
  },
  {
    id: "work-previous",
    title: "Work / Education / Training — Previous",
    subtitle: "Prior employment + all education from age 14",
    fields: [
      {
        label: "Were you previously employed?",
        guidance: "List all relevant past employment and substantial internships. For each: employer name, full address, dates, supervisor, and brief duties.",
        gotcha: "If any of your past work touches Technology Alert List fields (nuclear, missile, sensors, chemical/biological, certain AI/ML defense applications), be cautious — that work can trigger administrative processing (221(g)). Do not omit, but describe accurately and consult an attorney if concerned.",
      },
      {
        label: "Education",
        guidance: "List every institution attended after age 14, in reverse chronological order. Include college (undergrad and grad), Class 12 ('Higher Secondary - 12th Std - Academic'), and Class 10 only if you're applying for an undergrad program. Master's applicants typically don't need to list Class 10.",
      },
    ],
  },
  {
    id: "work-additional",
    title: "Work / Education / Training — Additional",
    subtitle: "Languages, organizations, travel history, military",
    fields: [
      {
        label: "Languages spoken",
        guidance: "List languages you speak/read/write reasonably well — typically English, Hindi, and any regional language.",
      },
      {
        label: "Countries visited in the last 5 years",
        guidance: "List every country you've traveled to in the last 5 years. Layovers count if you cleared immigration.",
      },
      {
        label: "Have you belonged to a professional, social, or charitable organization?",
        guidance: "Mention only meaningful affiliations — Rotaract, NSS, IEEE, ACM, professional associations, structured volunteering with named nonprofits. Casual memberships and one-off events don't count.",
      },
      {
        label: "Specialized skills / military service / involvement in armed conflict",
        guidance: "Answer truthfully. For most applicants these are 'No'. Specialized skills include things like demolition, firearms, and certain technical training.",
      },
    ],
  },
  {
    id: "security",
    title: "Security & Background (Parts 1–5)",
    subtitle: "The yes/no compliance questions",
    fields: [
      {
        label: "Parts 1–5: medical, criminal, security, immigration, miscellaneous",
        guidance: "Read each question carefully. For most applicants, the honest answer is 'No' across the board. If you have anything to disclose (arrest record, prior visa overstay, denial of entry, communicable disease history), select 'Yes' and provide a clear factual explanation.",
        gotcha: "Never lie here. A 'Yes' with a good explanation is almost always survivable; a 'No' that contradicts your record is an immediate denial under 6C1 (misrepresentation) which is a lifetime bar.",
      },
    ],
  },
  {
    id: "review-submit",
    title: "Review, Sign & Submit",
    subtitle: "Final steps and confirmation",
    fields: [
      {
        label: "Additional point of contact in your home country",
        guidance: "Provide 2 people in India who can verify you — friends, neighbors, distant relatives with a different surname. Their full name, address, phone, and relationship.",
      },
      {
        label: "SEVIS number + school details (F/M/J applicants only)",
        guidance: "Not applicable for H-1B/H-4. Skip.",
      },
      {
        label: "Did anyone assist you in filling out this application?",
        guidance: "Select 'No' unless an attorney or paid preparer literally filled it for you. Family or friends helping casually doesn't count.",
      },
      {
        label: "Review every page before signing",
        guidance: "Use the Review tab. Look for typos in passport number, dates, employer name, US address. After signing you cannot edit — only abandon and start over.",
      },
      {
        label: "Print the DS-160 confirmation page",
        guidance: "After submission, print the confirmation page with the barcode immediately. You'll need it for the OFC biometric appointment and the interview.",
        gotcha: "Once you log out you cannot reprint the full DS-160 form — only the confirmation page. Print or save a PDF before you leave the session.",
      },
    ],
  },
];
