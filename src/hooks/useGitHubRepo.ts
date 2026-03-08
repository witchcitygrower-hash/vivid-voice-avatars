import { useState, useEffect, useCallback } from 'react';

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  license: { name: string } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  default_branch: string;
  visibility: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

export interface GitHubLanguages {
  [key: string]: number;
}

export interface GitHubData {
  repo: GitHubRepo | null;
  commits: GitHubCommit[];
  contributors: GitHubContributor[];
  languages: GitHubLanguages;
}

export function useGitHubRepo(owner: string, repo: string) {
  const [data, setData] = useState<GitHubData>({ repo: null, commits: [], contributors: [], languages: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
      const base = `https://api.github.com/repos/${owner}/${repo}`;

      const [repoRes, commitsRes, contribRes, langRes] = await Promise.allSettled([
        fetch(base, { headers }),
        fetch(`${base}/commits?per_page=8`, { headers }),
        fetch(`${base}/contributors?per_page=10`, { headers }),
        fetch(`${base}/languages`, { headers }),
      ]);

      const repoData = repoRes.status === 'fulfilled' && repoRes.value.ok ? await repoRes.value.json() : null;
      const commitsData = commitsRes.status === 'fulfilled' && commitsRes.value.ok ? await commitsRes.value.json() : [];
      const contribData = contribRes.status === 'fulfilled' && contribRes.value.ok ? await contribRes.value.json() : [];
      const langData = langRes.status === 'fulfilled' && langRes.value.ok ? await langRes.value.json() : {};

      if (!repoData) {
        setError('Repository not found or is private');
      }

      setData({ repo: repoData, commits: commitsData, contributors: contribData, languages: langData });
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, lastFetched, refetch: fetchData };
}
