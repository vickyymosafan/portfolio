import { portfolio } from './portfolio.js';

const GITHUB_USERNAME = 'vickyymosafan';
const CONTRIBUTIONS_API_URL = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`;
const USER_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`;
const REPOS_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=6`;
const CACHE_KEY = 'cv_github_live_sync_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes fresh cache, with background revalidation

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let latestSnapshot = null;
let inflightPromise = null;
const listeners = new Set();

function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-US');
}

/**
 * Groups flat daily contribution records into Sunday-start weeks (7 slots each)
 * and extracts the ordered 12-month header labels matching GitHub's calendar.
 */
function buildCalendarWeeks(contributions = []) {
  if (!Array.isArray(contributions) || contributions.length === 0) {
    return { weeks: [], months: portfolio.content.process.githubStats.months };
  }

  const weeks = [];
  let currentWeek = new Array(7).fill(null);

  for (let i = 0; i < contributions.length; i += 1) {
    const entry = contributions[i];
    const dt = new Date(`${entry.date}T00:00:00Z`);
    const dow = dt.getUTCDay(); // 0 = Sun ... 6 = Sat

    if (dow === 0 && i > 0) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(null);
    }

    currentWeek[dow] = {
      date: entry.date,
      count: Number(entry.count || 0),
      level: Math.max(0, Math.min(4, Number(entry.level || 0))),
    };
  }

  if (currentWeek.some((cell) => cell !== null)) {
    weeks.push(currentWeek);
  }

  // Compute unique consecutive month labels across the weeks
  const monthLabels = [];
  let lastMonth = -1;
  for (const week of weeks) {
    const firstValidDay = week.find((d) => d !== null);
    if (!firstValidDay) continue;
    const m = new Date(`${firstValidDay.date}T00:00:00Z`).getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push(MONTH_NAMES[m]);
      lastMonth = m;
    }
  }

  // Keep the most recent 12 month transitions so the 12-column CSS header stays aligned
  const months = monthLabels.length > 12 ? monthLabels.slice(monthLabels.length - 12) : monthLabels;

  return { weeks, months };
}

/**
 * Mutates `portfolio.content.process` and `portfolio.content.contact` in-place
 * so every UI component (Cinematic Card, Quick Detail Panel, 3D Sign Board,
 * World Markers, and Tour Stops) stays 100% synchronized with live GitHub data.
 */
function applySnapshotToPortfolio(snapshot) {
  if (!snapshot || !portfolio?.content?.process) return;

  const {
    totalContributions,
    publicRepos,
    weeks,
    months,
    topRepos,
    syncedAt,
    isLive,
  } = snapshot;

  const formattedTotal = formatNumber(totalContributions);
  const proc = portfolio.content.process;
  const gh = proc.githubStats;

  proc.title = `${formattedTotal} Contributions in the Last Year`;
  if (publicRepos > 0) {
    proc.lead = `Verified multi-year GitHub commit activity and automated CI/CD telemetry across ${publicRepos}+ public repositories—backed by a disciplined 6-stage AI-Augmented Engineering Pipeline.`;
  }

  gh.totalContributions = `${formattedTotal} contributions in the last year`;
  gh.totalCount = totalContributions;
  gh.publicRepos = publicRepos;
  gh.profileUrl = gh.url || `https://github.com/${GITHUB_USERNAME}`;
  gh.months = months && months.length ? months : gh.months;
  gh.weeks = weeks;
  gh.topRepos = topRepos && topRepos.length ? topRepos : gh.topRepos;
  gh.syncedAt = syncedAt;
  gh.isLive = Boolean(isLive);

  gh.highlights = [
    `${formattedTotal}+ verified contributions in the last year across production repositories`,
    `${publicRepos || 35}+ public repositories including Model Context Protocol (MCP) tooling, Next.js 15, TypeScript, NestJS, Laravel, Hono & Python`,
    'Active author of BUILDFlow ERP, MCP Three.js Visual QA, MCP Principal Agentic Harness, Beyond-RAG ASI & Posyandu Digital',
  ];

  proc.tags = [
    `${formattedTotal} Contributions`,
    `github.com/${GITHUB_USERNAME}`,
    'SOLID Principles',
    'Deterministic PRDs',
    'GitHub Actions',
  ];

  if (portfolio.content.contact?.links) {
    const ghLink = portfolio.content.contact.links.find((l) => l.href && l.href.includes('github.com'));
    if (ghLink) {
      ghLink.detail = `github.com/${GITHUB_USERNAME} · ${formattedTotal} contributions`;
    }
  }
}

