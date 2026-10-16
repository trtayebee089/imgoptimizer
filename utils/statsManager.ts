
// This file handles the persistent statistics logic.
// currently it uses LocalStorage (Client-Side).
// To make this "Global for all users", you would replace the logic inside
// getStats() and updateStats() to call a database like Firebase or Supabase.

export interface GlobalStats {
  filesProcessed: number;
  totalProcessedBytes: number;
  savedBytes: number;
}

export const StatsManager = {
  getStats: async (): Promise<GlobalStats> => {
    try {
      if (typeof window === 'undefined' || !window.fetch) {
        return { filesProcessed: 0, totalProcessedBytes: 0, savedBytes: 0 };
      }
      const response = await fetch('/api/stats');
      return await response.json();
    } catch (e) {
      console.error("Stats load error", e);
      return { filesProcessed: 0, totalProcessedBytes: 0, savedBytes: 0 };
    }
  },

  updateStats: async (fileSize: number, savedAmount: number): Promise<GlobalStats> => {
    const current = await StatsManager.getStats();
    
    const updated = {
      filesProcessed: current.filesProcessed + 1,
      totalProcessedBytes: current.totalProcessedBytes + fileSize,
      savedBytes: current.savedBytes + savedAmount
    };
    
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      }
    } catch (e) {
      console.error("Stats save error", e);
    }
    return updated;
  },
  
  // Note: Subscription model for API-based backend needs websocket for real-time reactivity
  // This is a stub for now.
  subscribe: (callback: (stats: GlobalStats) => void) => {
    return () => {};
  }
};
