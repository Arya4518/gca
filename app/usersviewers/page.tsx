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
import NavBarView from '@/app/usersviewers/NavBarView'


interface Player {
  id: number;
  name: string;
  role: string;
  basebid: number;
  soldto: string | null;
  team: string;
  finalbid: string;
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
  const [users, setUsers] = useState<Record<string, User>>({});  // Store users' data by username
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch players and users data
  const fetchPlayersByUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users' data (balance, spent, etc.)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) throw usersError;

      const usersMap: Record<string, User> = {};
      (usersData || []).forEach((user: any) => {
        usersMap[user.username] = {
          username: user.username,
          balance: user.balance,
          spent: user.spent,
          maxbid: user.maxbid,  // Default to 100 if not set
          averagebidleft: user.averagebidleft, // Default to 100 if not set
        };
      });

      // Fetch players data
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .not('soldto', 'is', null);

      if (playersError) throw playersError;

      const groupedPlayers: Record<string, Player[]> = {};

      (playersData || []).forEach((player: Player) => {
        if (player.soldto) {
          if (!groupedPlayers[player.soldto]) {
            groupedPlayers[player.soldto] = [];
          }
          groupedPlayers[player.soldto].push(player);
        }
      });

      setPlayersByUser(groupedPlayers);
      setUsers(usersMap);

    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayersByUser();
  }, []);

  return (
    
    <main className="bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
        
        <NavBarView/>
      <div className=" mx-auto  bg-gradient-to-b from-blue-50 to-blue-100 p-6 sm:p-12 overflow-x-auto">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-900">Players Bought by Each User</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <div className="flex flex-row  gap-8 ">
            {Object.keys(playersByUser).map((user) => (
              <div key={user} className="bg-white shadow-md rounded-lg w-fit gap-8 flex-grow">
                <h2 className="text-xl font-semibold bg-blue-100 p-4 text-blue-900">
                  {user}'s Players
                </h2>
                <div className="p-4 text-gray-900">
                  {/* Displaying user info */}
                  {users[user] && (
                    <div>
                      <p>Balance: {users[user].balance}</p>
                      <p>Spent: {users[user].spent}</p>
                      <p>Max Possible Bid: {users[user].maxbid}</p>
                      <p>Average Bid Left: {users[user].averagebidleft}</p>
                    </div>
                  )}
                </div>
                <table className="table-auto w-full  border-collapse border border-gray-300 text-gray-800">
                  <thead className="bg-gray-100">
                    <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Sr. No.</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Player Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Final Bid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersByUser[user] && playersByUser[user].length > 0 ? (
                      playersByUser[user].map((player, index) => (
                        <tr key={player.id}>
                          <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">{player.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{player.role}</td>
                          <td className="border border-gray-300 px-4 py-2 relative" style={{ height: '6rem' }}>
                              {/* Bottom Layer: Flag */}
                              {player.team === 'India' && (
                                <Image
                                  src={india}
                                  alt="India Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Australia' && (
                                <Image
                                  src={australia}
                                  alt="Australia Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'England' && (
                                <Image
                                  src={england}
                                  alt="England Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'South Africa' && (
                                <Image
                                  src={southafrica}
                                  alt="South Africa Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Pakistan' && (
                                <Image
                                  src={pakistan}
                                  alt="Pakistan Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Bangladesh' && (
                                <Image
                                  src={bangladesh}
                                  alt="Bangladesh Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Afghanistan' && (
                                <Image
                                  src={afghanistan}
                                  alt="Afghanistan Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'New Zealand' && (
                                <Image
                                  src={newzealand}
                                  alt="New Zealand Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {/* Middle Layer: Black Overlay */}
                              <div className="absolute inset-0 bg-black/50"></div>

                              {/* Top Layer: Text */}
                              <span className="relative z-10 text-white font-bold text-center block">
                                {player.team}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{player.finalbid}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                        >
                          No players bought
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
            ))}
          </div>
          </div>
        )}
      </div>
    </main>
   
  );
}