function readCachedSnapshot() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.totalContributions !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedSnapshot(snapshot) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

function notifyListeners(snapshot) {
  for (const cb of listeners) {
    try {
      cb(snapshot);
    } catch {
      // Ignore individual subscriber errors
    }
  }
  if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent('github-stats-updated', { detail: snapshot }));
  }
}

/**
 * Fetches live GitHub contribution calendar, repository count, and recently pushed
 * repositories directly from public CORS-enabled GitHub endpoints.
 */
export async function syncLiveGitHubStats({ force = false } = {}) {
  const cached = readCachedSnapshot();
  if (cached && !latestSnapshot) {
    latestSnapshot = { ...cached, isLive: true };
    applySnapshotToPortfolio(latestSnapshot);
  }

  const now = Date.now();
  if (!force && cached && now - (cached.syncedAt || 0) < CACHE_TTL_MS) {
    notifyListeners(latestSnapshot);
    return latestSnapshot;
  }

  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    try {
      const [contribRes, userRes, reposRes] = await Promise.allSettled([
        fetch(CONTRIBUTIONS_API_URL, { headers: { Accept: 'application/json' } }),
        fetch(USER_API_URL, { headers: { Accept: 'application/vnd.github+json' } }),
        fetch(REPOS_API_URL, { headers: { Accept: 'application/vnd.github+json' } }),
      ]);

      let totalContributions = cached?.totalContributions || 1046;
      let contributions = [];

      if (contribRes.status === 'fulfilled' && contribRes.value.ok) {
        const data = await contribRes.value.json();
        if (data?.total && typeof data.total.lastYear === 'number') {
          totalContributions = data.total.lastYear;
        }
        if (Array.isArray(data?.contributions)) {
          contributions = data.contributions;
        }
      } else {
        throw new Error('Failed to fetch live GitHub contribution calendar');
      }

      let publicRepos = cached?.publicRepos || 38;
      if (userRes.status === 'fulfilled' && userRes.value.ok) {
        const uData = await userRes.value.json();
        if (typeof uData?.public_repos === 'number') {
          publicRepos = uData.public_repos;
        }
      }

      let topRepos = cached?.topRepos || [
        'fullstack_buildflow-erp',
        'mcp_principal-agentic-harness',
        'mcp_threejs-visual-qa',
        'FE_Beyond-RAG-Artificial-Super-Intelligence',
      ];
      if (reposRes.status === 'fulfilled' && reposRes.value.ok) {
        const rData = await reposRes.value.json();
        if (Array.isArray(rData) && rData.length > 0) {
          topRepos = rData
            .map((r) => r?.name)
            .filter((name) => Boolean(name) && name.toLowerCase() !== GITHUB_USERNAME)
            .slice(0, 4);
        }
      }

      const { weeks, months } = buildCalendarWeeks(contributions);

      const snapshot = {
        username: GITHUB_USERNAME,
        totalContributions,
        publicRepos,
        weeks,
        months,
        topRepos,
        syncedAt: Date.now(),
        isLive: true,
      };

      latestSnapshot = snapshot;
      writeCachedSnapshot(snapshot);
      applySnapshotToPortfolio(snapshot);
      notifyListeners(snapshot);
      return snapshot;
    } catch {
      if (latestSnapshot) {
        notifyListeners(latestSnapshot);
        return latestSnapshot;
      }
      return null;
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

export function onGitHubStatsUpdated(callback) {
  if (typeof callback !== 'function') return () => {};
  listeners.add(callback);
  if (latestSnapshot) {
    callback(latestSnapshot);
  }
  return () => listeners.delete(callback);
}

export function getLatestGitHubSnapshot() {
  return latestSnapshot;
}

