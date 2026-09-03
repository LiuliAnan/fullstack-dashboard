const SESSION_KEY = 'ai_agent_active_session';
const OPEN_KEY = 'ai_agent_window_open';
const DRAFT_KEY = 'ai_agent_draft';

export const chatStorage = {
  getSession: () => typeof window === 'undefined' ? null : localStorage.getItem(SESSION_KEY),
  setSession: (id: string) => localStorage.setItem(SESSION_KEY, id),
  clearSession: () => localStorage.removeItem(SESSION_KEY),
  getOpen: () => typeof window !== 'undefined' && localStorage.getItem(OPEN_KEY) === 'true',
  setOpen: (open: boolean) => localStorage.setItem(OPEN_KEY, String(open)),
  getDraft: () => typeof window === 'undefined' ? '' : localStorage.getItem(DRAFT_KEY) ?? '',
  setDraft: (draft: string) => localStorage.setItem(DRAFT_KEY, draft),
};
