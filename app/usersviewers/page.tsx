'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import india from '@/public/india.jpeg';
import bangladesh from '@/public/bangladesh.jpeg';
import afghanistan from '@/public/afghanistan.jpeg';
import england from '@/public/england.jpeg';
import southafrica from '@/public/southafrica.jpeg';
import australia from '@/public/australia.jpeg';
import pakistan from '@/public/pakistan.jpeg';
import newzealand from '@/public/newzealand.jpeg';
import NavBarView from '@/app/usersviewers/NavBarView';

interface CricketStats {
  player: string;
  total_points: number;
}

interface Player {
  id: number;
  name: string;
  role: string;
  team: string;
  soldto: string | null;
  total_points?: number;
}

interface User {
  username: string;
  balance: number;
  spent: number;
  maxbid: number;
  averagebidleft: number;
}

export default function UserPage() {
  const [playersByUser, setPlayersByUser] = useState<Record<string, Player[]>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  const [cricketStats, setCricketStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayersAndStats = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("username, balance, spent, maxbid, averagebidleft");
      if (usersError) throw usersError;
  
      console.log("Fetched users:", usersData); // Debugging
  
      // Store users by username
      const usersMap: Record<string, User> = {};
      usersData?.forEach((user) => {
        usersMap[user.username] = user;
      });
  
      console.log("Users map:", usersMap); // Debugging
  
      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name, role, team, soldto")
        .not("soldto", "is", null);
      if (playersError) throw playersError;
  
      console.log("Fetched players:", playersData); // Debugging
  
      // Fetch cricket stats
      const { data: statsData, error: statsError } = await supabase
        .from("cricket_stats")
        .select("player, total_points");
      if (statsError) throw statsError;
  
      console.log("Fetched cricket stats:", statsData); // Debugging
  
      // Map stats by player name
      const statsMap = statsData?.reduce((acc, stat) => {
        acc[stat.player] = stat.total_points;
        return acc;
      }, {} as Record<string, number>);
  
      console.log("Cricket stats map:", statsMap); // Debugging
  
      // Group players by soldto (username)
      const groupedPlayers: Record<string, Player[]> = {};
      playersData?.forEach((player) => {
        console.log("Processing player:", player); // Debugging
  
        const formattedPlayer: Player = {
          ...player,
          total_points: statsMap[player.name] ?? 0,
        };
  
        const username = player.soldto || "";
        if (!username) {
          console.warn("Player has no soldto (username is empty):", player);
        }
  
        if (!groupedPlayers[username]) {
          groupedPlayers[username] = [];
        }
        groupedPlayers[username].push(formattedPlayer);
      });
  
      console.log("Grouped players by username:", groupedPlayers); // Debugging
  
      setPlayersByUser(groupedPlayers);
      setUsers(usersMap);
      setCricketStats(statsMap);
    } catch (err) {
      console.error("Error fetching players:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  const fetchData = async () => {
    try {
      const res = await fetch("/api/scrapeStats");
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Runs only once on mount
  }, []);

  useEffect(() => {
    fetchPlayersAndStats();
  }, []);

  // Function to calculate live_total dynamically
  const calculateLiveTotal = (username: string) => {
    return (playersByUser[username] || []).reduce((total, player) => total + (player.total_points || 0), 0);
  };

  return (
    <main className="bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
      <NavBarView />
      <div className="mx-auto bg-gradient-to-b from-blue-50 to-blue-100 p-6 sm:p-12 overflow-x-auto">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-900">Players Bought by Each User</h1>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto flex flex-row gap-8">
            {Object.keys(playersByUser).map((user) => (
              <div key={user} className="bg-white shadow-md rounded-lg w-fit gap-8 flex-grow">
                <h2 className="text-xl font-semibold bg-blue-100 p-4 text-blue-900">{user}'s Players</h2>
                <div className="p-4 text-gray-900">
                  {users[user] && (
                    <div>
                      <p>Balance: {users[user].balance}</p>
                      <p>Spent: {users[user].spent}</p>
                      <p>Max Possible Bid: {users[user].maxbid}</p>
                      <p>Average Bid Left: {users[user].averagebidleft}</p>
                      <p className="font-bold text-green-600">Live Total: {calculateLiveTotal(user)}</p>
                    </div>
                  )}
                </div>
                <table className="table-auto w-full border-collapse border border-gray-300 text-gray-800">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Sr. No.</th>
                      <th className="border border-gray-300 px-4 py-2">Player Name</th>
                      <th className="border border-gray-300 px-4 py-2">Role</th>
                      <th className="border border-gray-300 px-4 py-2">Team</th>
                      <th className="border border-gray-300 px-4 py-2">Total Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersByUser[user]?.length > 0 ? (
                      playersByUser[user].map((player, index) => (
                        <tr key={player.id}>
                          <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">{player.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{player.role}</td>
                          <td className="border border-gray-300 px-4 py-2 relative h-24">
                            <Image
                              src={
                                {
                                  India: india,
                                  Australia: australia,
                                  England: england,
                                  'South Africa': southafrica,
                                  Pakistan: pakistan,
                                  Bangladesh: bangladesh,
                                  Afghanistan: afghanistan,
                                  'New Zealand': newzealand,
                                }[player.team] || india
                              }
                              alt={player.team}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50" />
                            <span className="relative z-10 text-white font-bold text-center block">{player.team}</span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{player.total_points}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                          No players bought
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}