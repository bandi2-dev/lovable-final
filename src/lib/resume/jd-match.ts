/**
 * Compare a resume against a job description: overlap %, matched + missing keywords.
 */

const SKILL_DICTIONARY = [
  // Languages
  "javascript","typescript","python","java","c++","c#","go","golang","rust","ruby","php","kotlin","swift","scala","r","matlab","sql",
  // Frontend
  "react","next.js","vue","angular","svelte","redux","tailwind","html","css","sass","webpack","vite",
  // Backend
  "node.js","express","nestjs","django","flask","fastapi","spring","spring boot","rails","laravel","graphql","rest","grpc",
  // Data / ML
  "pandas","numpy","scikit-learn","tensorflow","pytorch","keras","hugging face","llm","nlp","computer vision","opencv","spark","hadoop","kafka","airflow","dbt",
  // Cloud / DevOps
  "aws","gcp","azure","docker","kubernetes","terraform","ansible","jenkins","github actions","gitlab ci","circleci","helm","istio","prometheus","grafana","datadog",
  // Databases
  "postgres","postgresql","mysql","mongodb","redis","elasticsearch","dynamodb","cassandra","sqlite","snowflake","bigquery",
  // Testing / practices
  "jest","vitest","cypress","playwright","selenium","junit","tdd","bdd","agile","scrum","kanban","ci/cd",
  // Misc
  "linux","bash","git","microservices","serverless","oauth","jwt","websockets","webrtc","stripe","supabase","firebase",
];

const STOPWORDS = new Set([
  "the","and","for","with","you","your","are","our","who","from","that","this","will","have","has","was","were","been",
  "being","but","not","any","all","can","into","out","use","using","used","per","via","etc","their","they","them",
  "when","what","how","why","which","also","more","less","than","then","some","such","each","every","own","one","two",
  "three","about","across","among","role","team","teams","work","working","years","year","experience","job","jobs",
  "responsibilities","requirements","preferred","required","must","should","strong","good","excellent","ability","skills",
]);

export interface JdMatch {
  overlapPercent: number;
  matched: string[];
  missing: string[];
  extraKeywords: string[];
}

export function matchJd(resumeText: string, jdText: string): JdMatch {
  if (!jdText.trim()) {
    return { overlapPercent: 0, matched: [], missing: [], extraKeywords: [] };
  }
  const resumeLower = " " + resumeText.toLowerCase() + " ";
  const jdLower = " " + jdText.toLowerCase() + " ";

  // Skills from the curated dictionary
  const jdSkills = new Set<string>();
  const resumeSkills = new Set<string>();
  for (const skill of SKILL_DICTIONARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`[^a-z0-9]${escaped}[^a-z0-9]`);
    if (re.test(jdLower)) jdSkills.add(skill);
    if (re.test(resumeLower)) resumeSkills.add(skill);
  }

  // Generic important terms in the JD (capitalized words + long tokens)
  const jdTerms = new Set<string>(jdSkills);
  for (const raw of jdText.split(/\s+/)) {
    const t = raw.toLowerCase().replace(/[^a-z0-9+#./-]/g, "");
    if (t.length > 4 && !STOPWORDS.has(t)) jdTerms.add(t);
  }

  const resumeTokens = new Set(
    resumeText
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9+#./-]/g, ""))
      .filter((t) => t.length > 2),
  );

  const matched: string[] = [];
  const missing: string[] = [];
  for (const term of jdTerms) {
    if (resumeSkills.has(term) || resumeTokens.has(term)) matched.push(term);
    else missing.push(term);
  }

  const extraKeywords = [...resumeSkills].filter((s) => !jdSkills.has(s));

  const overlapPercent =
    jdTerms.size > 0 ? Math.round((matched.length / jdTerms.size) * 100) : 0;

  // Prioritize skill-dictionary hits at the top of the lists
  const rank = (a: string, b: string) => {
    const aSkill = SKILL_DICTIONARY.includes(a) ? 0 : 1;
    const bSkill = SKILL_DICTIONARY.includes(b) ? 0 : 1;
    return aSkill - bSkill || a.localeCompare(b);
  };

  return {
    overlapPercent,
    matched: matched.sort(rank).slice(0, 40),
    missing: missing.sort(rank).slice(0, 30),
    extraKeywords: extraKeywords.slice(0, 20),
  };
}
