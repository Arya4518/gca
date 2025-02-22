'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import NavBarView from '@/app/usersviewers/NavBarView';

interface User {
  username: string;
  live_total: number;
}

export default function RankingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [playersByUser, setPlayersByUser] = useState<Record<string, any[]>>({});
  const [cricketStats, setCricketStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase.from('users').select('username');
      if (usersError) throw usersError;

      // Fetch players with their owners
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('name, soldto');
      if (playersError) throw playersError;

      // Fetch cricket stats
      const { data: statsData, error: statsError } = await supabase
        .from('cricket_stats')
        .select('player, total_points');
      if (statsError) throw statsError;

      // Map stats by player name
      const statsMap = statsData?.reduce((acc, stat) => {
        acc[stat.player] = stat.total_points;
        return acc;
      }, {} as Record<string, number>);

      // Group players by users
      const groupedPlayers: Record<string, any[]> = {};
      playersData?.forEach((player) => {
        if (player.soldto) {
          if (!groupedPlayers[player.soldto]) {
            groupedPlayers[player.soldto] = [];
          }
          groupedPlayers[player.soldto].push(player);
        }
      });

      setPlayersByUser(groupedPlayers);
      setCricketStats(statsMap);

      // Calculate Live Total for each user
      const usersWithPoints = usersData.map((user) => ({
        username: user.username,
        live_total: groupedPlayers[user.username]?.reduce(
          (sum, player) => sum + (statsMap[player.name] ?? 0),
          0
        ) || 0,
      }));

      // Sort users by Live Total (Descending)
      usersWithPoints.sort((a, b) => b.live_total - a.live_total);

      setUsers(usersWithPoints);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
      <NavBarView />
      <div className="mx-auto bg-gradient-to-b from-blue-50 to-blue-100 p-6 sm:p-12 overflow-x-auto">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-900">User Rankings</h1>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table className="table-auto w-full border-collapse border border-gray-300 text-gray-800">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2">Rank</th>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">Live Total</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user.username}>
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.live_total}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}