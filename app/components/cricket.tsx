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
import Navbar from './Navbar';

interface Player {
  id: number;
  name: string;
  team: string;
  role: string;
  basebid: number;
  sold: boolean | null;
  soldto: string | null;
  displayed: boolean | null;
  finalbid: number | null;
}

export default function Home() {
  const [soldAmount, setSoldAmount] = useState<string>('');
  const [soldTo, setSoldTo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [showRemaining, setShowRemaining] = useState(false);

  // Fetch random player for auction and store it in the liveplayers table
  const fetchRandomPlayerAndStoreInLive = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Mark the current player as displayed in the `players` table if one exists
      if (currentPlayer) {
        const { error: markError } = await supabase
          .from('players')
          .update({ displayed: true })
          .eq('id', currentPlayer.id);
  
        if (markError) {
          console.error('Error marking player as displayed:', markError.message);
          throw markError;
        }
      }
  
      // Fetch a random player from the `players` table
      const { data: players, error: fetchPlayersError } = await supabase
        .from('players')
        .select('*')
        .eq('displayed', false)
        .is('sold', null);
  
      if (fetchPlayersError) {
        console.error('Error fetching players:', fetchPlayersError.message);
        throw fetchPlayersError;
      }
  
      if (players && players.length > 0) {
        const randomIndex = Math.floor(Math.random() * players.length);
        const randomPlayer = players[randomIndex];
  
        // Check if the `liveplayer` table already has a record
        const { data: existingLivePlayer, error: fetchLivePlayerError } = await supabase
          .from('liveplayer')
          .select('*')
          .single();
  
        if (fetchLivePlayerError && fetchLivePlayerError.code !== 'PGRST116') {
          console.error('Error fetching live player:', fetchLivePlayerError.message);
          throw fetchLivePlayerError;
        }
  
        if (existingLivePlayer) {
          // Update the existing record in `liveplayer`
          const { error: updateLivePlayerError } = await supabase
            .from('liveplayer')
            .update({
              name: randomPlayer.name,
              role: randomPlayer.role,
              team: randomPlayer.team,
              basebid: randomPlayer.basebid,
              soldto: null,
              sold: null,
              displayed: null,
              finalbid: null,
            })
            .eq('id', existingLivePlayer.id);
  
          if (updateLivePlayerError) {
            console.error('Error updating live player:', updateLivePlayerError.message);
            throw updateLivePlayerError;
          }
        } else {
          const { error: insertLivePlayerError } = await supabase
            .from('liveplayer')
            .insert([
              {
                name: randomPlayer.name,
                role: randomPlayer.role,
                team: randomPlayer.team,
                basebid: randomPlayer.basebid,
                soldto: null,
                sold: null,
                displayed: null,
                finalbid: null,
              },
            ]);
  
          if (insertLivePlayerError) {
            console.error('Error inserting live player:', insertLivePlayerError.message);
            throw insertLivePlayerError;
          }
        }
  
        setCurrentPlayer(randomPlayer);
      } else {
        // If no players are left, clear the `liveplayer` table
        const { error: clearLivePlayerError } = await supabase
          .from('liveplayer')
          .delete()
          .neq('id', 0); // Dummy WHERE clause to allow DELETE operation
  
        if (clearLivePlayerError) {
          console.error('Error clearing live player:', clearLivePlayerError.message);
          throw clearLivePlayerError;
        }
  
        setError('No more players available for auction');
        setCurrentPlayer(null);
      }
    } catch (err) {
      console.error('Error in fetchRandomPlayerAndStoreInLive:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  
  

  // Fetch remaining unsold players
  const fetchRemainingPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('displayed', true)
        .is('sold', null);

      if (error) throw error;

      setUnsoldPlayers(data || []);
      setShowRemaining(true);
    } catch (err) {
      console.error('Error in fetchRemainingPlayers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch remaining players');
    } finally {
      setLoading(false);
    }
  };

  // Mark current player as sold
  const markAsSold = async () => {
    try {
      if (!currentPlayer || !soldTo || !soldAmount) return;

      if (Number(soldAmount) < currentPlayer.basebid) {
        setError('Sold amount cannot be less than base bid amount');
        return;
      }

      // Update `players` table
      const { error: playersError } = await supabase
        .from('players')
        .update({
          sold: true,
          soldto: soldTo,
          displayed: true,
          finalbid: soldAmount,
        })
        .eq('id', currentPlayer.id);

      // Clear the `liveplayers` table
      const { error: liveplayersError } = await supabase
        .from('liveplayer')
        .delete()
        .eq('id', currentPlayer.id);

      if (playersError || liveplayersError) throw playersError || liveplayersError;

      setSoldTo('');
      setSoldAmount('');
      setCurrentPlayer(null);
      fetchRandomPlayerAndStoreInLive();
    } catch (err) {
      console.error('Error in markAsSold:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as sold');
    }
  };

  const handleRemaining = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('displayed', true)
        .is('sold', null);

      if (error) throw error;

      setUnsoldPlayers(data || []);
      setShowRemaining(true);
    } catch (err) {
      console.error('Error in handleRemaining:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update individual player data
  const updatePlayer = async (playerId: number, soldTo: string, soldAmount: string) => {
    try {
      if (!soldTo || !soldAmount) return;

      const player = unsoldPlayers.find((p) => p.id === playerId);
      if (!player) return;

      if (Number(soldAmount) < player.basebid) {
        setError('Sold amount cannot be less than base bid amount');
        return;
      }

      const { error } = await supabase
        .from('players')
        .update({
          sold: true,
          soldto: soldTo,
          finalbid: soldAmount,  // Added finalbid update
        })
        .eq('id', playerId);

      if (error) throw error;

      // Update the local state
      setUnsoldPlayers((prev) =>
        prev.filter((player) => player.id !== playerId)
      );
    } catch (err) {
      console.error('Error in updatePlayer:', err);
      setError(err instanceof Error ? err.message : 'Failed to update player');
    }
  };



  useEffect(() => {
    fetchRandomPlayerAndStoreInLive();
  }, []);

  return (
    <main className="min-h-screen bg-white text-black ">
      <Navbar/>
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-100 rounded-xl shadow-lg p-6 border border-gray-300 w-fit place-self-center m-24">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : showRemaining ? (
            <table className="w-fit max-w-96 table-auto border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black px-4 py-2">Name</th>
                      <th className="border border-black px-4 py-2">Role</th>
                      <th className="border border-black px-4 py-2">Team</th>
                      <th className="border border-black px-4 py-2">Base Bid</th>
                      <th className="border border-black px-4 py-2">Sold To</th>
                      <th className="border border-black px-4 py-2">Final Bid</th>
                      <th className="border border-black px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unsoldPlayers.map((player) => (
                      <tr key={player.id}>
                        <td className="border border-black px-4 py-2">{player.name}</td>
                        <td className="border border-black px-4 py-2">{player.role}</td>
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
                        <td className="border border-black px-4 py-2">{player.basebid}</td>
                        <td className="border border-black px-4 py-2 relative">
                          <input
                            type="text"
                            onChange={(e) =>
                              setUnsoldPlayers((prev) =>
                                prev.map((p) =>
                                  p.id === player.id ? { ...p, soldto: e.target.value } : p
                                )
                              )
                            }
                            value={player.soldto || ''}
                            className="w-40 p-2 border border-black rounded"
                            placeholder ="Enter buyer"
                          />
                        </td>
                        <td className="border border-black px-4 py-2 relative">
                              <input
                                type="number"
                                onChange={(e) =>
                                  setUnsoldPlayers((prev) =>
                                    prev.map((p) =>
                                      p.id === player.id
                                        ? { ...p, finalbid: Number(e.target.value) }
                                        : p
                                    )
                                  )
                                }
                                value={player.finalbid || ''}
                                className="w-20 p-2 border border-black rounded no-arrows"
                                placeholder="Enter final bid"
                              />
                            </td>
                        <td className="border border-black px-4 py-2 text-center">
                          <button
                            onClick={() =>
                              player.soldto && player.finalbid && updatePlayer(player.id, player.soldto, String(player.finalbid))
                            }
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

          ) : currentPlayer ? (
            <div>
              <h2 className="text-3xl place-self-center font-bold mb-4">{currentPlayer.name}</h2>
              <div className="flex justify-between items-center space-x-4 mb-4">
                <h2 className="text-xl">Team: <span className="font-bold">{currentPlayer.team}</span></h2>
                 {/* Conditional Rendering of Images */}
                 {currentPlayer.team === 'India' && (
                      <Image
                        src={india}
                        alt="India Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Australia' && (
                      <Image
                        src={australia}
                        alt="Australia Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'England' && (
                      <Image
                        src={england}
                        alt="England Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Pakistan' && (
                      <Image
                        src={pakistan}
                        alt="Pakistan Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'South Africa' && (
                      <Image
                        src={southafrica}
                        alt="South Africa Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'New Zealand' && (
                      <Image
                        src={newzealand}
                        alt="New Zealand Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Bangladesh' && (
                      <Image
                        src={bangladesh}
                        alt="Bangladesh Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Afghanistan' && (
                      <Image
                        src={afghanistan}
                        alt="Afghanistan Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                      
                  </div>
                  <div className="flex justify-between items-center space-x-4 mb-4">
                    <h2 className="text-xl">Role: <span className="font-bold">{currentPlayer.role}</span> </h2>
                    <h2 className="text-3xl ">₹<span className="font-bold text-3xl mr-8">{currentPlayer.basebid}</span>
                    </h2>
                    </div>
              <div className="space-x-4 mb-4">
                <input
                  type="text"
                  className="w-fit p-2 border border-black rounded mb-4"
                  placeholder="Enter buyer"
                  value={soldTo}
                  onChange={(e) => setSoldTo(e.target.value)}
                />
                <input
                  type="number"
                  className="w-fit p-2 border border-black rounded mb-4"
                  placeholder="Enter sold amount"
                  value={soldAmount}
                  onChange={(e) => setSoldAmount(e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={markAsSold}
                  className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Mark as Sold
                </button>
                <button
                  onClick={fetchRandomPlayerAndStoreInLive}
                  className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Next Player
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <button
                onClick={fetchRemainingPlayers}
                className="mt-4 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-black transition-colors"
              >
                Show Remaining Players
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
