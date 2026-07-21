/**
 * Rule-based ATS scoring. Runs entirely offline — no API calls.
 * Score is 0–100 across six weighted categories.
 */

export interface AtsCategory {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface AtsResult {
  total: number;
  categories: AtsCategory[];
  strengths: string[];
  issues: string[];
  wordCount: number;
}

const ACTION_VERBS = [
  "led", "built", "designed", "developed", "implemented", "launched",
  "improved", "increased", "reduced", "created", "managed", "owned",
  "shipped", "architected", "automated", "optimized", "delivered",
  "spearheaded", "coordinated", "mentored", "migrated", "refactored",
];

const SECTION_HEADINGS = {
  experience: /\b(experience|work history|employment|professional experience)\b/i,
  education: /\b(education|academic|qualifications)\b/i,
  skills: /\b(skills|technical skills|technologies|tech stack)\b/i,
  projects: /\b(projects?|portfolio)\b/i,
};

export function scoreResume(resumeText: string, jdText: string = ""): AtsResult {
  const text = resumeText || "";
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const strengths: string[] = [];
  const issues: string[] = [];

  // 1. Contact info (10)
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  const contactScore = (hasEmail ? 6 : 0) + (hasPhone ? 4 : 0);
  if (hasEmail && hasPhone) strengths.push("Contact info present (email + phone)");
  else issues.push(`Missing ${!hasEmail ? "email" : ""}${!hasEmail && !hasPhone ? " and " : ""}${!hasPhone ? "phone" : ""}`);

  // 2. Sections (25)
  const sectionHits = Object.entries(SECTION_HEADINGS)
    .filter(([, r]) => r.test(text))
    .map(([k]) => k);
  const sectionScore = Math.round((sectionHits.length / 4) * 25);
  if (sectionHits.length === 4) strengths.push("All key sections present (Experience, Education, Skills, Projects)");
  else {
    const missing = Object.keys(SECTION_HEADINGS).filter((k) => !sectionHits.includes(k));
    if (missing.length) issues.push(`Missing sections: ${missing.join(", ")}`);
  }

  // 3. Length (10) — sweet spot 400–1000 words
  let lengthScore = 0;
  let lengthDetail = "";
  if (wordCount === 0) {
    lengthDetail = "Empty resume";
    issues.push("Resume is empty");
  } else if (wordCount < 250) {
    lengthScore = 3;
    lengthDetail = `Too short (${wordCount} words)`;
    issues.push(`Resume is too short (${wordCount} words) — aim for 400–1000`);
  } else if (wordCount < 400) {
    lengthScore = 6;
    lengthDetail = `Slightly short (${wordCount} words)`;
  } else if (wordCount <= 1000) {
    lengthScore = 10;
    lengthDetail = `Ideal length (${wordCount} words)`;
    strengths.push(`Resume length is in the sweet spot (${wordCount} words)`);
  } else if (wordCount <= 1400) {
    lengthScore = 7;
    lengthDetail = `Slightly long (${wordCount} words)`;
  } else {
    lengthScore = 4;
    lengthDetail = `Too long (${wordCount} words)`;
    issues.push(`Resume is quite long (${wordCount} words) — consider trimming`);
  }

  // 4. Formatting hygiene (15)
  let formatScore = 15;
  const formatIssues: string[] = [];
  if (/[\uE000-\uF8FF]/.test(text)) {
    formatScore -= 5;
    formatIssues.push("contains private-use unicode (likely icons)");
  }
  if ((text.match(/\t/g)?.length ?? 0) > 20) {
    formatScore -= 3;
    formatIssues.push("many tab characters (tables?)");
  }
  const nonAscii = (text.match(/[^\x00-\x7F]/g)?.length ?? 0) / Math.max(text.length, 1);
  if (nonAscii > 0.05) {
    formatScore -= 3;
    formatIssues.push("high non-ASCII density");
  }
  formatScore = Math.max(0, formatScore);
  if (formatIssues.length === 0) strengths.push("Clean, ATS-friendly formatting");
  else issues.push(`Formatting: ${formatIssues.join("; ")}`);

  // 5. Action verbs + quantified impact (20)
  const lower = text.toLowerCase();
  const verbHits = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`).test(lower)).length;
  const quantHits = (text.match(/\b\d+(?:\.\d+)?%|\$\d[\d,]*|\b\d{2,}\b/g) ?? []).length;
  const verbScore = Math.min(10, verbHits);
  const quantScore = Math.min(10, Math.round(quantHits / 2));
  const impactScore = verbScore + quantScore;
  if (verbHits >= 6) strengths.push(`Strong use of action verbs (${verbHits} matches)`);
  else issues.push("Use more action verbs (led, built, shipped, improved…)");
  if (quantHits >= 4) strengths.push(`Quantified impact (${quantHits} numeric results)`);
  else issues.push("Add quantified results (%, $, counts) to bullet points");

  // 6. Keyword density vs JD (20)
  let keywordScore = 0;
  let keywordDetail = "No job description provided";
  if (jdText.trim().length > 0) {
    const jdTokens = tokenize(jdText);
    const resumeSet = new Set(tokenize(text));
    const overlap = jdTokens.filter((t) => resumeSet.has(t)).length;
    const ratio = overlap / Math.max(jdTokens.length, 1);
    keywordScore = Math.round(Math.min(1, ratio * 2.5) * 20);
    keywordDetail = `${Math.round(ratio * 100)}% keyword overlap with JD`;
    if (keywordScore >= 15) strengths.push("Strong keyword alignment with the job description");
    else if (keywordScore < 8) issues.push("Low keyword overlap with the job description");
  } else {
    // Give partial credit so the total isn't penalised when no JD is given
    keywordScore = 10;
    keywordDetail = "No JD — showing baseline credit";
  }

  const categories: AtsCategory[] = [
    { key: "contact", label: "Contact info", score: contactScore, max: 10, detail: hasEmail && hasPhone ? "Email + phone present" : "Add missing contact fields" },
    { key: "sections", label: "Sections", score: sectionScore, max: 25, detail: `${sectionHits.length}/4 core sections detected` },
    { key: "length", label: "Length", score: lengthScore, max: 10, detail: lengthDetail },
    { key: "formatting", label: "Formatting", score: formatScore, max: 15, detail: formatIssues.length ? formatIssues.join("; ") : "Clean" },
    { key: "impact", label: "Action verbs & impact", score: impactScore, max: 20, detail: `${verbHits} verbs, ${quantHits} quantified results` },
    { key: "keywords", label: "JD keyword match", score: keywordScore, max: 20, detail: keywordDetail },
  ];

  const total = categories.reduce((s, c) => s + c.score, 0);

  return { total, categories, strengths, issues, wordCount };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

const STOPWORDS = new Set([
  "the","and","for","with","you","your","are","our","who","from","that","this",
  "will","have","has","was","were","been","being","but","not","any","all","can",
  "into","out","use","using","used","per","via","etc","their","they","them",
  "when","what","how","why","which","also","more","less","than","then","some",
  "such","each","every","own","one","two","three","about","across","among",
  "role","team","teams","work","working","years","year","experience","job","jobs",
]);
